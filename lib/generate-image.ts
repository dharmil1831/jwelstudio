import {
  getImageProviderPreference,
  isGeminiConfigured,
  isOpenAIConfigured,
} from "@/lib/env";
import { generateJewelryWithGemini } from "@/lib/gemini";
import { generateJewelryModelShot } from "@/lib/openai";
import type { OpenAIImageSize, OutputFormat } from "@/lib/style-options";
import { OUTPUT_FORMAT_SIZES } from "@/lib/style-options";

export type ImageProviderId = "openai" | "gemini";

export type GeneratedJewelryImage = {
  imageBase64: string;
  mimeType: string;
  provider: ImageProviderId;
  attempted: ImageProviderId[];
};

function isFallbackWorthy(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|timed out|abort|429|401|403|500|502|503|504|rate limit|quota|billing|no credits remaining|insufficient.?quota|invalid.?api.?key|incorrect.?api.?key|model.?not.?found|does not exist|deprecated|unavailable|overloaded|ECONNRESET|ENOTFOUND|fetch failed|no image data|OPENAI_API_KEY|GEMINI_API_KEY|request failed|platform\.openai\.com/i.test(
    message,
  );
}

/** Rewrite provider billing/quota errors so users don't confuse them with app credits. */
export function sanitizeProviderError(error: unknown): Error {
  const message = error instanceof Error ? error.message : String(error);
  if (
    /platform\.openai\.com|no credits remaining|insufficient.?quota|billing/i.test(
      message,
    ) && /openai|gpt-image|images\.edit/i.test(message)
  ) {
    return new Error(
      "Image generation provider is out of quota. Please try again later or contact support.",
    );
  }
  if (
    /platform\.openai\.com|no credits remaining|insufficient.?quota/i.test(
      message,
    )
  ) {
    return new Error(
      "Image generation provider is out of quota. Please try again later or contact support.",
    );
  }
  return error instanceof Error ? error : new Error(message);
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
): Promise<{ imageBase64: string; mimeType: string }> {
  return generateJewelryWithGemini(imageBase64, mimeType, prompt, format);
}

/**
 * Gemini primary with OpenAI fallback when IMAGE_PROVIDER=auto.
 * Force one provider with IMAGE_PROVIDER=openai|gemini.
 */
export async function generateJewelryImage(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  format: OutputFormat;
}): Promise<GeneratedJewelryImage> {
  const { imageBase64, mimeType, prompt, format } = params;
  const preference = getImageProviderPreference();
  const attempted: ImageProviderId[] = [];

  const openaiReady = isOpenAIConfigured();
  const geminiReady = isGeminiConfigured();

  if (preference === "openai") {
    if (!openaiReady) throw new Error("OPENAI_API_KEY is not configured");
    attempted.push("openai");
    try {
      const out = await runOpenAI(imageBase64, mimeType, prompt, format);
      return { ...out, provider: "openai", attempted };
    } catch (e) {
      throw sanitizeProviderError(e);
    }
  }

  if (preference === "gemini") {
    if (!geminiReady) throw new Error("GEMINI_API_KEY is not configured");
    attempted.push("gemini");
    const out = await runGemini(imageBase64, mimeType, prompt, format);
    return { ...out, provider: "gemini", attempted };
  }

  // auto: Gemini first (cheaper / current default), OpenAI only as fallback
  const primary: ImageProviderId | null = geminiReady
    ? "gemini"
    : openaiReady
      ? "openai"
      : null;
  const fallback: ImageProviderId | null =
    primary === "gemini" && openaiReady
      ? "openai"
      : primary === "openai" && geminiReady
        ? "gemini"
        : null;

  if (!primary) {
    throw new Error(
      "No image provider configured. Set GEMINI_API_KEY and/or OPENAI_API_KEY.",
    );
  }

  attempted.push(primary);
  try {
    const out =
      primary === "openai"
        ? await runOpenAI(imageBase64, mimeType, prompt, format)
        : await runGemini(imageBase64, mimeType, prompt, format);
    return { ...out, provider: primary, attempted };
  } catch (primaryError) {
    if (!fallback || !isFallbackWorthy(primaryError)) {
      throw sanitizeProviderError(primaryError);
    }

    attempted.push(fallback);
    try {
      const out =
        fallback === "openai"
          ? await runOpenAI(imageBase64, mimeType, prompt, format)
          : await runGemini(imageBase64, mimeType, prompt, format);
      return { ...out, provider: fallback, attempted };
    } catch (fallbackError) {
      throw sanitizeProviderError(
        new Error(
          `Image generation failed. Please try again later or contact support.`,
        ),
      );
    }
  }
}
