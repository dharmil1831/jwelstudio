export const TEMPLATE_CATEGORIES = [
  "bridal",
  "everyday",
  "western",
  "men",
  "couple",
  "hands",
] as const;

export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  bridal: "Bridal",
  everyday: "Everyday",
  western: "Western",
  men: "Men",
  couple: "Couple",
  hands: "Hands",
};

export function isTemplateCategory(raw: unknown): raw is TemplateCategory {
  return typeof raw === "string" && (TEMPLATE_CATEGORIES as readonly string[]).includes(raw);
}

export type PublicModelTemplate = {
  id: string;
  category: TemplateCategory;
  description: string | null;
  imageUrl: string;
};
