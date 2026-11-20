export const PROMPT_CONSENT_STORAGE_KEY = "jwelpixel-prompt-consent-v1";

export const PROMPT_DISCLAIMER =
  "Custom prompts are for jewelry product marketing only. Do not ask for nude, sexual, violent, hateful, or illegal images. We may block unsafe prompts.";

export const PROMPT_CONSENT_LABEL =
  "I agree to use custom prompts only for jewelry marketing and not for NSFW, sexual, violent, or illegal content.";

export const PROMPT_BLOCKED_MESSAGE =
  "This prompt was blocked. Custom prompts are for jewelry marketing only — no NSFW, nude, sexual, violent, or illegal requests.";

export const PROMPT_CONSENT_REQUIRED_MESSAGE =
  "Please accept the custom prompt disclaimer before generating.";

const BLOCKED_PATTERNS: RegExp[] = [
  /\bnsfw\b/i,
  /\bporn(ography)?\b/i,
  /\bxxx\b/i,
  /\berotic\b/i,
  /\bsex(ual|ually|y)?\b/i,
  /\bnude\b/i,
  /\bnudity\b/i,
  /\bnaked\b/i,
  /\btopless\b/i,
  /\bbottomless\b/i,
  /\bunclothed\b/i,
  /\bundress(ed|ing)?\b/i,
  /\bbikini\b/i,
  /\blingerie\b/i,
  /\bonly\s*fans\b/i,
  /\bbreast(s)?\b/i,
  /\bnipple(s)?\b/i,
  /\bgenital(s|ia)?\b/i,
  /\bvagina\b/i,
  /\bpenis\b/i,
  /\bbutt\s*naked\b/i,
  /\bintimate\s+pose\b/i,
  /\bseductive\s+nude\b/i,
  /\bwithout\s+clothes\b/i,
  /\bno\s+clothes\b/i,
  /\bremove\s+(her|his|their|the)\s+clothes\b/i,
  /\bchild\b/i,
  /\bminor\b/i,
  /\bunderage\b/i,
  /\bloli\b/i,
  /\bpedophil/i,
  /\bkill(ing)?\b/i,
  /\bmurder\b/i,
  /\bgore\b/i,
  /\bbehead/i,
  /\btorture\b/i,
  /\brape\b/i,
  /\bsuicide\b/i,
  /\bterroris/i,
  /\bhate\s+speech\b/i,
  /\bracial\s+slur\b/i,
];

export function assertPromptSafe(prompt: string | null | undefined): {
  ok: true;
} | {
  ok: false;
  error: string;
} {
  const text = (prompt ?? "").trim();
  if (!text) return { ok: true };

  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(text)) {
      return { ok: false, error: PROMPT_BLOCKED_MESSAGE };
    }
  }

  return { ok: true };
}

export function readPromptConsent(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(PROMPT_CONSENT_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writePromptConsent(accepted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    if (accepted) window.localStorage.setItem(PROMPT_CONSENT_STORAGE_KEY, "1");
    else window.localStorage.removeItem(PROMPT_CONSENT_STORAGE_KEY);
  } catch {
    /* ignore quota / private mode */
  }
}
