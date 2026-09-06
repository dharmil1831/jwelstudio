import { normalizePlanId, type PlanId } from "@/lib/entitlements";
import {
  DEFAULT_BACKDROP_HEX,
  FRAMINGS,
  GENERATION_MODES,
  OUTPUT_FORMATS,
  PLACEMENTS,
  SCENES,
  SHOTS,
  SUBJECTS,
  VIBES,
  normalizeBackdropHex,
  type Framing,
  type GenerationMode,
  type OutputFormat,
  type Placement,
  type Scene,
  type Shot,
  type Subject,
  type Vibe,
} from "@/lib/style-options";

export type ThemeStyleSnapshot = {
  mode: GenerationMode;
  placement: Placement;
  subject: Subject;
  shot: Shot;
  framing: Framing;
  scene: Scene;
  vibe: Vibe;
  format: OutputFormat;
  backdropColor: string | null;
  lookPreset: string | null;
  customPrompt: string | null;
  /** When true, pass theme previewUrl as Gemini style reference. */
  usePreviewAsReference: boolean;
};

export function themeLimitForPlan(plan: PlanId): number {
  const p = normalizePlanId(plan);
  if (p === "diamond") return 50;
  if (p === "platinum") return 10;
  return 0;
}

export function parseThemeStyleJson(raw: string): ThemeStyleSnapshot | null {
  try {
    const data = JSON.parse(raw) as Record<string, unknown>;
    return normalizeThemeStyle(data);
  } catch {
    return null;
  }
}

export function normalizeThemeStyle(
  body: Record<string, unknown>,
): ThemeStyleSnapshot | null {
  const modeRaw = body.mode as GenerationMode;
  const mode = GENERATION_MODES.includes(modeRaw) ? modeRaw : "model";
  const placement = body.placement as Placement;
  const subject = body.subject as Subject;
  const shot = body.shot as Shot;
  const framing = body.framing as Framing;
  const scene = body.scene as Scene;
  const vibe = body.vibe as Vibe;
  const format = body.format as OutputFormat;

  const customRaw = body.customPrompt;
  let customPrompt: string | null = null;
  if (typeof customRaw === "string") {
    const trimmed = customRaw.trim().slice(0, 2000);
    customPrompt = trimmed.length > 0 ? trimmed : null;
  }

  let backdropColor: string | null = null;
  if (mode === "background") {
    backdropColor =
      normalizeBackdropHex(body.backdropColor) ?? DEFAULT_BACKDROP_HEX;
  }

  const lookRaw =
    typeof body.lookPreset === "string"
      ? body.lookPreset.trim()
      : typeof body.look === "string"
        ? body.look.trim()
        : null;

  return {
    mode,
    placement: PLACEMENTS.includes(placement) ? placement : "auto",
    subject: SUBJECTS.includes(subject) ? subject : "auto",
    shot: SHOTS.includes(shot) ? shot : "editorial",
    framing: FRAMINGS.includes(framing) ? framing : "catalog",
    scene: SCENES.includes(scene) ? scene : "studio",
    vibe: VIBES.includes(vibe) ? vibe : "luxury",
    format: OUTPUT_FORMATS.includes(format) ? format : "whatsapp",
    backdropColor,
    lookPreset: lookRaw && lookRaw.length > 0 ? lookRaw : "auto",
    customPrompt,
    usePreviewAsReference: Boolean(body.usePreviewAsReference),
  };
}

export function serializeThemeStyle(style: ThemeStyleSnapshot): string {
  return JSON.stringify(style);
}

/** Accept absolute http(s) URLs or same-origin /api/uploads/ paths. */
export function normalizeThemePreviewUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const url = raw.trim().slice(0, 2000);
  if (!url) return null;
  if (url.startsWith("https://") || url.startsWith("http://")) return url;
  if (url.startsWith("/api/uploads/")) {
    const base =
      process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") ||
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`
        : "http://localhost:3000");
    return `${base}${url}`;
  }
  return null;
}

