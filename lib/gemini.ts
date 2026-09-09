import { getGeminiApiKey, getGeminiImageModel } from "@/lib/env";
import type { OutputFormat } from "@/lib/style-options";
import { OUTPUT_FORMAT_GEMINI_ASPECT } from "@/lib/style-options";

type GeminiPart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

export type GeminiExtraImage = {
  data: string;
  mimeType: string;
  /** Shown to the model before this image so roles stay clear. */
  label?: string;
};

export async function generateJewelryWithGemini(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  format: OutputFormat = "square",
  extraImages?: GeminiExtraImage[],
): Promise<{ imageBase64: string; mimeType: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = getGeminiImageModel();
  const aspectRatio = OUTPUT_FORMAT_GEMINI_ASPECT[format] ?? "1:1";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;

  const parts: Array<Record<string, unknown>> = [
    { text: prompt },
    {
      text: "IMAGE — NEW JEWELRY PRODUCT (use ONLY this jewelry design; do not redesign or invent pieces):",
    },
    {
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64,
      },
    },
  ];
  for (const extra of extraImages ?? []) {
    if (!extra.data) continue;
    if (extra.label) {
      parts.push({ text: extra.label });
    }
    parts.push({
      inlineData: {
        mimeType: extra.mimeType || "image/png",
        data: extra.data,
      },
    });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 90_000);

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts,
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio,
            // 2K ≈ social-ready; closer to 1080px targets than default 1K
            imageSize: "2K",
          },
        },
      }),
    });

    const rawText = await res.text();
    let json: {
      error?: { message?: string; status?: string };
      candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
    };
    try {
      json = JSON.parse(rawText) as typeof json;
    } catch {
      throw new Error(
        res.ok
          ? "Gemini returned an invalid response."
          : `Gemini request failed (${res.status}).`,
      );
    }

    if (!res.ok) {
      throw new Error(
        json.error?.message ||
          `Gemini request failed (${res.status}${json.error?.status ? `: ${json.error.status}` : ""}).`,
      );
    }

    const outParts = json.candidates?.[0]?.content?.parts ?? [];
    for (const part of outParts) {
      const data = part.inlineData?.data ?? part.inline_data?.data;
      if (!data) continue;
      const outMime =
        part.inlineData?.mimeType ??
        part.inline_data?.mime_type ??
        "image/png";
      return { imageBase64: data, mimeType: outMime };
    }

    throw new Error("Gemini returned no image data.");
  } catch (e) {
    if (e instanceof Error && e.name === "AbortError") {
      throw new Error("Gemini request timed out.");
    }
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
