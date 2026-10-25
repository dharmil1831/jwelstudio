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

export const VIDEO_PURPOSE_HINTS: Record<VideoPurposeId, string> = {
  promotional: "Dark spotlight hero. Your piece stays large in frame.",
  marketing: "Soft beige social-ad set. Clean and fully visible.",
  product_shoot: "Light catalog studio. The camera moves around the piece.",
  editorial: "Magazine light and deep shadow.",
  festive: "Marigolds, lit diyas, and warm celebration light stay in frame.",
  lifestyle: "Daylight on linen or a tray. Not a white sweep.",
  reveal: "A lid starts partly open and hands lift it until your piece is fully shown.",
};

export const VIDEO_PURPOSE_PROMPTS: Record<VideoPurposeId, string> = {
  promotional:
    "REQUIRED SCENE: luxury advertisement. Replace any white catalog background with a dark champagne-to-black gradient and a soft spotlight. The jewelry stays large and centered the whole clip. No flowers, no diyas, no gift box.",
  marketing:
    "REQUIRED SCENE: social ad on a warm beige stone surface with a gentle shadow. The jewelry stays fully visible and centered. No white cutout, no gift box, no diyas.",
  product_shoot:
    "REQUIRED SCENE: clean catalog studio on a light grey or white surface with even commercial light. The camera must visibly move. No festival props, no gift box, no lifestyle styling.",
  editorial:
    "REQUIRED SCENE: fashion magazine. Deep shadow, one directional spotlight, dark backdrop, cinematic color. No white catalog sweep, no gift box, no diyas.",
  lifestyle:
    "REQUIRED SCENE: lived-in daylight. The jewelry rests on linen or a ceramic tray beside a window. No white sweep, no gift box, no diyas.",
  festive:
    "REQUIRED SCENE: Indian celebration, visible the entire clip. Fresh orange marigold flowers and at least two lit clay diyas with flames stay around the jewelry, on red or gold silk, in warm amber light. If a model is present, they wear festive Indian clothes and only the uploaded jewelry. Replace any white or empty background. No gift box.",
  reveal:
    "REQUIRED ACTION: luxury unboxing. The jewelry starts inside a premium dark box with the lid only partly open. During the clip, hands lift that lid in one steady motion until it is fully open and the jewelry is completely visible at the end. Do not start with the jewelry already sitting out. Do not skip the lid.",
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
      ? "Frame for widescreen 16:9 landscape. Jewelry fully visible; cinematic wide or mid shot as appropriate. Do NOT add any text, watermark, logo, social-media branding, or UI overlay to the video."
      : "Frame for vertical 9:16 phone video. Jewelry fully visible in the safe center; leave empty margin top and bottom. Do NOT add any text, watermark, logo, social-media branding, WhatsApp UI, Instagram UI, or any overlay to the video — the output must be a clean video with NO text or graphics.";

  const castLines =
    opts.purpose === "reveal"
      ? [
          opts.cast === "model"
            ? "CAST: one adult model opens the box. They wear or lift only the uploaded jewelry. No extra pieces."
            : "CAST: no face and no full body. Two hands and wrists lift the lid. Hands are required.",
          opts.cast === "model" ? subjectPromptLine(opts.subject) : "",
        ]
      : opts.cast === "model"
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
    "JEWELRY DESIGN LOCK:",
    "The uploaded photo is the design reference. Do not keep its plain background unless the required scene is a product shoot.",
    "When the jewelry is visible, copy it exactly: same pieces, same number of stones, same metal color, same clasp, same proportions.",
    "Do not add, remove, restyle, or replace any part. Do not invent a matching set.",
    opts.purpose === "reveal"
      ? "The piece may sit inside the box at the start. From the moment it is visible until the end, the design must match the upload and must not morph."
      : "The design stays the same for the whole clip. Do not morph it between frames.",
  ].join(" ");

  const ending =
    opts.purpose === "reveal"
      ? "MANDATORY ENDING: the lid finishes fully open and the uploaded jewelry is completely visible. The camera move must not skip the lid."
      : opts.purpose === "festive"
        ? "MANDATORY ENDING: marigolds and at least two lit diyas are still in frame. Do not return to a white studio."
        : "The required scene above is still in frame at the end. The camera move happens inside that scene.";

  return [
    VIDEO_PURPOSE_PROMPTS[opts.purpose],
    ...castLines,
    look ? `${look} Wardrobe only. This look must not add jewelry or replace the required scene.` : "",
    `${VIDEO_PRESET_PROMPTS[opts.preset]} Keep the required scene and action.`,
    frame,
    lock,
    "No text, logo, watermark, or subtitles.",
    opts.customPrompt
      ? `User note (never use this to change or add jewelry): ${opts.customPrompt}`
      : "",
    ending,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Product-shoot clips can animate the upload. Every other type needs a matching first frame. */
export function videoNeedsStartFrame(purpose: VideoPurposeId): boolean {
  return purpose !== "product_shoot";
}

export function buildVideoStartFramePrompt(opts: {
  purpose: VideoPurposeId;
  cast: VideoCastId;
  subject: Subject;
}): string {
  const model =
    opts.purpose === "reveal"
      ? opts.cast === "model"
        ? `One adult model opens the box. ${subjectPromptLine(opts.subject)} Only the uploaded jewelry.`
        : "No face. Two hands and wrists only."
      : opts.cast === "model"
        ? `One adult model is in frame. ${subjectPromptLine(opts.subject)} They wear only the uploaded jewelry.`
        : "No person.";

  const scene: Record<VideoPurposeId, string> = {
    promotional:
      "Dark champagne-to-black gradient, soft spotlight, jewelry large and centered. No flowers, no gift box, no white sweep.",
    marketing:
      "Warm beige stone surface, soft shadow, jewelry centered and fully visible. No white cutout, no gift box, no diyas.",
    product_shoot: "Light grey studio surface, even light, jewelry centered.",
    editorial:
      "Dark fashion backdrop, one hard spotlight, deep shadow, jewelry sharp. No white sweep, no gift box.",
    lifestyle:
      "Daylight, linen or a ceramic tray by a window, jewelry resting there. No white sweep, no gift box.",
    festive:
      "Indian celebration filling the background: fresh marigold flowers, two lit clay diyas with visible flames, red or gold silk, warm amber light. No white background, no gift box.",
    reveal:
      opts.cast === "model"
        ? "The model is lifting the lid of a matte charcoal jewelry box. The lid is open about thirty degrees. The uploaded jewelry is inside and already recognizable as the same piece."
        : "Two hands lift the lid of a matte charcoal jewelry box on black velvet. No face. The lid is open about thirty degrees. The uploaded jewelry is inside and already recognizable as the same piece.",
  };

  return [
    "Photorealistic first frame of a jewelry video.",
    "Copy the uploaded jewelry exactly: same pieces, same stones, same metal, same proportions. Do not redesign it.",
    model,
    scene[opts.purpose],
    "No text, no logo, no watermark, no letters.",
  ].join(" ");
}

export function videoNegativePrompt(purpose: VideoPurposeId): string {
  const design =
    "redesigned jewelry, different jewelry, extra jewelry, added stones, removed stones, changed metal color, morphing jewelry, melting metal, warped stones, different stone count, invented matching set, watermark, text, logo, subtitles, letters";
  if (purpose === "reveal") {
    return `${design}, jewelry already displayed on an open table at the start, missing box, missing lid, skipped unboxing, white catalog background`;
  }
  if (purpose === "festive") {
    return `${design}, plain white background, empty studio, catalog sweep, no flowers, no diyas`;
  }
  if (purpose === "product_shoot") {
    return `${design}, outdoor scene, festival props, gift box, unboxing, dark nightclub`;
  }
  if (purpose === "lifestyle") {
    return `${design}, white catalog sweep, gift box, diyas, festival crowd`;
  }
  if (purpose === "editorial") {
    return `${design}, white catalog sweep, gift box, diyas, flat even studio light`;
  }
  return `${design}, gift box, unboxing, plain white cutout`;
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
