/** Diamond-only video options: aspect, purpose, cast, and camera motion. */

import { subjectPromptLine } from "@/lib/prompts";
import { SUBJECTS, type Subject } from "@/lib/style-options";
import {
  parseLookPreset,
  resolvedLookVideoLine,
  type LookPresetId,
} from "@/lib/look-presets";

export const VIDEO_ASPECT_IDS = ["vertical", "horizontal"] as const;
export type VideoAspectId = (typeof VIDEO_ASPECT_IDS)[number];

export const VIDEO_ASPECT_LABELS: Record<VideoAspectId, string> = {
  vertical: "Vertical 9:16",
  horizontal: "Horizontal 16:9",
};

export const VIDEO_ASPECT_HINTS: Record<VideoAspectId, string> = {
  vertical: "Reels, Shorts, Stories, WhatsApp Status",
  horizontal: "YouTube, website hero, landscape ads",
};

/** Gemini Veo aspectRatio parameter. */
export const VIDEO_ASPECT_RATIO: Record<VideoAspectId, "9:16" | "16:9"> = {
  vertical: "9:16",
  horizontal: "16:9",
};

export const VIDEO_ASPECT_CLASS: Record<VideoAspectId, string> = {
  vertical: "aspect-[9/16] max-w-[280px]",
  horizontal: "aspect-video max-w-xl",
};

export const VIDEO_CAST_IDS = ["product", "model"] as const;
export type VideoCastId = (typeof VIDEO_CAST_IDS)[number];

export const VIDEO_CAST_LABELS: Record<VideoCastId, string> = {
  product: "Jewelry only",
  model: "On a model",
};

export const VIDEO_CAST_HINTS: Record<VideoCastId, string> = {
  product: "Product clip — no person",
  model: "Model wearing your exact piece",
};

export const VIDEO_CAST_PROMPTS: Record<VideoCastId, string> = {
  product:
    "CAST: jewelry-only product video. No person, no face, no model, no mannequin, no body. The uploaded jewelry is the sole subject.",
  model:
    "CAST: jewelry-on-model video. A photorealistic adult model wears ONLY the exact uploaded jewelry — no additional pieces. If the upload shows earrings only, the model wears earrings only. If the upload shows a necklace only, the model wears a necklace only. Do NOT invent extra matching jewelry (no tikka, no bangles, no rings, no nose ring unless in the upload). Place the uploaded piece naturally. Polished editorial skin. Do not change the jewelry design.",
};

export const VIDEO_PURPOSE_IDS = [
  "promotional",
  "marketing",
  "product_shoot",
  "editorial",
  "festive",
  "lifestyle",
  "reveal",
] as const;

export type VideoPurposeId = (typeof VIDEO_PURPOSE_IDS)[number];

export const VIDEO_PURPOSE_LABELS: Record<VideoPurposeId, string> = {
  promotional: "Promotional",
  marketing: "Marketing / social ad",
  product_shoot: "Product shoot",
  editorial: "Editorial campaign",
  festive: "Festive / occasion",
  lifestyle: "Lifestyle (worn)",
  reveal: "Reveal / unboxing",
};

export const VIDEO_PURPOSE_PROMPTS: Record<VideoPurposeId, string> = {
  promotional:
    "Video type: promotional jewelry ad. Bold product-hero framing, premium lighting, clear call-to-attention on the piece. Suitable for paid ads.",
  marketing:
    "Video type: social marketing clip. Fast, scroll-stopping jewelry campaign energy for Instagram Reels / Facebook / YouTube — still elegant, never gimmicky.",
  product_shoot:
    "Video type: studio product shoot. Catalog-clean, even lighting, commercial e-commerce feel. Follow the CAST instruction for whether a model is present.",
  editorial:
    "Video type: high-fashion editorial. Magazine cinematography, cinematic grading. Jewelry remains the exact uploaded piece. Follow CAST for model vs product-only.",
  lifestyle:
    "Video type: lifestyle campaign. Believable everyday or occasion styling. If CAST is on-model, the person wears the jewelry naturally; if product-only, style the piece in a lived-in setting without a person.",
  festive:
    "Video type: festive occasion campaign (wedding, Diwali, celebration). Warm celebratory mood and tasteful sparkle in lighting only — do not redesign the jewelry.",
  reveal:
    "Video type: reveal / unboxing moment. Slow elegant reveal of the exact jewelry from the reference, premium packaging or cloth pull-away optional, luxury unbox energy.",
};

export const VIDEO_PRESET_IDS = [
  "slow_orbit",
  "necklace_sway",
  "ring_turntable",
  "festive_sparkle",
  "soft_zoom",
  "hero_push",
  "macro_glide",
  "worn_turn",
  "portrait_move",
] as const;

export type VideoPresetId = (typeof VIDEO_PRESET_IDS)[number];

export const VIDEO_PRESET_LABELS: Record<VideoPresetId, string> = {
  slow_orbit: "Slow orbit",
  necklace_sway: "Necklace sway",
  ring_turntable: "Ring turntable",
  festive_sparkle: "Festive sparkle",
  soft_zoom: "Soft zoom",
  hero_push: "Hero push-in",
  macro_glide: "Macro glide",
  worn_turn: "Worn turn",
  portrait_move: "Portrait move",
};

export const VIDEO_PRESET_PROMPTS: Record<VideoPresetId, string> = {
  slow_orbit:
    "Camera motion: the exact jewelry slowly orbits on a clean premium backdrop. Smooth orbit, jewelry stays sharp and identical to the photo.",
  necklace_sway:
    "Camera motion: the exact necklace or pendant gently sways as if worn, subtle fabric motion, soft studio light.",
  ring_turntable:
    "Camera motion: the exact ring rotates slowly on a turntable, macro luxury feel, metal and stones sharp.",
  festive_sparkle:
    "Camera motion: gentle camera push-in as the exact jewelry catches soft sparkle highlights. Do not redesign the piece.",
  soft_zoom:
    "Camera motion: slow soft zoom toward the exact jewelry on a clean backdrop. Pixel-faithful product.",
  hero_push:
    "Camera motion: confident cinematic push-in toward the jewelry, campaign-hero energy, jewelry locked to the reference.",
  macro_glide:
    "Camera motion: slow macro glide across metalwork and stones of the exact uploaded piece; craftsmanship in focus.",
  worn_turn:
    "Camera motion: if a model is present, they slowly turn so the worn jewelry catches light; if product-only, the piece turns on a stand. Jewelry identity locked.",
  portrait_move:
    "Camera motion: if a model is present, subtle head/shoulder movement in a beauty portrait so the jewelry stays sharp; if product-only, a gentle camera drift around the piece.",
};

export function parseVideoAspect(raw: unknown): VideoAspectId {
  if (typeof raw === "string") {
    const id = raw.trim() as VideoAspectId;
    if (VIDEO_ASPECT_IDS.includes(id)) return id;
    if (raw === "9:16" || raw === "portrait") return "vertical";
    if (raw === "16:9" || raw === "landscape") return "horizontal";
  }
  return "vertical";
}

export function parseVideoCast(raw: unknown): VideoCastId {
  if (raw === "model" || raw === "on_model") return "model";
  return "product";
}

export function parseVideoSubject(raw: unknown): Subject {
  if (typeof raw === "string" && (SUBJECTS as readonly string[]).includes(raw)) {
    return raw as Subject;
  }
  return "auto";
}

export function parseVideoPurpose(raw: unknown): VideoPurposeId {
  if (typeof raw === "string") {
    const id = raw.trim() as VideoPurposeId;
    if (VIDEO_PURPOSE_IDS.includes(id)) return id;
  }
  return "promotional";
}

export function parseVideoPreset(raw: unknown): VideoPresetId | null {
  if (typeof raw !== "string") return null;
  const id = raw.trim() as VideoPresetId;
  return VIDEO_PRESET_IDS.includes(id) ? id : null;
}

export function buildVideoPrompt(opts: {
  purpose: VideoPurposeId;
  preset: VideoPresetId;
  aspect: VideoAspectId;
  cast: VideoCastId;
  subject: Subject;
  lookPreset?: LookPresetId | string | null;
  customPrompt?: string | null;
}): string {
  const frame =
    opts.aspect === "horizontal"
      ? "Frame for widescreen 16:9 landscape. Jewelry fully visible; cinematic wide or mid shot as appropriate. Do NOT add any text, watermark, logo, social-media branding, or UI overlay to the video."
      : "Frame for vertical 9:16 phone video. Jewelry fully visible in the safe center; leave empty margin top and bottom. Do NOT add any text, watermark, logo, social-media branding, WhatsApp UI, Instagram UI, or any overlay to the video — the output must be a clean video with NO text or graphics.";

  const castLines =
    opts.cast === "model"
      ? [VIDEO_CAST_PROMPTS.model, subjectPromptLine(opts.subject)]
      : [VIDEO_CAST_PROMPTS.product];

  const look =
    opts.cast === "model"
      ? resolvedLookVideoLine({
          look: parseLookPreset(opts.lookPreset ?? "auto"),
          subject: opts.subject,
          vibe: opts.purpose === "festive" ? "festive" : opts.purpose === "editorial" ? "luxury" : "luxury",
          scene: opts.purpose === "lifestyle" ? "outdoor_garden" : "studio",
        })
      : null;

  return [
    "CRITICAL JEWELRY FIDELITY (highest priority):",
    "The uploaded image is the ONLY product reference. The jewelry in the video must be a pixel-faithful recreation of EXACTLY that piece — same design, metal, stones, proportions, count.",
    "Do NOT add extra jewelry that is not in the uploaded photo. If the photo shows earrings and a necklace, show ONLY earrings and a necklace — no tikka, no bracelet, no ring, no nose ring, no maang tikka unless they are clearly visible in the uploaded reference.",
    "Do NOT redesign, restyle, simplify, embellish, swap stones, change metal, add sparkle, or invent matching set pieces.",
    "If any style, mood, or casting instruction conflicts with jewelry accuracy, jewelry accuracy ALWAYS wins.",
    "",
    ...castLines,
    look,
    VIDEO_PURPOSE_PROMPTS[opts.purpose],
    VIDEO_PRESET_PROMPTS[opts.preset],
    frame,
    "Keep motion smooth and tasteful. Short 6–10 second clip feel. Jewelry is the hero. Smooth motion, natural skin tones, cinematic lighting.",
    opts.customPrompt
      ? `\nUser creative direction (follow unless it conflicts with jewelry fidelity or casting wardrobe — never add extra jewelry): ${opts.customPrompt}`
      : "",
    "",
    "FINAL CHECK: The jewelry in EVERY frame must match the uploaded product image exactly — same pieces, same count, same stones, same metal, same proportions. Not a similar piece. Absolutely no extra jewelry added.",
  ]
    .filter(Boolean)
    .join(" ");
}

/**
 * Veo image-to-video rejects `dont_allow` (400 INVALID_ARGUMENT).
 * Use `allow_adult` for all casts; product/no-person intent stays in the prompt.
 */
export function veoPersonGeneration(_cast: VideoCastId): "allow_adult" {
  return "allow_adult";
}

export function generationFormatForAspect(
  aspect: VideoAspectId,
): "instagram_story" | "landscape" {
  return aspect === "horizontal" ? "landscape" : "instagram_story";
}

/** Credits charged per video generation. */
export const CREDIT_COST_PER_VIDEO = 5;
