/** Server-only environment helpers for generation providers. */

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

/** OpenAI API key from https://platform.openai.com/api-keys */
export function getOpenAIApiKey(): string | undefined {
  return normalizeKey(process.env.OPENAI_API_KEY);
}

export function getOpenAIImageModel(): string {
  return process.env.OPENAI_IMAGE_MODEL?.trim() || "gpt-image-1";
}

export function isOpenAIConfigured(): boolean {
  return Boolean(getOpenAIApiKey());
}

/** Gemini API key from https://aistudio.google.com/apikey */
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

/** Veo / Gemini video model. Override with GEMINI_VIDEO_MODEL. */
export function getGeminiVideoModel(): string {
  return (
    process.env.GEMINI_VIDEO_MODEL?.trim() || "veo-3.1-fast-generate-preview"
  );
}

export function isVideoGenerationConfigured(): boolean {
  return isGeminiConfigured();
}

/** auto = Gemini first when available, OpenAI fallback; openai/gemini force one provider. */
export function getImageProviderPreference(): ImageProviderPreference {
  const raw = process.env.IMAGE_PROVIDER?.trim().toLowerCase();
  if (raw === "openai" || raw === "gemini" || raw === "auto") return raw;
  // Default to gemini-only path when unset so production does not burn OpenAI by accident.
  if (isGeminiConfigured()) return "gemini";
  if (isOpenAIConfigured()) return "openai";
  return "auto";
}

export function isGenerationConfigured(): boolean {
  return isOpenAIConfigured() || isGeminiConfigured();
}
