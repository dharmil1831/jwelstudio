import { getOpenAIApiKey, getOpenAIImageModel } from "@/lib/env";
import type { OpenAIImageSize } from "@/lib/style-options";
import OpenAI, { toFile } from "openai";

export async function generateJewelryModelShot(
  imageBase64: string,
  mimeType: string,
  prompt: string,
  size: OpenAIImageSize = "1024x1024",
): Promise<{ imageBase64: string; mimeType: string }> {
  const apiKey = getOpenAIApiKey();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const client = new OpenAI({ apiKey, timeout: 90_000, maxRetries: 0 });
  const buffer = Buffer.from(imageBase64, "base64");
  const extension =
    mimeType === "image/png"
      ? "png"
      : mimeType === "image/webp"
        ? "webp"
        : "jpg";

  const image = await toFile(buffer, `jewelry.${extension}`, { type: mimeType });
  const model = getOpenAIImageModel();
  const supportsHighFidelity = model.startsWith("gpt-image");

  try {
    const response = await client.images.edit({
      model,
      image,
      prompt,
      size,
      ...(supportsHighFidelity
        ? { input_fidelity: "high" as const, quality: "high" as const }
        : {}),
    });

    const b64 = response.data?.[0]?.b64_json;
    if (!b64) {
      throw new Error("OpenAI returned no image data.");
    }

    return {
      imageBase64: b64,
      mimeType: "image/png",
    };
  } catch (e) {
    if (e instanceof OpenAI.APIError) {
      throw new Error(e.message || `OpenAI request failed (${e.status}).`);
    }
    throw e;
  }
}
