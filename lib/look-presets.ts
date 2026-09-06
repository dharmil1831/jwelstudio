/**
 * Campaign look library for jewelry model / video shoots.
 * Looks shape wardrobe / set / lighting only — never invent jewelry pieces.
 * User studio options (subject, placement, scene, vibe, custom prompt) always win on conflicts.
 * No real celebrity names or likeness instructions.
 */

export const LOOK_PRESET_IDS = [
  "auto",
  "bridal_studio",
  "beauty_closeup",
  "glamour_studio",
  "outdoor_bridal",
  "tuxedo_luxury",
  "couple_wedding",
  "macro_hand",
  "side_profile_beauty",
  "western_velvet_city",
  "gujarati_bridal",
  "high_fashion",
  "ethnic_bridal",
] as const;

export type LookPresetId = (typeof LOOK_PRESET_IDS)[number];

export const LOOK_PRESET_LABELS: Record<LookPresetId, string> = {
  auto: "Auto (from your options)",
  bridal_studio: "Bridal studio",
  beauty_closeup: "Beauty close-up",
  glamour_studio: "Glamour studio",
  outdoor_bridal: "Outdoor bridal",
  tuxedo_luxury: "Tuxedo luxury",
  couple_wedding: "Couple wedding",
  macro_hand: "Macro hand",
  side_profile_beauty: "Side-profile beauty",
  western_velvet_city: "Velvet + city dusk",
  gujarati_bridal: "Gujarati bridal",
  high_fashion: "High fashion",
  ethnic_bridal: "Ethnic bridal / groom",
};

export const LOOK_PRESET_HINTS: Record<LookPresetId, string> = {
  auto: "Uses your model, scene & mood selections",
  bridal_studio: "Bridal studio lighting, soft glam",
  beauty_closeup: "Tight beauty portrait, soft glam",
  glamour_studio: "Campaign studio, elegant evening gown",
  outdoor_bridal: "Outdoor bridal light, soft natural glow",
  tuxedo_luxury: "Black-tie luxury studio for men's jewelry",
  couple_wedding: "Bride & groom portrait energy",
  macro_hand: "Hands macro on natural surface",
  side_profile_beauty: "Side / three-quarter beauty close-up",
  western_velvet_city: "Black velvet gown, dusk city bokeh",
  gujarati_bridal: "Traditional red / bridal ethnic styling",
  high_fashion: "Editorial high-fashion campaign",
  ethnic_bridal: "Traditional bridal or groom attire",
};

/** Wardrobe / set / lighting only — jewelry always from upload. */
const LOOK_IMAGE_LINES: Record<Exclude<LookPresetId, "auto">, string> = {
  bridal_studio:
    "LOOK: Ultra-realistic bridal studio campaign. Soft glam makeup, bridal or festive formal wardrobe suited to the selected casting. Soft studio beauty lighting that flatters metal and stones. Do not invent extra jewelry.",
  beauty_closeup:
    "LOOK: Close-up beauty portrait. Soft glam makeup, elegant studio backdrop, jewelry-first framing. Do not invent extra jewelry.",
  glamour_studio:
    "LOOK: Glamour studio campaign. Elegant evening or formal dress with a neckline that shows the uploaded jewelry clearly. Premium studio lighting. Do not invent extra jewelry.",
  outdoor_bridal:
    "LOOK: Outdoor bridal shoot. Soft natural daylight, romantic outdoor setting, bridal or festive ethnic formalwear matching the selected casting. Do not invent extra jewelry (no maang tikka or extras unless present in the upload).",
  tuxedo_luxury:
    "LOOK: Luxury studio with a male or masculine-presenting model in a black tuxedo / black-tie formalwear when casting allows; otherwise formal eveningwear. Spotlight jewelry on the correct placement. Do not invent extra jewelry.",
  couple_wedding:
    "LOOK: Couple wedding / engagement portrait energy — tasteful pose that showcases the uploaded jewelry. Do not invent complementary rings or extra set pieces.",
  macro_hand:
    "LOOK: Macro close-up of hands/wrists on a natural wooden or neutral surface when placement fits; shallow depth of field; jewelry sharp and exact. Do not invent extra rings or bangles.",
  side_profile_beauty:
    "LOOK: Side or three-quarter face beauty close-up with a natural smile; jewelry at ears/neck in sharp focus if that matches the upload. Do not invent nose pins or extras.",
  western_velvet_city:
    "LOOK: Western campaign — black velvet gown or formal eveningwear; soft dusk city skyline bokeh in the background. Jewelry remains the hero. Do not invent extra jewelry.",
  gujarati_bridal:
    "LOOK: Gujarati / West Indian bridal styling — traditional red or bridal saree / lehenga when casting fits; warm celebratory light. Wear ONLY jewelry from the upload — no invented heavy set pieces.",
  high_fashion:
    "LOOK: High-fashion editorial campaign. Sharp styling, magazine lighting, confident pose; wardrobe supports the jewelry without hiding it. Do not invent extra jewelry.",
  ethnic_bridal:
    "LOOK: Ethnic bridal or groom formalwear matching the selected casting and culture (lehenga, saree, sherwani, or regional equivalent). Ceremonial mood. Do not invent extra jewelry.",
};

const LOOK_VIDEO_LINES: Record<Exclude<LookPresetId, "auto">, string> = {
  bridal_studio:
    "Video look: bridal studio clip, soft glam, smooth motion; slow cinematic pan that catches sparkle on the exact uploaded jewelry.",
  beauty_closeup:
    "Video look: beauty close-up clip; slow cinematic pan highlighting sparkle on the exact uploaded jewelry.",
  glamour_studio:
    "Video look: glamour studio campaign clip; slow cinematic pan on the exact uploaded jewelry.",
  outdoor_bridal:
    "Video look: outdoor bridal clip with soft daylight; slow cinematic pan on the exact uploaded jewelry.",
  tuxedo_luxury:
    "Video look: tuxedo / black-tie luxury studio clip; slow cinematic pan on the exact uploaded jewelry.",
  couple_wedding:
    "Video look: couple wedding portrait clip; slow cinematic pan on the exact uploaded jewelry only.",
  macro_hand:
    "Video look: macro hand clip; slow cinematic pan across the exact uploaded jewelry.",
  side_profile_beauty:
    "Video look: side-profile beauty clip; slow cinematic pan highlighting the exact uploaded jewelry.",
  western_velvet_city:
    "Video look: velvet gown + dusk city bokeh; slow cinematic pan on the exact uploaded jewelry.",
  gujarati_bridal:
    "Video look: Gujarati bridal styling clip; slow cinematic pan on the exact uploaded jewelry only.",
  high_fashion:
    "Video look: high-fashion editorial clip; slow cinematic pan on the exact uploaded jewelry.",
  ethnic_bridal:
    "Video look: ethnic bridal/groom clip; slow cinematic pan on the exact uploaded jewelry only.",
};

export function parseLookPreset(raw: unknown): LookPresetId {
  if (typeof raw === "string") {
    const id = raw.trim();
    // Legacy ids from earlier look pack naming
    if (id === "bollywood_closeup") return "beauty_closeup";
    if (id === "celebrity_studio") return "glamour_studio";
    if ((LOOK_PRESET_IDS as readonly string[]).includes(id)) {
      return id as LookPresetId;
    }
  }
  return "auto";
}

/** Infer a look from user scene / vibe / shot / subject when Look = Auto. */
export function resolveLookPreset(opts: {
  look: LookPresetId;
  scene?: string;
  vibe?: string;
  shot?: string;
  subject?: string;
  placement?: string;
}): Exclude<LookPresetId, "auto"> | null {
  if (opts.look !== "auto") return opts.look;

  const { scene, vibe, shot, subject, placement } = opts;

  if (shot === "hands_macro" || placement === "finger" || placement === "hands") {
    return "macro_hand";
  }
  if (shot === "side_profile" || shot === "close_up") {
    return "side_profile_beauty";
  }
  if (subject === "couple") return "couple_wedding";
  if (subject === "man" && (vibe === "luxury" || scene === "dark_luxe")) {
    return "tuxedo_luxury";
  }
  if (subject === "west_indian" && (vibe === "bridal" || vibe === "festive")) {
    return "gujarati_bridal";
  }
  if (vibe === "bridal" && (scene === "golden_hour" || scene === "outdoor_garden" || scene === "day_outdoor")) {
    return "outdoor_bridal";
  }
  if (vibe === "bridal" || vibe === "festive") return "bridal_studio";
  if (scene === "night_city" || scene === "dark_luxe") return "western_velvet_city";
  if (shot === "editorial" && vibe === "luxury") return "glamour_studio";
  if (shot === "full_body" || vibe === "luxury") return "high_fashion";
  if (scene === "wedding") return "ethnic_bridal";

  return null;
}

export function lookImagePromptLine(look: LookPresetId | null | undefined): string | null {
  if (!look || look === "auto") return null;
  return LOOK_IMAGE_LINES[look] ?? null;
}

export function lookVideoPromptLine(look: LookPresetId | null | undefined): string | null {
  if (!look || look === "auto") return null;
  return LOOK_VIDEO_LINES[look] ?? null;
}

export function resolvedLookImageLine(opts: {
  look: LookPresetId;
  scene?: string;
  vibe?: string;
  shot?: string;
  subject?: string;
  placement?: string;
}): string | null {
  const resolved = resolveLookPreset(opts);
  return resolved ? LOOK_IMAGE_LINES[resolved] : null;
}

export function resolvedLookVideoLine(opts: {
  look: LookPresetId;
  scene?: string;
  vibe?: string;
  shot?: string;
  subject?: string;
  placement?: string;
}): string | null {
  const resolved = resolveLookPreset(opts);
  return resolved ? LOOK_VIDEO_LINES[resolved] : null;
}
