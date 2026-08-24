/** Shared studio style enums for UI, API validation, and prompts. */

export const GENERATION_MODES = ["model", "background"] as const;

export const PLACEMENTS = [
  "auto",
  "neck",
  "ears",
  "hands",
  "finger",
  "wrist",
  "ankle",
  "waist",
  "hair",
  "nose",
  "chest_brooch",
  "multi_piece",
  "full_outfit",
] as const;

export const SUBJECTS = [
  "auto",
  "woman",
  "man",
  "youth",
  "mature",
  "couple",
  "diverse",
  "south_asian",
  "western",
  "hands_only",
  "editorial_faceless",
] as const;

export const SHOTS = [
  "editorial",
  "lifestyle",
  "hands_macro",
  "catalog",
  "side_profile",
  "full_body",
  "close_up",
  "movement",
] as const;

export const FRAMINGS = [
  "catalog",
  "hero",
  "macro",
  "lifestyle_still",
] as const;

export const SCENES = [
  "studio",
  "boutique",
  "golden_hour",
  "wedding",
  "festive_indoor",
  "outdoor_garden",
  "dark_luxe",
  "marble_interior",
] as const;

export const VIBES = [
  "minimal",
  "luxury",
  "festive",
  "bridal",
  "everyday",
  "vintage",
  "minimalist_luxe",
] as const;

export const OUTPUT_FORMATS = [
  "square",
  "whatsapp",
  "catalog",
  "instagram_post",
  "instagram_story",
  "landscape",
] as const;

export type OpenAIImageSize = "1024x1024" | "1536x1024" | "1024x1536";

export type GenerationMode = (typeof GENERATION_MODES)[number];
export type Placement = (typeof PLACEMENTS)[number];
export type Subject = (typeof SUBJECTS)[number];
export type Shot = (typeof SHOTS)[number];
export type Framing = (typeof FRAMINGS)[number];
export type Scene = (typeof SCENES)[number];
export type Vibe = (typeof VIBES)[number];
export type OutputFormat = (typeof OUTPUT_FORMATS)[number];

export type StudioStyle = {
  mode: GenerationMode;
  placement: Placement;
  subject: Subject;
  shot: Shot;
  framing: Framing;
  scene: Scene;
  vibe: Vibe;
  format: OutputFormat;
};

export const MODE_LABELS: Record<GenerationMode, string> = {
  model: "Model shot",
  background: "Background",
};

export const PLACEMENT_LABELS: Record<Placement, string> = {
  auto: "Auto (from product)",
  neck: "Neck & chest",
  ears: "Ears",
  hands: "Hands",
  finger: "Finger / rings",
  wrist: "Wrist & arm",
  ankle: "Ankle",
  waist: "Waist / belt",
  hair: "Hair / maang tikka",
  nose: "Nose / nath",
  chest_brooch: "Chest brooch",
  multi_piece: "Multi-piece set",
  full_outfit: "Full styled look",
};

export const SUBJECT_LABELS: Record<Subject, string> = {
  auto: "Auto (best fit)",
  woman: "Woman",
  man: "Man",
  youth: "Youth (18–25)",
  mature: "Mature (40s–60s)",
  couple: "Couple",
  diverse: "Diverse casting",
  south_asian: "South Asian",
  western: "Western",
  hands_only: "Hands / detail only",
  editorial_faceless: "Faceless editorial",
};

export const SHOT_LABELS: Record<Shot, string> = {
  editorial: "Editorial portrait",
  lifestyle: "Lifestyle",
  hands_macro: "Hands & macro",
  catalog: "Catalog / e-commerce",
  side_profile: "Side profile",
  full_body: "Full body",
  close_up: "Close-up beauty",
  movement: "Movement / dynamic",
};

export const FRAMING_LABELS: Record<Framing, string> = {
  catalog: "Catalog / e-commerce",
  hero: "Luxury hero",
  macro: "Macro detail",
  lifestyle_still: "Lifestyle still life",
};

export const SCENE_LABELS: Record<Scene, string> = {
  studio: "Studio",
  boutique: "Boutique",
  golden_hour: "Golden hour",
  wedding: "Wedding",
  festive_indoor: "Festive indoor",
  outdoor_garden: "Outdoor garden",
  dark_luxe: "Dark luxe",
  marble_interior: "Marble interior",
};

export const VIBE_LABELS: Record<Vibe, string> = {
  minimal: "Minimal",
  luxury: "Luxury",
  festive: "Festive",
  bridal: "Bridal",
  everyday: "Everyday",
  vintage: "Vintage",
  minimalist_luxe: "Minimalist luxe",
};

export const OUTPUT_FORMAT_LABELS: Record<OutputFormat, string> = {
  square: "Square (1:1)",
  whatsapp: "WhatsApp catalog (1:1)",
  catalog: "Catalog / e-commerce (4:5)",
  instagram_post: "Instagram post (4:5)",
  instagram_story: "Instagram story (9:16)",
  landscape: "Landscape / banner (3:2)",
};

export const OUTPUT_FORMAT_SIZES: Record<OutputFormat, OpenAIImageSize> = {
  square: "1024x1024",
  whatsapp: "1024x1024",
  catalog: "1024x1536",
  instagram_post: "1024x1536",
  instagram_story: "1024x1536",
  landscape: "1536x1024",
};

/** Gemini native aspect ratios closest to each studio format. */
export const OUTPUT_FORMAT_GEMINI_ASPECT: Record<OutputFormat, string> = {
  square: "1:1",
  whatsapp: "1:1",
  catalog: "4:5",
  instagram_post: "4:5",
  instagram_story: "9:16",
  landscape: "3:2",
};

export const OUTPUT_FORMAT_ASPECT_CLASS: Record<OutputFormat, string> = {
  square: "aspect-square max-w-xl",
  whatsapp: "aspect-square max-w-xl",
  catalog: "aspect-[4/5] max-w-md",
  instagram_post: "aspect-[4/5] max-w-md",
  instagram_story: "aspect-[9/16] max-w-[280px]",
  landscape: "aspect-[3/2] max-w-2xl",
};

export function parseStudioStyle(body: Record<string, unknown>): StudioStyle {
  const modeRaw = body.mode as GenerationMode;
  const mode = GENERATION_MODES.includes(modeRaw) ? modeRaw : "model";
  const placement = body.placement as Placement;
  const subject = body.subject as Subject;
  const shotRaw = body.shot ?? body.model;
  const shot = shotRaw as Shot;
  const framing = body.framing as Framing;
  const scene = body.scene as Scene;
  const vibe = body.vibe as Vibe;
  const format = body.format as OutputFormat;

  const parsed: StudioStyle = {
    mode,
    placement: PLACEMENTS.includes(placement) ? placement : "auto",
    subject: SUBJECTS.includes(subject) ? subject : "auto",
    shot: SHOTS.includes(shot) ? shot : "editorial",
    framing: FRAMINGS.includes(framing) ? framing : "catalog",
    scene: SCENES.includes(scene) ? scene : "studio",
    vibe: VIBES.includes(vibe) ? vibe : "luxury",
    format: OUTPUT_FORMATS.includes(format) ? format : "square",
  };

  if (mode === "background") {
    parsed.placement = "auto";
    parsed.subject = "auto";
  }

  return parsed;
}
