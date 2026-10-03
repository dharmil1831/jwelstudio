export type PosterTemplateId = "classic" | "story" | "festival";

/**
 * Client-facing layouts that we can generate cleanly in-app.
 * Designed WhatsApp PNGs with burned-in brand/jewelry cannot be used
 * until we receive blank versions (empty photo hole, no store text).
 */
export type PosterTemplate = {
  id: PosterTemplateId;
  label: string;
  blurb: string;
  kind: "simple";
};

export const POSTER_TEMPLATES: PosterTemplate[] = [
  {
    id: "classic",
    label: "Classic card",
    blurb: "Simple cream share card with logo, offer, and contact",
    kind: "simple",
  },
  {
    id: "story",
    label: "Status card",
    blurb: "Tall card for WhatsApp status / Instagram story",
    kind: "simple",
  },
  {
    id: "festival",
    label: "Festival card",
    blurb: "Festive photo with a clear offer banner",
    kind: "simple",
  },
];

export function getPosterTemplate(id: string | null | undefined): PosterTemplate {
  return POSTER_TEMPLATES.find((t) => t.id === id) ?? POSTER_TEMPLATES[0];
}
