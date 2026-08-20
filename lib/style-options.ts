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

export type GenerationMode = (typeof GENERATION_MODES)[number];
export type Placement = (typeof PLACEMENTS)[number];
export type Subject = (typeof SUBJECTS)[number];
export type Shot = (typeof SHOTS)[number];
export type Framing = (typeof FRAMINGS)[number];
export type Scene = (typeof SCENES)[number];
export type Vibe = (typeof VIBES)[number];

export type StudioStyle = {
  mode: GenerationMode;
  placement: Placement;
  subject: Subject;
  shot: Shot;
  framing: Framing;
  scene: Scene;
  vibe: Vibe;
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

  const parsed: StudioStyle = {
    mode,
    placement: PLACEMENTS.includes(placement) ? placement : "auto",
    subject: SUBJECTS.includes(subject) ? subject : "auto",
    shot: SHOTS.includes(shot) ? shot : "editorial",
    framing: FRAMINGS.includes(framing) ? framing : "catalog",
    scene: SCENES.includes(scene) ? scene : "studio",
    vibe: VIBES.includes(vibe) ? vibe : "luxury",
  };

  if (mode === "background") {
    parsed.placement = "auto";
    parsed.subject = "auto";
  }

  return parsed;
}
