/** Diamond-only video options: aspect, purpose, cast, and camera motion. */

import { subjectPromptLine } from "@/lib/prompts";
import { SUBJECTS, type Subject } from "@/lib/style-options";
import {
  parseLookPreset,
  resolvedLookImageLine,
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
  model: "One model wears your piece. The design stays as uploaded.",
};

/** Shown under the video campaign look. */
export const VIDEO_PHOTO_LOCK_NOTE =
  "The model wears this jewelry. Clothes and setting can change. The jewelry design does not.";

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
  lifestyle: "Softer daylight. On a model, they wear the same piece.",
  reveal: "A case opens on this photo. The jewelry is not placed on a model, and the design stays as uploaded.",
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
    "LOOK: the uploaded photograph stays the picture. Do not add a person, face, hands, cloth, box, or a second copy. A very small light change only. Every chain, cord, earring, and pendant stays where it is in the photo.",
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
    "CAMERA: a small slow arc. Do not add a person or a new background. The jewelry design stays rigid.",
  necklace_sway:
    "CAMERA: a small drift. Do not rock the jewelry apart and do not change its shape.",
  ring_turntable:
    "CAMERA: a small arc around the uploaded piece. Do not invent a ring. Do not add a person.",
  festive_sparkle:
    "CAMERA: a small reflection across the stones that are already in the photo. Do not add stones, glitter, flowers, or a person.",
  soft_zoom:
    "CAMERA: a slow zoom in. The jewelry design does not change. Do not add a person.",
  hero_push:
    "CAMERA: a steady push-in. The jewelry design does not change. Do not add a person.",
  macro_glide:
    "CAMERA: a short sideways glide. Do not invent engraving or extra stones. Do not add a person.",
  worn_turn:
    "CAMERA: a small slow arc. Do not add a person. Do not turn the photo into a portrait.",
  portrait_move:
    "CAMERA: a small sideways drift. Do not add a person or a new background.",
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

function cameraLine(preset: VideoPresetId, cast: VideoCastId): string {
  if (cast === "model" && preset === "worn_turn") {
    return "CAMERA: the model turns slowly. The jewelry stays on the body and the design does not change.";
  }
  const line = VIDEO_PRESET_PROMPTS[preset];
  if (cast !== "model") return line;
  return line
    .replace(/ Do not add a person(?: or a new background)?\./g, "")
    .replace(/,? or a person/g, "")
    .replace(/ Do not turn the photo into a portrait\./g, "");
}

/** Sent on every video, before the options. The uploaded design is not restyled. */
export const VIDEO_JEWELRY_LOCK = [
  "ORIGINAL JEWELRY STAYS AS IT IS:",
  "Use the uploaded jewelry exactly, in every frame.",
  "Keep the large center pendant, every hanging drop, every colored stone, the chains, the cords, and the earrings.",
  "Same size, same outline, same metal, same stone layout.",
  "Do not simplify, shrink, remove, or redesign any part.",
  "Do not drop the big pendant.",
].join(" ");

/** Still used as the video's first frame when the cast is a model. The video call must not receive the catalog photo. */
export function buildVideoModelStillPrompt(opts: {
  purpose: VideoPurposeId;
  aspect: VideoAspectId;
  subject: Subject;
  lookPreset?: LookPresetId | string | null;
}): string {
  const look = resolvedLookImageLine({
    look: parseLookPreset(opts.lookPreset ?? "auto"),
    subject: opts.subject,
    vibe: "luxury",
    scene: opts.purpose === "lifestyle" ? "outdoor_garden" : "studio",
  });
  const frame =
    opts.aspect === "horizontal"
      ? "Frame 16:9. The full jewelry stays visible."
      : "Frame 9:16. The full jewelry stays visible.";
  return [
    VIDEO_JEWELRY_LOCK,
    "Task: one photograph of one adult already wearing the uploaded jewelry.",
    subjectPromptLine(opts.subject),
    look ? `${look} Clothes and setting only. Do not redesign the jewelry.` : "",
    "Wear that design once. A necklace sits on the neck. Earrings sit on the ears.",
    "Keep the large center pendant at the same size, outline, and stone layout as the upload.",
    "Do not paste the catalog photo. Do not show a second copy. Do not drop or shrink the pendant.",
    VIDEO_PURPOSE_PROMPTS[opts.purpose],
    frame,
    VIDEO_JEWELRY_LOCK,
  ]
    .filter(Boolean)
    .join("\n");
}

export function buildVideoPrompt(opts: {
  purpose: VideoPurposeId;
  preset: VideoPresetId;
  aspect: VideoAspectId;
  cast: VideoCastId;
  subject: Subject;
  lookPreset?: LookPresetId | string | null;
  customPrompt?: string | null;
  /** The input image is already the worn scene. Video must not rebuild it. */
  lockedFrame?: boolean;
}): string {
  const frame =
    opts.aspect === "horizontal"
      ? "Frame for widescreen 16:9. Keep the jewelry fully visible. No text, watermark, logo, or overlay."
      : "Frame for vertical 9:16. Keep the jewelry fully visible in the center. No text, watermark, logo, or overlay.";

  const note = opts.customPrompt
    ? `User note (never use this to change the jewelry design): ${opts.customPrompt}`
    : "";

  if (opts.lockedFrame) {
    return [
      VIDEO_JEWELRY_LOCK,
      "THIS PICTURE IS ALREADY FINISHED:",
      "The person is already wearing the jewelry. Do not rebuild it.",
      "Do not cut to a catalog photo, a flat lay, or a different pendant.",
      "Do not change the pendant, stones, chains, cords, or earrings.",
      "Move the camera immediately. Do not hold a still of a different picture.",
      cameraLine(opts.preset, "model"),
      frame,
      note,
      VIDEO_JEWELRY_LOCK,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (opts.cast === "model" && opts.purpose !== "reveal") {
    const look = resolvedLookVideoLine({
      look: parseLookPreset(opts.lookPreset ?? "auto"),
      subject: opts.subject,
      vibe: "luxury",
      scene: opts.purpose === "lifestyle" ? "outdoor_garden" : "studio",
    });
    return [
      VIDEO_JEWELRY_LOCK,
      "PLACEMENT: one model wears that same jewelry. A necklace sits on the neck. Earrings sit on the ears. The white catalog copy leaves the frame. The design stays complete, including the large center pendant.",
      "CAST: one adult wears the uploaded design once. Do not simplify it, do not drop the big pendant, and do not add a second necklace, a second pair, a tikka, bangles, or rings.",
      subjectPromptLine(opts.subject),
      look ? `${look} Wardrobe and setting only. Do not redesign the jewelry.` : "",
      VIDEO_PURPOSE_PROMPTS[opts.purpose],
      cameraLine(opts.preset, "model"),
      frame,
      note,
      VIDEO_JEWELRY_LOCK,
    ]
      .filter(Boolean)
      .join("\n");
  }

  return [
    VIDEO_JEWELRY_LOCK,
    "THE PHOTOGRAPH STAYS:",
    "The uploaded photo is the picture in every frame.",
    "Do not add a person, a couple, a bride, a groom, hands, or a new background.",
    "Do not move the jewelry onto a body. Do not redraw any pendant, drop, stone, chain, cord, or earring.",
    "Only camera and light may change. The jewelry design at the end matches the upload.",
    VIDEO_PURPOSE_PROMPTS[opts.purpose],
    cameraLine(opts.preset, "product"),
    frame,
    note,
    VIDEO_JEWELRY_LOCK,
  ]
    .filter(Boolean)
    .join("\n");
}

export function videoNegativePrompt(
  purpose: VideoPurposeId,
  cast: VideoCastId = "product",
): string {
  const design =
    cast === "model" && purpose !== "reveal"
      ? "missing center pendant, pendant removed, simplified jewelry, redesigned jewelry, different jewelry, morphing jewelry, changed stone layout, second necklace, duplicate jewelry, flat catalog copy beside the model, cloth covering the jewelry, hands covering the jewelry, watermark, text, logo, subtitles"
      : "added person, extra face, couple, bride, groom, hands, fingers, cloth, fabric, velvet, box, lid, new background, wedding portrait, double exposure, redesigned jewelry, different jewelry, morphing jewelry, missing center pendant, pendant removed, simplified jewelry, changed stone layout, second jewelry set, watermark, text, logo, subtitles";
  return purpose === "festive" ? `${design}, flowers on top of the jewelry` : design;
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
