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
  return /timeout|timed out|abort|429|401|403|500|502|503|504|rate limit|quota|invalid.?api.?key|incorrect.?api.?key|model.?not.?found|does not exist|deprecated|unavailable|overloaded|ECONNRESET|ENOTFOUND|fetch failed|no image data|OPENAI_API_KEY|GEMINI_API_KEY|request failed/i.test(
    message,
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
): Promise<{ imageBase64: string; mimeType: string }> {
  return generateJewelryWithGemini(imageBase64, mimeType, prompt, format);
}

/**
 * OpenAI primary with Gemini fallback (IMAGE_PROVIDER=auto).
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
    const out = await runOpenAI(imageBase64, mimeType, prompt, format);
    return { ...out, provider: "openai", attempted };
  }

  if (preference === "gemini") {
    if (!geminiReady) throw new Error("GEMINI_API_KEY is not configured");
    attempted.push("gemini");
    const out = await runGemini(imageBase64, mimeType, prompt, format);
    return { ...out, provider: "gemini", attempted };
  }

  // auto
  const primary: ImageProviderId | null = openaiReady
    ? "openai"
    : geminiReady
      ? "gemini"
      : null;
  const fallback: ImageProviderId | null =
    primary === "openai" && geminiReady
      ? "gemini"
      : primary === "gemini" && openaiReady
        ? "openai"
        : null;

  if (!primary) {
    throw new Error(
      "No image provider configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY.",
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
      throw primaryError;
    }

    attempted.push(fallback);
    try {
      const out =
        fallback === "openai"
          ? await runOpenAI(imageBase64, mimeType, prompt, format)
          : await runGemini(imageBase64, mimeType, prompt, format);
      return { ...out, provider: fallback, attempted };
    } catch (fallbackError) {
      const primaryMsg =
        primaryError instanceof Error
          ? primaryError.message
          : "Primary provider failed";
      const fallbackMsg =
        fallbackError instanceof Error
          ? fallbackError.message
          : "Fallback provider failed";
      throw new Error(
        `${primary} failed (${primaryMsg}); ${fallback} fallback failed (${fallbackMsg})`,
      );
    }
  }
}
