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

export function isGenerationConfigured(): boolean {
  return isOpenAIConfigured();
}
