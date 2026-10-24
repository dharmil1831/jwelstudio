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
  "facebook_post",
  "pinterest",
  "x_landscape",
  "line",
] as const;

/** Formats shown in the studio UI (platform names only). */
export const STUDIO_OUTPUT_FORMATS = [
  "whatsapp",
  "whatsapp_status",
  "instagram_post",
  "instagram_story",
  "square",
  "facebook_post",
  "pinterest",
  "x_landscape",
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

/** Photoroom-style product shadows for Background / Batch. */
export const JEWELRY_SHADOWS = ["off", "soft", "hard", "floating"] as const;
export type JewelryShadow = (typeof JEWELRY_SHADOWS)[number];

export const JEWELRY_SHADOW_LABELS: Record<JewelryShadow, string> = {
  off: "Off",
  soft: "Soft",
  hard: "Hard",
  floating: "Floating",
};

export const JEWELRY_SHADOW_HINTS: Record<JewelryShadow, string> = {
  off: "No cast shadow — flat catalog look",
  soft: "Diffused contact shadow under the piece",
  hard: "Sharper directional shadow",
  floating: "Lifted look with soft shadow below",
};

export type StudioStyle = {
  mode: GenerationMode;
  placement: Placement;
  subject: Subject;
  shot: Shot;
  framing: Framing;
  scene: Scene;
  vibe: Vibe;
  format: OutputFormat;
  /** Solid backdrop hex for Background mode, e.g. #FFFFFF. Null = scene-led (no solid fill). */
  backdropColor: string | null;
  /** Photoroom-like shadow for product stills. */
  jewelryShadow: JewelryShadow;
  /** Campaign look (wardrobe/set). Null/auto merges with other options. */
  lookPreset: string | null;
  /** When set (Gold+), chip-driven style lines are skipped in the prompt. */
  customPrompt: string | null;
};

/** Jewelry-friendly solid backdrop presets (no Auto — default White). */
export const BACKDROP_COLOR_PRESETS = [
  { id: "white", label: "White", hex: "#FFFFFF" },
  { id: "ivory", label: "Ivory", hex: "#F5F0E8" },
  { id: "black", label: "Black", hex: "#111111" },
  { id: "charcoal", label: "Charcoal", hex: "#6B6B6B" },
  { id: "maroon", label: "Maroon", hex: "#8E2438" },
  { id: "navy", label: "Navy", hex: "#1E3A8A" },
  { id: "forest", label: "Forest", hex: "#1B6B43" },
  { id: "blush", label: "Blush", hex: "#F4C7D2" },
  { id: "gold", label: "Soft gold", hex: "#E0B44A" },
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
  whatsapp: "WhatsApp square (1080×1080)",
  whatsapp_status: "WhatsApp Story (1080×1920)",
  instagram_post: "Instagram post 4:5 (1080×1350)",
  instagram_story: "Instagram Story (1080×1920)",
  square: "Instagram Post (1080×1080)",
  catalog: "Portrait (1080×1350)",
  landscape: "Landscape (1211×681)",
  facebook_post: "Facebook post (1200×630)",
  pinterest: "Pinterest (1000×1500)",
  x_landscape: "X Feed landscape (1200×675)",
  line: "LINE (1040×1040)",
};

/** Exact export pixels for social platforms (download / share). */
export const OUTPUT_FORMAT_EXPORT_PX: Record<
  OutputFormat,
  { width: number; height: number }
> = {
  whatsapp: { width: 1080, height: 1080 },
  whatsapp_status: { width: 1080, height: 1920 },
  instagram_post: { width: 1080, height: 1350 },
  instagram_story: { width: 1080, height: 1920 },
  square: { width: 1080, height: 1080 },
  catalog: { width: 1080, height: 1350 },
  landscape: { width: 1211, height: 681 },
  facebook_post: { width: 1200, height: 630 },
  pinterest: { width: 1000, height: 1500 },
  x_landscape: { width: 1200, height: 675 },
  line: { width: 1040, height: 1040 },
};

export const OUTPUT_FORMAT_SIZES: Record<OutputFormat, OpenAIImageSize> = {
  square: "1024x1024",
  whatsapp: "1024x1024",
  whatsapp_status: "1024x1536",
  catalog: "1024x1536",
  instagram_post: "1024x1536",
  instagram_story: "1024x1536",
  landscape: "1536x1024",
  facebook_post: "1536x1024",
  pinterest: "1024x1536",
  x_landscape: "1536x1024",
  line: "1024x1024",
};

/** Gemini native aspect ratios closest to each studio format. */
export const OUTPUT_FORMAT_GEMINI_ASPECT: Record<OutputFormat, string> = {
  square: "1:1",
  whatsapp: "1:1",
  whatsapp_status: "9:16",
  catalog: "4:5",
  instagram_post: "4:5",
  instagram_story: "9:16",
  landscape: "16:9",
  facebook_post: "16:9",
  pinterest: "2:3",
  x_landscape: "16:9",
  line: "1:1",
};

export const OUTPUT_FORMAT_ASPECT_CLASS: Record<OutputFormat, string> = {
  square: "aspect-square max-w-xl",
  whatsapp: "aspect-square max-w-xl",
  whatsapp_status: "aspect-[9/16] max-w-[280px]",
  catalog: "aspect-[4/5] max-w-md",
  instagram_post: "aspect-[4/5] max-w-md",
  instagram_story: "aspect-[9/16] max-w-[280px]",
  landscape: "aspect-video max-w-2xl",
  facebook_post: "aspect-[1200/630] max-w-2xl",
  pinterest: "aspect-[2/3] max-w-md",
  x_landscape: "aspect-video max-w-2xl",
  line: "aspect-square max-w-xl",
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

  const shadowRaw = body.jewelryShadow as JewelryShadow;
  const jewelryShadow = JEWELRY_SHADOWS.includes(shadowRaw)
    ? shadowRaw
    : "soft";

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
    jewelryShadow,
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
    const backdropMode =
      typeof body.backdropMode === "string"
        ? body.backdropMode.trim().toLowerCase()
        : "";
    if (backdropMode === "scene") {
      parsed.backdropColor = null;
    } else {
      parsed.backdropColor =
        normalizeBackdropHex(body.backdropColor) ?? DEFAULT_BACKDROP_HEX;
    }
  }

  return parsed;
}
