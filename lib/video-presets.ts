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
    "CAST: jewelry-only product video. No person, no face, no hands, no fingers, no cloth, no box, no model. The uploaded jewelry is the only subject.",
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

export const VIDEO_PURPOSE_HINTS: Record<VideoPurposeId, string> = {
  promotional: "A spotlight warms your piece. The design stays the same.",
  marketing: "A gentle camera move around your piece.",
  product_shoot: "Even catalog light. The camera moves around your piece.",
  editorial: "Magazine light moves across your piece.",
  festive: "Warmer light on your full set. Nothing covers the chains or stones.",
  lifestyle: "Softer daylight on your full set. The whole piece stays visible.",
  reveal: "A lid lifts off in the first seconds. Your jewelry underneath stays the same.",
};

export const VIDEO_PURPOSE_PROMPTS: Record<VideoPurposeId, string> = {
  promotional:
    "LOOK: a soft spotlight warms the same jewelry. No new background object, no gift box, no flowers.",
  marketing:
    "LOOK: a gentle social-ad camera move and a soft shadow on the same jewelry. No gift box, no flowers.",
  product_shoot:
    "LOOK: even catalog light and a clear camera move around the same jewelry. No festival props, no gift box.",
  editorial:
    "LOOK: a directional light travels across the same jewelry. A darker grade is allowed. No gift box, no flowers.",
  lifestyle:
    "LOOK: soft daylight on the same jewelry. No gift box, no diyas. Do not move the piece onto a new tray.",
  festive:
    "LOOK: the light turns a little warmer and golden. Do not add flowers, lamps, cloth, or hands. Every chain, cord, earring, and pendant stays visible.",
  reveal:
    "LOOK: a soft light sweep across the jewelry, like a reveal. Do not add a lid, cloth, box, velvet, or hands. Every chain, cord, earring, and pendant stays visible from the first moment to the last.",
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
    "CAMERA: A clear slow arc around the jewelry, enough that the background shifts. The jewelry design stays rigid. Do not hold a static shot.",
  necklace_sway:
    "CAMERA: The whole piece may rock a few degrees as one rigid object. Links, stones, and outline stay the same shape. It must not melt into a different design.",
  ring_turntable:
    "CAMERA: If the upload is a ring, circle the ring. If it is not a ring, circle the actual uploaded piece. Do not invent a ring. Prongs, stones, and metal stay identical.",
  festive_sparkle:
    "CAMERA: A bright reflection travels across the stones that already exist. Lamps or diya flames already in the scene may flicker. Do not add new stones or glitter shapes.",
  soft_zoom:
    "CAMERA: A slow zoom in. The end of the clip is clearly closer than the start. The jewelry design does not change.",
  hero_push:
    "CAMERA: A steady push-in toward the jewelry, stronger than a tiny zoom. The jewelry design does not change.",
  macro_glide:
    "CAMERA: A sideways glide across the metal and stones, close enough to read the surface. Do not invent engraving or extra stones.",
  worn_turn:
    "CAMERA: If a model is present, they turn slowly and the jewelry stays on the body. If there is no model, the camera arcs around the piece. The design does not slide into a different necklace or earring.",
  portrait_move:
    "CAMERA: A small sideways drift with a little parallax. The jewelry design does not morph.",
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
      ? "Frame for widescreen 16:9. Keep the jewelry fully visible. No text, watermark, logo, or overlay."
      : "Frame for vertical 9:16. Keep the jewelry fully visible in the center. No text, watermark, logo, or overlay.";

  const castLines =
    opts.cast === "model"
      ? [VIDEO_CAST_PROMPTS.model, subjectPromptLine(opts.subject)]
      : [VIDEO_CAST_PROMPTS.product];

  const look =
    opts.cast === "model" && opts.purpose !== "festive" && opts.purpose !== "reveal"
      ? resolvedLookVideoLine({
          look: parseLookPreset(opts.lookPreset ?? "auto"),
          subject: opts.subject,
          vibe: "luxury",
          scene: opts.purpose === "lifestyle" ? "outdoor_garden" : "studio",
        })
      : null;

  const lock = [
    "CONTINUITY:",
    "The uploaded photo is the first moment of the video.",
    "Move forward from that photo at once.",
    "Do not hold a frozen still and then cut, fade, or dissolve to a different shot.",
    "The jewelry in every frame, including the last, is the same piece: same outline, same stone layout, same metal color, same chains, same cords, same earrings, same pendants.",
    "Nothing may cover, crop, or remove any part that is visible in the photo.",
    "Only the camera and the light may move.",
  ].join(" ");

  const ending =
    opts.cast === "product"
      ? "ENDING: the full jewelry set is still visible, including every chain and cord from the photo. No hands, cloth, or new object enter the frame."
      : "ENDING: the model still wears the same uploaded jewelry, including every chain and cord. The design has not been replaced.";

  return [
    lock,
    VIDEO_PURPOSE_PROMPTS[opts.purpose],
    ...castLines,
    look ? `${look} Wardrobe only. Do not replace the jewelry.` : "",
    `${VIDEO_PRESET_PROMPTS[opts.preset]} This move happens around the same jewelry. It must not introduce a new design.`,
    frame,
    opts.customPrompt
      ? `User note (never use this to change or add jewelry): ${opts.customPrompt}`
      : "",
    ending,
    lock,
  ]
    .filter(Boolean)
    .join("\n");
}

export function videoNegativePrompt(
  purpose: VideoPurposeId,
  cast: VideoCastId = "product",
): string {
  const cover =
    cast === "product"
      ? "hands, fingers, cloth, fabric, velvet, box, lid, covering the jewelry, cropped chain, missing cord, missing chain, "
      : "cloth covering the jewelry, missing chain, missing cord, ";
  const design = `${cover}frozen still then cut, crossfade, dissolve to a new shot, different jewelry, redesigned jewelry, morphing jewelry, melting metal, added stones, removed stones, changed metal color, watermark, text, logo, subtitles`;
  return purpose === "festive" ? `${design}, flowers on top of the jewelry, diyas covering the chain` : design;
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
