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
  "north_indian",
  "south_indian",
  "east_indian",
  "west_indian",
  "korean",
  "chinese",
  "british",
  "european",
  "african",
  "arabian",
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
  "beach",
  "day_outdoor",
  "night_city",
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

/** All formats accepted by API (legacy + social). */
export const OUTPUT_FORMATS = [
  "whatsapp",
  "whatsapp_status",
  "instagram_post",
  "instagram_story",
  "square",
  "catalog",
  "landscape",
] as const;

/** Formats shown in the studio UI (platform names only). */
export const STUDIO_OUTPUT_FORMATS = [
  "whatsapp",
  "whatsapp_status",
  "instagram_post",
  "instagram_story",
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
  /** Solid backdrop hex for Background mode, e.g. #FFFFFF. */
  backdropColor: string | null;
  /** Campaign look (wardrobe/set). Null/auto merges with other options. */
  lookPreset: string | null;
  /** When set (Gold+), chip-driven style lines are skipped in the prompt. */
  customPrompt: string | null;
};

/** Jewelry-friendly solid backdrop presets (no Auto — default White). */
export const BACKDROP_COLOR_PRESETS = [
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "ivory", label: "Ivory", hex: "#F5F0E8" },
  { id: "black", label: "Black", hex: "#0A0A0A" },
  { id: "charcoal", label: "Charcoal", hex: "#2B2B2B" },
  { id: "maroon", label: "Maroon", hex: "#4A0E0E" },
  { id: "navy", label: "Navy", hex: "#0F1C3F" },
  { id: "forest", label: "Forest", hex: "#0F2A1F" },
  { id: "blush", label: "Blush", hex: "#F3E4E7" },
  { id: "gold", label: "Soft gold", hex: "#C9A227" },
] as const;

export const DEFAULT_BACKDROP_HEX = "#FFFFFF";

export function normalizeBackdropHex(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.toLowerCase() === "auto") return null;
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  if (!/^#[0-9A-Fa-f]{6}$/.test(withHash)) return null;
  return withHash.toUpperCase();
}

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
  north_indian: "North Indian",
  south_indian: "South Indian",
  east_indian: "East Indian",
  west_indian: "West Indian",
  korean: "Korean",
  chinese: "Chinese",
  british: "British",
  european: "European",
  african: "African",
  arabian: "Arabian / Middle Eastern",
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
  beach: "Beach",
  day_outdoor: "Day outdoor",
  night_city: "Night city",
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
  whatsapp: "WhatsApp image",
  whatsapp_status: "WhatsApp Status",
  instagram_post: "Instagram post",
  instagram_story: "Instagram Story",
  square: "Square",
  catalog: "Catalog / e-commerce",
  landscape: "Landscape / banner",
};

export const OUTPUT_FORMAT_SIZES: Record<OutputFormat, OpenAIImageSize> = {
  square: "1024x1024",
  whatsapp: "1024x1024",
  whatsapp_status: "1024x1536",
  catalog: "1024x1536",
  instagram_post: "1024x1536",
  instagram_story: "1024x1536",
  landscape: "1536x1024",
};

/** Gemini native aspect ratios closest to each studio format. */
export const OUTPUT_FORMAT_GEMINI_ASPECT: Record<OutputFormat, string> = {
  square: "1:1",
  whatsapp: "1:1",
  whatsapp_status: "9:16",
  catalog: "4:5",
  instagram_post: "4:5",
  instagram_story: "9:16",
  landscape: "3:2",
};

export const OUTPUT_FORMAT_ASPECT_CLASS: Record<OutputFormat, string> = {
  square: "aspect-square max-w-xl",
  whatsapp: "aspect-square max-w-xl",
  whatsapp_status: "aspect-[9/16] max-w-[280px]",
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

  const lookRaw =
    typeof body.lookPreset === "string"
      ? body.lookPreset.trim()
      : typeof body.look === "string"
        ? body.look.trim()
        : null;

  const parsed: StudioStyle = {
    mode,
    placement: PLACEMENTS.includes(placement) ? placement : "auto",
    subject: SUBJECTS.includes(subject) ? subject : "auto",
    shot: SHOTS.includes(shot) ? shot : "editorial",
    framing: FRAMINGS.includes(framing) ? framing : "catalog",
    scene: SCENES.includes(scene) ? scene : "studio",
    vibe: VIBES.includes(vibe) ? vibe : "luxury",
    format: OUTPUT_FORMATS.includes(format) ? format : "whatsapp",
    backdropColor: null,
    lookPreset: lookRaw && lookRaw.length > 0 ? lookRaw : "auto",
    customPrompt: null,
  };

  const customRaw = body.customPrompt;
  if (typeof customRaw === "string") {
    const trimmed = customRaw.trim().slice(0, 2000);
    parsed.customPrompt = trimmed.length > 0 ? trimmed : null;
  }

  if (mode === "background") {
    parsed.placement = "auto";
    parsed.subject = "auto";
    parsed.lookPreset = null;
    parsed.backdropColor =
      normalizeBackdropHex(body.backdropColor) ?? DEFAULT_BACKDROP_HEX;
  }

  return parsed;
}
