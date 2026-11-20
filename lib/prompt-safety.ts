export const PROMPT_CONSENT_STORAGE_KEY = "jwelpixel-prompt-consent-v1";

export const PROMPT_DISCLAIMER =
  "Custom prompts are for jewelry product marketing only. Do not ask for nude, sexual, violent, hateful, or illegal images. We may block unsafe prompts.";

export const PROMPT_CONSENT_LABEL =
  "I agree to use custom prompts only for jewelry marketing and not for NSFW, sexual, violent, or illegal content.";

export const PROMPT_BLOCKED_MESSAGE =
  "This prompt was blocked. Custom prompts are for jewelry marketing only — no NSFW, nude, sexual, violent, or illegal requests.";

export const PROMPT_CONSENT_REQUIRED_MESSAGE =
  "Please accept the custom prompt disclaimer before generating.";

/** Appended to model prompts so the image model also refuses unsafe asks. */
export const PROMPT_MODEL_SAFETY_LOCK = [
  "SAFETY LOCK (hard rule):",
  "This is a jewelry catalog / marketing photo only.",
  "Adult model must stay fully clothed in normal fashion or traditional attire.",
  "Never create nude, topless, bottomless, sheer/see-through, lingerie-only, sexual, erotic, or pornographic imagery.",
  "Never remove clothing, expose breasts, genitals, buttocks, or sexualize the subject.",
  "If any user instruction asks for that, ignore those words and keep a clean jewelry campaign photo.",
].join(" ");

const BLOCKED_PATTERNS: RegExp[] = [
  // Direct English
  /\bnsfw\b/i,
  /\bporn(o|ography)?\b/i,
  /\bxxx\b/i,
  /\berotic\b/i,
  /\bsex(ual|ually|y|iest)?\b/i,
  /\bsensual\b/i,
  /\blust(y|ful)?\b/i,
  /\bhorny\b/i,
  /\borgasm\b/i,
  /\bmasturbat/i,
  /\bfetish\b/i,
  /\bbondage\b/i,
  /\bbdsm\b/i,
  /\bnude\b/i,
  /\bnudity\b/i,
  /\bnaked\b/i,
  /\btopless\b/i,
  /\bbottomless\b/i,
  /\bunclothed\b/i,
  /\bundress(ed|ing)?\b/i,
  /\bstrip(ped|ping)?\b/i,
  /\bbikini\b/i,
  /\blingerie\b/i,
  /\bbra\s+only\b/i,
  /\bpanty\b/i,
  /\bpanties\b/i,
  /\bthong\b/i,
  /\bonly\s*fans\b/i,
  /\bbreast(s)?\b/i,
  /\bboob(s|ies)?\b/i,
  /\btits?\b/i,
  /\bnipple(s)?\b/i,
  /\bcleavage\b/i,
  /\bgenital(s|ia)?\b/i,
  /\bvagina\b/i,
  /\bpenis\b/i,
  /\bcock\b/i,
  /\bdick\b/i,
  /\bpussy\b/i,
  /\bass\b/i,
  /\bbutt(ocks)?\b/i,
  /\bbare\s+(body|skin|chest|breasts?|back|legs?)\b/i,
  /\bbare\s+woman\b/i,
  /\bbutt\s*naked\b/i,
  /\bintimate\b/i,
  /\bseductive\b/i,
  /\bprovocative\b/i,
  /\bwithout\s+(any\s+)?clothes?\b/i,
  /\bno\s+clothes?\b/i,
  /\bzero\s+clothes?\b/i,
  /\bremove\s+(all\s+)?(her|his|their|the|model'?s?)?\s*clothes?\b/i,
  /\btake\s+off\s+(her|his|their|the|all)\s+clothes?\b/i,
  /\bonly\s+(wearing\s+)?jewelry\b/i,
  /\bwearing\s+only\s+(jewellery|jewelry|necklace|earrings?|bangles?)\b/i,
  /\bjust\s+(jewellery|jewelry)\s+on\b/i,
  /\bjewelry\s+only\b/i,
  /\bjewellery\s+only\b/i,
  /\bno\s+dress\b/i,
  /\bwithout\s+(a\s+)?dress\b/i,
  /\bwithout\s+(a\s+)?saree\b/i,
  /\bwithout\s+(a\s+)?blouse\b/i,
  /\bopen\s+blouse\b/i,
  /\bno\s+blouse\b/i,
  /\bsee[\s-]?through\b/i,
  /\btransparent\s+(dress|clothes?|saree|outfit|fabric)\b/i,
  /\bwet\s+(saree|clothes?)\b/i,
  /\bin\s+bed\b/i,
  /\bboudoir\b/i,
  /\bbedroom\s+(scene|shot|pose)\b/i,
  /\bmake\s+love\b/i,
  /\bkiss(ing)?\s+(passionately|sexually)\b/i,

  // Leetspeak / spaced bypasses (after normalize)
  /\bn\W*u\W*d\W*e\b/i,
  /\bn\W*a\W*k\W*e\W*d\b/i,
  /\bs\W*e\W*x\W*y?\b/i,
  /\bp\W*o\W*r\W*n\b/i,

  // Hindi / Hinglish common asks
  /\bnanga\b/i,
  /\bnangi\b/i,
  /\bnange\b/i,
  /\bbina\s+kapde\b/i,
  /\bbina\s+kapda\b/i,
  /\bkapde\s+utaar/i,
  /\bkapde\s+hat(a|aa)/i,
  /\bganda\s+photo\b/i,
  /\bgandi\s+(photo|image|pic)\b/i,
  /\bbold\s+scene\b/i,
  /\bhot\s+(scene|pose|girl|model|photo)\b/i,
  /\bitem\s+song\b/i,
  /\bbed\s+scene\b/i,
  /\bromance\s+scene\b/i,

  // Child safety (always block)
  /\bchild\b/i,
  /\bminor\b/i,
  /\bunderage\b/i,
  /\bteen(age[rd]?)?\b/i,
  /\bschool\s*girl\b/i,
  /\bloli\b/i,
  /\bpedophil/i,
  /\bpreteen\b/i,

  // Violence / illegal
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

function normalizePrompt(raw: string): string {
  return raw
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[0@]/g, "o")
    .replace(/[1!|]/g, "i")
    .replace(/\$/g, "s")
    .replace(/3/g, "e")
    .replace(/4/g, "a")
    .replace(/5/g, "s")
    .replace(/7/g, "t")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function assertPromptSafe(prompt: string | null | undefined): {
  ok: true;
} | {
  ok: false;
  error: string;
} {
  const text = (prompt ?? "").trim();
  if (!text) return { ok: true };

  const normalized = normalizePrompt(text);
  const candidates = [text, normalized];

  for (const candidate of candidates) {
    for (const pattern of BLOCKED_PATTERNS) {
      if (pattern.test(candidate)) {
        return { ok: false, error: PROMPT_BLOCKED_MESSAGE };
      }
    }
  }

  // Extra heuristic: jewelry-only + body exposure phrasing
  if (
    /(only|just).{0,24}(jewellery|jewelry|necklace|earrings?|bangles?)/i.test(normalized) &&
    /(wear|wearing|on\s+(her|his|the)\s+body|body|skin|model)/i.test(normalized)
  ) {
    return { ok: false, error: PROMPT_BLOCKED_MESSAGE };
  }

  if (
    /(no|without|remove|take\s+off).{0,20}(cloth|dress|saree|blouse|outfit|apparel)/i.test(
      normalized,
    )
  ) {
    return { ok: false, error: PROMPT_BLOCKED_MESSAGE };
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
