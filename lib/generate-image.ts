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
};

function isFallbackWorthy(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /timeout|timed out|abort|429|401|403|500|502|503|504|rate limit|quota|billing|no credits remaining|insufficient.?quota|invalid.?api.?key|incorrect.?api.?key|model.?not.?found|does not exist|deprecated|unavailable|overloaded|ECONNRESET|ENOTFOUND|fetch failed|no image data|OPENAI_API_KEY|GEMINI_API_KEY|request failed|platform\.openai\.com/i.test(
    message,
  );
}

/** Map provider errors to clear, user-facing messages (keep app credits vs API quota distinct). */
export function sanitizeProviderError(
  error: unknown,
  provider?: ImageProviderId,
): Error {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();
  const name = provider === "openai" ? "OpenAI" : provider === "gemini" ? "Gemini" : "Image provider";

  if (
    /no credits remaining|insufficient.?quota|exceeded.+quota|resource.?exhausted|quota.?exceeded|billing details|check your plan/i.test(
      message,
    )
  ) {
    return new Error(
      `${name} API quota is exhausted or billing is not enabled. Check your ${
        provider === "gemini" ? "Google AI Studio" : "OpenAI"
      } plan/credits, then try again.`,
    );
  }

  if (/api key|permission|403|401|invalid/i.test(lower) && /key|auth|permission/i.test(lower)) {
    return new Error(
      `${name} API key is invalid or not allowed for image generation. Check the key on Vercel.`,
    );
  }

  if (/model.?not.?found|not found|does not exist|not supported/i.test(message)) {
    return new Error(
      `${name} model is unavailable. Check GEMINI_IMAGE_MODEL / OPENAI_IMAGE_MODEL on Vercel.`,
    );
  }

  // Keep short provider-prefixed detail for debugging (no huge payloads).
  const short = message.replace(/\s+/g, " ").trim().slice(0, 220);
  return new Error(`${name}: ${short}`);
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
): Promise<{ imageBase64: string; mimeType: string }> {
  return generateJewelryWithGemini(
    imageBase64,
    mimeType,
    prompt,
    format,
    extraImages,
  );
}

/**
 * Gemini primary with OpenAI fallback when IMAGE_PROVIDER=auto.
 * Force one provider with IMAGE_PROVIDER=openai|gemini.
 * Extra images (logo / selfie / theme) are Gemini-only; OpenAI fallback uses jewelry image alone.
 */
export async function generateJewelryImage(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  format: OutputFormat;
  extraImages?: GeminiExtraImage[];
}): Promise<GeneratedJewelryImage> {
  const { imageBase64, mimeType, prompt, format, extraImages } = params;
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
      const out = await runGemini(
        imageBase64,
        mimeType,
        prompt,
        format,
        extraImages,
      );
      return { ...out, provider: "gemini", attempted };
    } catch (e) {
      throw sanitizeProviderError(e, "gemini");
    }
  }

  // auto: Gemini first (cheaper / current default), OpenAI only as fallback
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
    const out =
      primary === "openai"
        ? await runOpenAI(imageBase64, mimeType, prompt, format)
        : await runGemini(imageBase64, mimeType, prompt, format, extraImages);
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
          : await runGemini(imageBase64, mimeType, prompt, format, extraImages);
      return { ...out, provider: fallback, attempted };
    } catch (fallbackError) {
      throw sanitizeProviderError(fallbackError, fallback);
    }
  }
}
