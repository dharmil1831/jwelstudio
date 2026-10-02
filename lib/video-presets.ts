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
    "Video type: social marketing clip. Slow, elegant campaign for Reels or Shorts. The jewelry design stays frozen; only the camera or a gentle pose may move.",
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
    "MOTION: Only the camera moves — a slow orbit around the jewelry. The jewelry itself is rigid. Every frame keeps the identical design, stone count, metal, and proportions from the first frame and the uploaded photo. Do not reshape, swap, or add pieces while the camera moves.",
  necklace_sway:
    "MOTION: The jewelry design does not sway or deform. Only clothing or a tiny natural settle may move. Chain links, pendants, and stones stay the same count and shape in every frame as in the uploaded photo. Do not turn a necklace into a different design.",
  ring_turntable:
    "MOTION: If and only if the upload is a ring, the camera slowly circles it. Prongs, stone count, band, and setting stay identical in every frame. If the upload is not a ring, do not invent a ring — orbit the actual uploaded piece instead.",
  festive_sparkle:
    "MOTION: Light may catch the existing stones. Do not add sparkle, glitter, extra stones, or a new design. The jewelry geometry is frozen to the upload for the whole clip.",
  soft_zoom:
    "MOTION: Slow camera zoom toward the jewelry. The piece does not move or change. The last frame must show the same jewelry as the first frame and the uploaded photo.",
  hero_push:
    "MOTION: Camera push-in only. Jewelry stays locked to the reference: same pieces, same count, same metal, same stones, every frame.",
  macro_glide:
    "MOTION: Camera glides across the existing metal and stones. Do not invent new engraving, stones, or links that are not in the upload. Details stay consistent from frame to frame.",
  worn_turn:
    "MOTION: If a model is present, they turn very slowly. The jewelry stays fixed on the body and must match the upload exactly throughout the turn — it must not slide into a different necklace, earring, or setting. If there is no model, only the camera moves.",
  portrait_move:
    "MOTION: Tiny camera or shoulder movement only. Jewelry design is locked. Do not morph earrings, chains, or stones between frames.",
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
          vibe: opts.purpose === "festive" ? "festive" : "luxury",
          scene: opts.purpose === "lifestyle" ? "outdoor_garden" : "studio",
        })
      : null;

  const lock = [
    "JEWELRY LOCK — non-negotiable, every frame:",
    "Use the uploaded photo as a hard reference, not inspiration.",
    "Copy the jewelry exactly: same pieces, same number of stones, same metal color, same clasp, same symmetry, same proportions.",
    "Do not add, remove, resize, restyle, or replace any part of the jewelry.",
    "Do not invent a matching set. If a piece is not clearly in the upload, it must not appear.",
    "Frame 1 and the last frame must show the same jewelry as the upload. No morphing between frames.",
    "If motion, wardrobe, mood, or the user note conflicts with this lock, ignore that conflict and keep the jewelry exact.",
  ].join(" ");

  return [
    lock,
    ...castLines,
    look ? `${look} Wardrobe and set only. This look must not add jewelry.` : "",
    VIDEO_PURPOSE_PROMPTS[opts.purpose],
    VIDEO_PRESET_PROMPTS[opts.preset],
    frame,
    "Motion stays slow so the jewelry design does not change. Natural skin if a model is present. No text, logo, or watermark.",
    opts.customPrompt
      ? `User note (never use this to change or add jewelry): ${opts.customPrompt}`
      : "",
    lock,
  ]
    .filter(Boolean)
    .join("\n");
}

/** What the video model must not do. Sent separately so it is not buried in the main prompt. */
export const VIDEO_JEWELRY_NEGATIVE_PROMPT =
  "redesigned jewelry, different jewelry, extra jewelry, added stones, removed stones, changed metal color, new clasp, morphing jewelry, melting metal, warped stones, different stone count, invented ring, invented necklace, invented earrings, maang tikka, bangles, nose ring, matching set not in the photo, glitter overlay, watermark, text, logo, subtitles";

/** Veo image-to-video rejects dont_allow. Product-only intent stays in the prompt. */
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
