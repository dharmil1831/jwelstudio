import {
  getImageProviderPreference,
  isGeminiConfigured,
  isOpenAIConfigured,
} from "@/lib/env";
import { generateJewelryWithGemini, type GeminiExtraImage } from "@/lib/gemini";
import { generateJewelryModelShot } from "@/lib/openai";
import type { OpenAIImageSize, OutputFormat } from "@/lib/style-options";
import { OUTPUT_FORMAT_SIZES } from "@/lib/style-options";

export type ImageProviderId = "openai" | "gemini";

export type GeneratedJewelryImage = {
  imageBase64: string;
  mimeType: string;
  provider: ImageProviderId;
  attempted: ImageProviderId[];
  droppedReferences?: boolean;
};

function isFallbackWorthy(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|timed out|abort|429|401|403|500|502|503|504|rate limit|quota|billing|no credits remaining|insufficient.?quota|invalid.?api.?key|incorrect.?api.?key|model.?not.?found|does not exist|deprecated|unavailable|overloaded|ECONNRESET|ENOTFOUND|fetch failed|no image data|OPENAI_API_KEY|GEMINI_API_KEY|request failed|platform\.openai\.com/i.test(
    message,
  );
}

export function sanitizeProviderError(
  error: unknown,
  provider?: ImageProviderId,
): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  console.error("[image-provider]", provider ?? "unknown", message.slice(0, 500));

  if (
    /no credits remaining|insufficient.?quota|exceeded.+quota|resource.?exhausted|quota.?exceeded|billing details|check your plan/i.test(
      message,
    )
  ) {
    return new Error(
      "Could not generate right now. Please try again in a moment.",
    );
  }

  if (/api key|permission|403|401|invalid/i.test(lower) && /key|auth|permission/i.test(lower)) {
    return new Error(
      "Could not generate right now. Please try again in a moment.",
    );
  }

  if (/model.?not.?found|not found|does not exist|not supported/i.test(message)) {
    return new Error(
      "Could not generate right now. Please try again in a moment.",
    );
  }

  if (/timeout|timed out|abort/i.test(message)) {
    return new Error(
      "This is taking too long. Please try again.",
    );
  }

  return new Error(
    "Could not generate right now. Please try again in a moment.",
  );
}

async function runOpenAI(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  format: OutputFormat,
): Promise<{ imageBase64: string; mimeType: string }> {
  const size: OpenAIImageSize = OUTPUT_FORMAT_SIZES[format] ?? "1024x1024";
  return generateJewelryModelShot(imageBase64, mimeType, prompt, size);
}

async function runGemini(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  format: OutputFormat,
  extraImages?: GeminiExtraImage[],
  wornOnModel?: boolean,
  aspectRatio?: string,
  imageSize?: "1K" | "2K",
): Promise<{ imageBase64: string; mimeType: string }> {
  return generateJewelryWithGemini(
    imageBase64,
    mimeType,
    prompt,
    format,
    extraImages,
    wornOnModel,
    aspectRatio,
    { imageSize: imageSize ?? "1K" },
  );
}

async function geminiWithOptionalRetry(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  format: OutputFormat;
  extraImages?: GeminiExtraImage[];
  wornOnModel?: boolean;
  aspectRatio?: string;
  imageSize?: "1K" | "2K";
  attempted: ImageProviderId[];
}): Promise<GeneratedJewelryImage> {
  const {
    imageBase64,
    mimeType,
    prompt,
    format,
    extraImages,
    wornOnModel,
    aspectRatio,
    imageSize,
    attempted,
  } = params;
  try {
    const out = await runGemini(
      imageBase64,
      mimeType,
      prompt,
      format,
      extraImages,
      wornOnModel,
      aspectRatio,
      imageSize,
    );
    return { ...out, provider: "gemini", attempted };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (!extraImages?.length || /timed out|timeout|abort/i.test(message)) {
      throw error;
    }
    const out = await runGemini(
      imageBase64,
      mimeType,
      prompt,
      format,
      undefined,
      wornOnModel,
      aspectRatio,
      imageSize,
    );
    return { ...out, provider: "gemini", attempted, droppedReferences: true };
  }
}

export async function generateJewelryImage(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  format: OutputFormat;
  extraImages?: GeminiExtraImage[];
  wornOnModel?: boolean;
  aspectRatio?: string;
  imageSize?: "1K" | "2K";
}): Promise<GeneratedJewelryImage> {
  const {
    imageBase64,
    mimeType,
    prompt,
    format,
    extraImages,
    wornOnModel,
    aspectRatio,
    imageSize,
  } = params;
  const preference = getImageProviderPreference();
  const attempted: ImageProviderId[] = [];

  const openaiReady = isOpenAIConfigured();
  const geminiReady = isGeminiConfigured();
  const hasExtras = Boolean(extraImages?.length);

  if (preference === "openai") {
    if (hasExtras) {
      throw new Error(
        "Logo / reference images require Gemini. Set IMAGE_PROVIDER=gemini or auto.",
      );
    }
    if (!openaiReady) throw new Error("OPENAI_API_KEY is not configured");
    attempted.push("openai");
    try {
      const out = await runOpenAI(imageBase64, mimeType, prompt, format);
      return { ...out, provider: "openai", attempted };
    } catch (e) {
      throw sanitizeProviderError(e, "openai");
    }
  }

  if (preference === "gemini") {
    if (!geminiReady) throw new Error("GEMINI_API_KEY is not configured");
    attempted.push("gemini");
    try {
      return await geminiWithOptionalRetry({
        imageBase64,
        mimeType,
        prompt,
        format,
        extraImages,
        wornOnModel,
        aspectRatio,
        imageSize,
        attempted,
      });
    } catch (e) {
      throw sanitizeProviderError(e, "gemini");
    }
  }

  const primary: ImageProviderId | null = geminiReady
    ? "gemini"
    : openaiReady
      ? "openai"
      : null;
  const fallback: ImageProviderId | null =
    primary === "gemini" && openaiReady && !hasExtras
      ? "openai"
      : primary === "openai" && geminiReady
        ? "gemini"
        : null;

  if (!primary) {
    throw new Error(
      "No image provider configured. Set GEMINI_API_KEY and/or OPENAI_API_KEY.",
    );
  }

  if (primary === "openai" && hasExtras) {
    throw new Error(
      "Logo / reference images require Gemini. Configure GEMINI_API_KEY.",
    );
  }

  attempted.push(primary);
  try {
    if (primary === "gemini") {
      return await geminiWithOptionalRetry({
        imageBase64,
        mimeType,
        prompt,
        format,
        extraImages,
        wornOnModel,
        aspectRatio,
        imageSize,
        attempted,
      });
    }
    const out = await runOpenAI(imageBase64, mimeType, prompt, format);
    return { ...out, provider: primary, attempted };
  } catch (primaryError) {
    if (!fallback || !isFallbackWorthy(primaryError)) {
      throw sanitizeProviderError(primaryError, primary);
    }

    attempted.push(fallback);
    try {
      const out =
        fallback === "openai"
          ? await runOpenAI(imageBase64, mimeType, prompt, format)
          : await runGemini(
              imageBase64,
              mimeType,
              prompt,
              format,
              extraImages,
              wornOnModel,
              aspectRatio,
              imageSize,
            );
      return { ...out, provider: fallback, attempted };
    } catch (fallbackError) {
      throw sanitizeProviderError(fallbackError, fallback);
    }
  }
}
