import { getGeminiApiKey, getGeminiVideoModel } from "@/lib/env";
import { VIDEO_JEWELRY_LOCK } from "@/lib/video-presets";

const INTERACTIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/interactions";

type VideoPart = {
  type?: string;
  mime_type?: string;
  data?: string;
  uri?: string;
};

type Interaction = {
  id?: string;
  status?: string;
  error?: { message?: string } | string;
  output_video?: VideoPart;
  steps?: Array<{
    content?: VideoPart[];
  }>;
};

function errorMessage(body: Interaction, status: number): string {
  if (typeof body.error === "string" && body.error) return body.error;
  if (typeof body.error === "object" && body.error?.message) {
    return body.error.message;
  }
  return `Video request failed (${status}). Check GEMINI_VIDEO_MODEL and API access.`;
}

function videoFromInteraction(
  body: Interaction,
): { data?: string; uri?: string; mimeType: string } | null {
  const direct = body.output_video;
  if (direct && (direct.data || direct.uri)) {
    return {
      data: direct.data,
      uri: direct.uri,
      mimeType: direct.mime_type || "video/mp4",
    };
  }
  for (const step of body.steps ?? []) {
    for (const part of step.content ?? []) {
      if (part.type === "video" && (part.data || part.uri)) {
        return {
          data: part.data,
          uri: part.uri,
          mimeType: part.mime_type || "video/mp4",
        };
      }
    }
  }
  return null;
}

async function readInteraction(res: Response): Promise<Interaction> {
  const text = await res.text();
  try {
    return JSON.parse(text) as Interaction;
  } catch {
    throw new Error(
      res.ok
        ? "Video API returned an invalid response."
        : `Video request failed (${res.status}).`,
    );
  }
}

export async function generateJewelryVideoWithGemini(params: {
  imageBase64: string;
  mimeType: string;
  prompt: string;
  aspectRatio?: "9:16" | "16:9";
  personGeneration?: "allow_adult" | "dont_allow";
  negativePrompt?: string;
  cast?: "product" | "model";
  openingText?: string;
  deadlineMs?: number;
}): Promise<{ videoBase64: string; mimeType: string }> {
  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const stability =
    "Keep the jewelry identity locked: stable silhouette, stable metal color, stable stone layout, no flicker, no morphing, no melting metal. Gentle camera motion only.";
  const prompt = [
    params.prompt,
    stability,
    params.negativePrompt ? `Do not include: ${params.negativePrompt}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const startRes = await fetch(INTERACTIONS_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      model: getGeminiVideoModel(),
      input: [
        {
          type: "text",
          text: `${params.openingText ?? VIDEO_JEWELRY_LOCK} ${stability}`,
        },
        {
          type: "image",
          data: params.imageBase64,
          mime_type: params.mimeType || "image/jpeg",
        },
        { type: "text", text: prompt },
      ],
      response_format: {
        type: "video",
        aspect_ratio: params.aspectRatio ?? "9:16",
        resolution: "720p",
        // Shorter clips reduce morph/glitch risk and stay inside ~₹120–150 budget.
        duration: "6s",
      },
      generation_config: {
        video_config: { task: "image_to_video" },
      },
      background: true,
      store: true,
      stream: false,
    }),
  });

  let last = await readInteraction(startRes);
  if (!startRes.ok) {
    throw new Error(errorMessage(last, startRes.status));
  }

  const deadline = Date.now() + (params.deadlineMs ?? 240_000);
  const waiting = () => {
    const status = (last.status ?? "").toLowerCase();
    return status === "in_progress" || status === "requires_action";
  };
  while (waiting()) {
    if (Date.now() >= deadline) break;
    if (!last.id) {
      throw new Error("Video API did not return an interaction id.");
    }
    await new Promise((r) => setTimeout(r, 5_000));
    const pollRes = await fetch(
      `${INTERACTIONS_URL}/${encodeURIComponent(last.id)}`,
      { headers: { "x-goog-api-key": apiKey } },
    );
    last = await readInteraction(pollRes);
    if (!pollRes.ok) {
      throw new Error(errorMessage(last, pollRes.status));
    }
  }

  const status = (last.status ?? "").toLowerCase();
  if (status === "in_progress" || status === "requires_action") {
    throw new Error("Video generation timed out. Please try again.");
  }
  if (status === "failed" || status === "cancelled" || status === "incomplete") {
    throw new Error(errorMessage(last, 500));
  }

  const video = videoFromInteraction(last);
  if (!video) {
    throw new Error("Video API returned no video.");
  }
  if (video.data) {
    return { videoBase64: video.data, mimeType: video.mimeType };
  }

  const videoRes = await fetch(video.uri!, {
    headers: { "x-goog-api-key": apiKey },
  });
  if (!videoRes.ok) {
    throw new Error(`Failed to download generated video (${videoRes.status}).`);
  }
  const buf = Buffer.from(await videoRes.arrayBuffer());
  return {
    videoBase64: buf.toString("base64"),
    mimeType: videoRes.headers.get("content-type") || video.mimeType,
  };
}
