function normalizeKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;
  let k = raw.replace(/^\uFEFF/, "").trim();
  if (
    (k.startsWith('"') && k.endsWith('"')) ||
    (k.startsWith("'") && k.endsWith("'"))
  ) {
    k = k.slice(1, -1).trim();
  }
  return k.length > 0 ? k : undefined;
}

export type ImageProviderPreference = "auto" | "openai" | "gemini";

export function getOpenAIApiKey(): string | undefined {
  return normalizeKey(process.env.OPENAI_API_KEY);
}

export function getOpenAIImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

export function getGeminiApiKey(): string | undefined {
  return (
    normalizeKey(process.env.GEMINI_API_KEY) ??
    normalizeKey(process.env.GOOGLE_AI_API_KEY) ??
    normalizeKey(process.env.GOOGLE_GENERATIVE_AI_API_KEY)
  );
}

export function getGeminiImageModel(): string {
  return (
    process.env.GEMINI_IMAGE_MODEL?.trim() ||
    "gemini-3.1-flash-image-preview"
  );
}

export function isGeminiConfigured(): boolean {
  return Boolean(getGeminiApiKey());
}

export function getGoogleCalendarApiKey(): string | undefined {
  return normalizeKey(process.env.GOOGLE_CALENDAR_API_KEY);
}

const DEFAULT_GEMINI_VIDEO_MODEL = "gemini-omni-1.2-flash";

const RETIRED_GEMINI_VIDEO_MODELS = new Set([
  "veo-3.1-fast-generate-preview",
  "veo-3.1-generate-preview",
  "veo-3.1-lite-generate-preview",
]);

/** Older Omni endpoints — route to 1.2 for better jewelry stability and lower cost. */
const LEGACY_GEMINI_VIDEO_MODELS = new Set([
  "gemini-omni-1.1-flash",
  "gemini-omni-flash-preview",
]);

export function getGeminiVideoModel(): string {
  const configured = process.env.GEMINI_VIDEO_MODEL?.trim();
  if (
    !configured ||
    RETIRED_GEMINI_VIDEO_MODELS.has(configured) ||
    LEGACY_GEMINI_VIDEO_MODELS.has(configured)
  ) {
    return DEFAULT_GEMINI_VIDEO_MODEL;
  }
  return configured;
}

export function isVideoGenerationConfigured(): boolean {
  return isGeminiConfigured();
}

export function getImageProviderPreference(): ImageProviderPreference {
  const raw = process.env.IMAGE_PROVIDER?.trim().toLowerCase();
  if (raw === "openai" || raw === "gemini" || raw === "auto") return raw;
  if (isGeminiConfigured()) return "gemini";
  if (isOpenAIConfigured()) return "openai";
  return "auto";
}

export function isGenerationConfigured(): boolean {
  return isOpenAIConfigured() || isGeminiConfigured();
}
