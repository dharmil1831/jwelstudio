export type PosterTemplateId = "classic" | "story" | "festival";

export const POSTER_TEMPLATES: {
  id: PosterTemplateId;
  label: string;
  blurb: string;
}[] = [
  {
    id: "classic",
    label: "Classic store",
    blurb: "Cream flyer, icon highlights, weight badge, contact footer",
  },
  {
    id: "story",
    label: "Status / story",
    blurb: "Tall WhatsApp-style layout with left feature pills",
  },
  {
    id: "festival",
    label: "Festival offer",
    blurb: "Full-bleed festive photo with offer headline overlay",
  },
];
