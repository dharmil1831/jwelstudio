/** India-focused festival / marketing presets for Gold+ branding. */

export type FestivalPreset = {
  id: string;
  label: string;
  /** Rough month (1–12) for “upcoming” sorting; 0 = always relevant. */
  month: number;
  prompt: string;
};

export const FESTIVAL_PRESETS: FestivalPreset[] = [
  {
    id: "none",
    label: "None",
    month: 0,
    prompt: "",
  },
  {
    id: "diwali",
    label: "Diwali",
    month: 10,
    prompt:
      "Festive Diwali jewelry campaign mood: warm festive lights, subtle diyas/glow in the set only — do not alter the jewelry piece.",
  },
  {
    id: "akshaya_tritiya",
    label: "Akshaya Tritiya",
    month: 4,
    prompt:
      "Akshaya Tritiya gold-buying campaign mood: auspicious premium feel in wardrobe/set only — jewelry stays exact to the upload.",
  },
  {
    id: "dhanteras",
    label: "Dhanteras",
    month: 10,
    prompt:
      "Dhanteras festive jewelry promo mood: rich warm tones and celebratory context — do not redesign the jewelry.",
  },
  {
    id: "eid",
    label: "Eid",
    month: 0,
    prompt:
      "Eid celebration jewelry campaign mood: elegant festive styling in set/wardrobe only — jewelry identity locked to the upload.",
  },
  {
    id: "christmas",
    label: "Christmas",
    month: 12,
    prompt:
      "Christmas / holiday gifting jewelry mood: soft festive ambiance — do not alter the jewelry.",
  },
  {
    id: "wedding_season",
    label: "Wedding season",
    month: 11,
    prompt:
      "Indian wedding-season jewelry campaign: bridal/celebration ambiance in set and styling only — exact jewelry from upload.",
  },
  {
    id: "karva_chauth",
    label: "Karva Chauth",
    month: 10,
    prompt:
      "Karva Chauth festive jewelry mood: warm evening celebration context — jewelry must match the upload exactly.",
  },
  {
    id: "navratri",
    label: "Navratri",
    month: 9,
    prompt:
      "Navratri festive jewelry campaign mood: celebratory color and energy in the scene only — never change the jewelry design.",
  },
];

export type LogoPlacement =
  | "corner_br"
  | "corner_bl"
  | "corner_tr"
  | "corner_tl"
  | "bottom_center"
  | "subtle";

export const LOGO_PLACEMENTS: LogoPlacement[] = [
  "corner_br",
  "corner_bl",
  "corner_tr",
  "corner_tl",
  "bottom_center",
  "subtle",
];

export const LOGO_PLACEMENT_LABELS: Record<LogoPlacement, string> = {
  corner_br: "Bottom right",
  corner_bl: "Bottom left",
  corner_tr: "Top right",
  corner_tl: "Top left",
  bottom_center: "Bottom center",
  subtle: "Subtle / small",
};

export type BrandOptions = {
  brandName: string | null;
  marketingLine: string | null;
  grams: string | null;
  festivalId: string;
  watermark: boolean;
  logoPlacement: LogoPlacement;
  logoBase64: string | null;
  logoMimeType: string | null;
};

export function getUpcomingFestivals(limit = 6): FestivalPreset[] {
  const month = new Date().getMonth() + 1;
  const scored = FESTIVAL_PRESETS.filter((f) => f.id !== "none").map((f) => {
    let distance = f.month === 0 ? 3 : (f.month - month + 12) % 12;
    if (distance > 6) distance = 12 - distance;
    return { f, distance };
  });
  scored.sort((a, b) => a.distance - b.distance || a.f.label.localeCompare(b.f.label));
  return [
    FESTIVAL_PRESETS[0],
    ...scored.slice(0, limit).map((s) => s.f),
  ];
}

export function festivalById(id: string | null | undefined): FestivalPreset | null {
  if (!id || id === "none") return null;
  return FESTIVAL_PRESETS.find((f) => f.id === id) ?? null;
}

export function parseBrandOptions(body: Record<string, unknown>): BrandOptions {
  const brandName =
    typeof body.brandName === "string" ? body.brandName.trim().slice(0, 80) : "";
  const marketingLine =
    typeof body.marketingLine === "string"
      ? body.marketingLine.trim().slice(0, 160)
      : "";
  const grams =
    typeof body.grams === "string" ? body.grams.trim().slice(0, 40) : "";
  const festivalId =
    typeof body.festivalId === "string" &&
    FESTIVAL_PRESETS.some((f) => f.id === body.festivalId)
      ? body.festivalId
      : "none";
  const watermark = Boolean(body.watermark);
  const placementRaw =
    typeof body.logoPlacement === "string" ? body.logoPlacement : "corner_br";
  const logoPlacement = LOGO_PLACEMENTS.includes(placementRaw as LogoPlacement)
    ? (placementRaw as LogoPlacement)
    : "corner_br";

  let logoBase64: string | null = null;
  let logoMimeType: string | null = null;
  if (
    typeof body.logoBase64 === "string" &&
    body.logoBase64.length > 0 &&
    body.logoBase64.length <= 800_000
  ) {
    logoBase64 = body.logoBase64;
    logoMimeType =
      typeof body.logoMimeType === "string" && body.logoMimeType.startsWith("image/")
        ? body.logoMimeType
        : "image/png";
  }

  return {
    brandName: brandName || null,
    marketingLine: marketingLine || null,
    grams: grams || null,
    festivalId,
    watermark,
    logoPlacement,
    logoBase64,
    logoMimeType,
  };
}

export function brandHasContent(brand: BrandOptions): boolean {
  return Boolean(
    brand.brandName ||
      brand.marketingLine ||
      brand.grams ||
      (brand.festivalId && brand.festivalId !== "none") ||
      brand.logoBase64 ||
      brand.watermark,
  );
}

export function buildBrandPromptLines(brand: BrandOptions): string {
  const lines: string[] = [];
  const fest = festivalById(brand.festivalId);
  if (fest?.prompt) lines.push(fest.prompt);

  if (brand.brandName) {
    lines.push(
      `Brand: tastefully include the brand name "${brand.brandName}" as small marketing text or signage in the composition without covering or altering the jewelry.`,
    );
  }
  if (brand.marketingLine) {
    lines.push(
      `Marketing line (optional small banner/caption in frame, never on the jewelry itself): "${brand.marketingLine}".`,
    );
  }
  if (brand.grams) {
    lines.push(
      `Product detail note for authenticity context: jewelry weight about ${brand.grams} — do not invent incorrect hallmarks on the metal.`,
    );
  }

  if (brand.watermark || brand.logoBase64) {
    const place = LOGO_PLACEMENT_LABELS[brand.logoPlacement];
    lines.push(
      brand.logoBase64
        ? `A second image is the brand logo. Place a small discreet watermark/logo in the ${place} of the frame. Never cover, crop, or alter the jewelry. Keep logo opacity tasteful.`
        : `Add a small discreet text watermark${brand.brandName ? ` for "${brand.brandName}"` : ""} in the ${place}. Never cover the jewelry.`,
    );
  }

  if (lines.length === 0) return "";
  return ["Brand / marketing (secondary to jewelry fidelity):", ...lines].join(
    " ",
  );
}
