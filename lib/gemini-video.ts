import { getGeminiApiKey, getGeminiVideoModel } from "@/lib/env";

type VeoOperation = {
  name?: string;
  done?: boolean;
  error?: { message?: string };
  response?: {
    generateVideoResponse?: {
      generatedSamples?: Array<{
        video?: { uri?: string };
      }>;
    };
    generatedVideos?: Array<{
      video?: { uri?: string };
    }>;
  };
};

/**
 * Generate a short product video from jewelry image + preset prompt via Gemini Veo.
 * Polls the long-running operation until complete or timeout.
 */
export async function generateJewelryVideoWithGemini(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  aspectRatio?: "9:16" | "16:9";
  personGeneration?: "allow_adult" | "dont_allow";
}): Promise<{ videoBase64: string; mimeType: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const model = getGeminiVideoModel();
  const startUrl = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:predictLongRunning`;

  // Image-to-video: Veo only accepts allow_adult (or omit). dont_allow → 400.
  const personGeneration =
    params.personGeneration === "dont_allow"
      ? "allow_adult"
      : (params.personGeneration ?? "allow_adult");

  const startRes = await fetch(startUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      instances: [
        {
          prompt: params.prompt,
          image: {
            bytesBase64Encoded: params.imageBase64,
            mimeType: params.mimeType || "image/jpeg",
          },
        },
      ],
      parameters: {
        aspectRatio: params.aspectRatio ?? "9:16",
        personGeneration,
        sampleCount: 1,
      },
    }),
  });

  const startText = await startRes.text();
  let startJson: VeoOperation & { error?: { message?: string } };
  try {
    startJson = JSON.parse(startText) as typeof startJson;
  } catch {
    throw new Error(
      startRes.ok
        ? "Video API returned an invalid response."
        : `Video request failed (${startRes.status}).`,
    );
  }

  if (!startRes.ok) {
    throw new Error(
      startJson.error?.message ||
        `Video request failed (${startRes.status}). Check GEMINI_VIDEO_MODEL and API access.`,
    );
  }

  const opName = startJson.name;
  if (!opName) {
    throw new Error("Video API did not return an operation name.");
  }


  const deadline = Date.now() + 240_000;
  let last: VeoOperation = startJson;

  while (Date.now() < deadline) {
    if (last.done) break;
    await new Promise((r) => setTimeout(r, 5_000));

    const pollUrl = `https://generativelanguage.googleapis.com/v1beta/${opName}`;
    const pollRes = await fetch(pollUrl, {
      headers: { "x-goog-api-key": apiKey },
    });
    const pollText = await pollRes.text();
    try {
      last = JSON.parse(pollText) as VeoOperation;
    } catch {
      throw new Error("Video status poll returned invalid JSON.");
    }
    if (!pollRes.ok) {
      throw new Error(
        last.error?.message || `Video status poll failed (${pollRes.status}).`,
      );
    }
  }

  if (!last.done) {
    throw new Error("Video generation timed out. Please try again.");
  }
  if (last.error?.message) {
    throw new Error(last.error.message);
  }

  const uri =
    last.response?.generateVideoResponse?.generatedSamples?.[0]?.video?.uri ??
    last.response?.generatedVideos?.[0]?.video?.uri;

  if (!uri) {
    throw new Error("Video API returned no video URI.");
  }

  const videoRes = await fetch(uri, {
    headers: { "x-goog-api-key": apiKey },
  });
  if (!videoRes.ok) {
    throw new Error(`Failed to download generated video (${videoRes.status}).`);
  }

  const buf = Buffer.from(await videoRes.arrayBuffer());
  return {
    videoBase64: buf.toString("base64"),
    mimeType: videoRes.headers.get("content-type") || "video/mp4",
  };
}
