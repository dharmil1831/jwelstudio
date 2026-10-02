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
      "FESTIVAL SCENE — Navratri: celebratory Indian festive set, rich color, flowers, and warm light around the jewelry. Change only backdrop, props, and lighting. Never change the jewelry design.",
  },
  {
    id: "dussehra",
    label: "Dussehra",
    month: 10,
    prompt:
      "FESTIVAL SCENE — Dussehra / Vijayadashami / Dasara: the setting must clearly look like Dussehra. Warm gold light, marigolds, festive Indian celebration backdrop, victory-festival atmosphere. Change only the backdrop, props, and lighting. The jewelry must stay an exact copy of the upload — same pieces, stones, and metal.",
  },
];

export type LogoPlacement =
  | "corner_br"
  | "corner_bl"
  | "corner_tr"
  | "corner_tl"
  | "bottom_center"
  | "center"
  | "jewelry_center"
  | "subtle";

export const LOGO_PLACEMENTS: LogoPlacement[] = [
  "corner_br",
  "corner_bl",
  "corner_tr",
  "corner_tl",
  "bottom_center",
  "center",
  "jewelry_center",
  "subtle",
];

export const LOGO_PLACEMENT_LABELS: Record<LogoPlacement, string> = {
  corner_br: "Bottom right",
  corner_bl: "Bottom left",
  corner_tr: "Top right",
  corner_tl: "Top left",
  bottom_center: "Bottom center",
  center: "Center of image",
  jewelry_center: "Center on jewelry",
  subtle: "Subtle / small",
};

export type BrandOptions = {
  brandName: string | null;
  marketingLine: string | null;
  grams: string | null;
  festivalId: string;
  festivalLabel: string | null;
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
  const festivalRaw =
    typeof body.festivalId === "string" ? body.festivalId.trim().slice(0, 80) : "";
  const festivalId =
    festivalRaw &&
    (FESTIVAL_PRESETS.some((f) => f.id === festivalRaw) ||
      /^[a-z0-9-]{2,80}$/.test(festivalRaw))
      ? festivalRaw
      : "none";
  const festivalLabelRaw =
    typeof body.festivalLabel === "string"
      ? body.festivalLabel.trim().slice(0, 120)
      : "";
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
    festivalLabel: festivalLabelRaw || null,
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

function logoPlacementInstruction(placement: LogoPlacement): string {
  switch (placement) {
    case "jewelry_center":
      return "Place the logo in the visual center of the jewelry product area — small, centered on/near the piece, without hiding stones, clasps, or critical design detail (slightly translucent if needed).";
    case "center":
      return "Place the logo in the exact center of the overall image frame.";
    case "bottom_center":
      return "Place the logo along the bottom edge, horizontally centered.";
    case "subtle":
      return "Place a very small subtle logo in a low-contrast corner.";
    case "corner_bl":
      return "Place the logo in the bottom-left corner of the frame.";
    case "corner_tl":
      return "Place the logo in the top-left corner of the frame.";
    case "corner_tr":
      return "Place the logo in the top-right corner of the frame.";
    case "corner_br":
    default:
      return "Place the logo in the bottom-right corner of the frame.";
  }
}

export function buildBrandPromptLines(brand: BrandOptions): string {
  const lines: string[] = [];
  const fest = festivalById(brand.festivalId);
  if (fest?.prompt) {
    lines.push(fest.prompt);
  } else if (brand.festivalId !== "none" && brand.festivalLabel) {
    lines.push(
      `FESTIVAL SCENE — ${brand.festivalLabel}: the backdrop, props, and lighting must clearly read as ${brand.festivalLabel}. Change only the setting. The jewelry must stay an exact copy of the upload.`,
    );
  }

  if (!fest?.prompt && !(brand.festivalId !== "none" && brand.festivalLabel)) {
    return "";
  }

  if (lines.length === 0) return "";
  return [
    "FESTIVAL SETTING (change backdrop, props, and lighting only — never the jewelry):",
    ...lines,
    "The finished photograph must contain no store name, phone number, weight label, or logo. Those are added in the marketing poster.",
  ].join(" ");
}
