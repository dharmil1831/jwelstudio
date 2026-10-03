export type PosterTemplateId =
  | "classic"
  | "story"
  | "festival"
  | "designed-bust"
  | "designed-bangle"
  | "designed-banner";

export type RectNorm = {
  /** 0–1 of template width/height */
  x: number;
  y: number;
  w: number;
  h: number;
};

export type DesignedPosterTemplate = {
  id: PosterTemplateId;
  label: string;
  blurb: string;
  kind: "designed";
  /** Public path under /public */
  src: string;
  thumb: string;
  /** Jewelry replacement window */
  photo: RectNorm;
  logo?: RectNorm;
  /** Weight / grams badge area to overpaint */
  grams?: RectNorm;
  /** Main phone / requirement number */
  phone?: RectNorm;
  /** Optional brand name plate */
  brandName?: RectNorm;
  /** Optional headline / offer plate */
  headline?: RectNorm;
};

export type SimplePosterTemplate = {
  id: PosterTemplateId;
  label: string;
  blurb: string;
  kind: "simple";
};

export type PosterTemplate = DesignedPosterTemplate | SimplePosterTemplate;

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: "designed-bust",
    label: "Catalog bust",
    blurb: "Your WhatsApp-style bust flyer — swap jewelry + details",
    kind: "designed",
    src: "/poster-templates/template-bust-catalog.png",
    thumb: "/poster-templates/template-bust-catalog.png",
    photo: { x: 0.22, y: 0.2, w: 0.58, h: 0.42 },
    logo: { x: 0.03, y: 0.025, w: 0.16, h: 0.11 },
    brandName: { x: 0.2, y: 0.04, w: 0.42, h: 0.1 },
    headline: { x: 0.2, y: 0.12, w: 0.55, h: 0.06 },
    grams: { x: 0.6, y: 0.5, w: 0.3, h: 0.11 },
    phone: { x: 0.22, y: 0.68, w: 0.56, h: 0.08 },
  },
  {
    id: "designed-bangle",
    label: "Classic cushion",
    blurb: "Bangle / product-on-cushion store flyer",
    kind: "designed",
    src: "/poster-templates/template-bangle-classic.png",
    thumb: "/poster-templates/template-bangle-classic.png",
    photo: { x: 0.26, y: 0.3, w: 0.58, h: 0.4 },
    logo: { x: 0.36, y: 0.03, w: 0.14, h: 0.1 },
    brandName: { x: 0.18, y: 0.12, w: 0.45, h: 0.1 },
    headline: { x: 0.55, y: 0.12, w: 0.4, h: 0.1 },
    grams: { x: 0.06, y: 0.52, w: 0.24, h: 0.14 },
    phone: { x: 0.2, y: 0.78, w: 0.6, h: 0.07 },
  },
  {
    id: "designed-banner",
    label: "Feature banner",
    blurb: "Left feature rail + necklace set layout",
    kind: "designed",
    src: "/poster-templates/template-necklace-banner.png",
    thumb: "/poster-templates/template-necklace-banner.png",
    photo: { x: 0.26, y: 0.2, w: 0.62, h: 0.5 },
    logo: { x: 0.03, y: 0.025, w: 0.17, h: 0.12 },
    brandName: { x: 0.22, y: 0.08, w: 0.55, h: 0.08 },
    headline: { x: 0.22, y: 0.14, w: 0.6, h: 0.06 },
    grams: { x: 0.7, y: 0.6, w: 0.2, h: 0.1 },
    phone: { x: 0.08, y: 0.9, w: 0.45, h: 0.06 },
  },
  {
    id: "classic",
    label: "Simple classic",
    blurb: "Auto cream layout (no designed background)",
    kind: "simple",
  },
  {
    id: "story",
    label: "Status / story",
    blurb: "Tall WhatsApp-style auto layout",
    kind: "simple",
  },
  {
    id: "festival",
    label: "Festival offer",
    blurb: "Full-bleed festive photo + offer overlay",
    kind: "simple",
  },
];

export function getPosterTemplate(id: string | null | undefined): PosterTemplate {
  return (
    POSTER_TEMPLATES.find((t) => t.id === id) ??
    POSTER_TEMPLATES[0]
  );
}

export function isDesignedTemplate(
  t: PosterTemplate,
): t is DesignedPosterTemplate {
  return t.kind === "designed";
}

export function rectToPx(rect: RectNorm, width: number, height: number) {
  return {
    x: Math.round(rect.x * width),
    y: Math.round(rect.y * height),
    w: Math.round(rect.w * width),
    h: Math.round(rect.h * height),
  };
}
