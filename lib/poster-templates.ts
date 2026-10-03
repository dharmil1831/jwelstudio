export type PosterTemplateId =
  | "classic"
  | "story"
  | "festival"
  | "offer"
  | "luxury";

/**
 * Client-facing layouts that we can generate cleanly in-app.
 * Matches Scalio/Photoroom-style "pick a template + brand kit" flow.
 * Designer WhatsApp PNGs need blank photo holes before we can use them.
 */
export type PosterTemplate = {
  id: PosterTemplateId;
  label: string;
  blurb: string;
  kind: "simple";
  /** Swatch colors for the visual gallery */
  swatch: [string, string, string];
};

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: "classic",
    label: "Classic store",
    blurb: "Cream flyer — logo, offer points, weight, contact",
    kind: "simple",
    swatch: ["#f4ebe0", "#b8924a", "#2c2016"],
  },
  {
    id: "story",
    label: "Status / Story",
    blurb: "Tall 9:16 for WhatsApp status & Instagram stories",
    kind: "simple",
    swatch: ["#f6efe6", "#b8924a", "#2a1f18"],
  },
  {
    id: "festival",
    label: "Festival pack",
    blurb: "Festive headline + offer chip + product hero",
    kind: "simple",
    swatch: ["#f7f1e8", "#c9a45c", "#24180f"],
  },
  {
    id: "offer",
    label: "Sale offer",
    blurb: "Full-bleed photo with big offer badge (Scalio-style ad)",
    kind: "simple",
    swatch: ["#1a120c", "#e8b84a", "#fff8ee"],
  },
  {
    id: "luxury",
    label: "Luxury dark",
    blurb: "Dark boutique look — gold type, premium footer",
    kind: "simple",
    swatch: ["#0f0d0b", "#d4af37", "#f5efe6"],
  },
];

export function getPosterTemplate(id: string | null | undefined): PosterTemplate {
  return POSTER_TEMPLATES.find((t) => t.id === id) ?? POSTER_TEMPLATES[0];
}
