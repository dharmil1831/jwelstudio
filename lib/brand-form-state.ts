import type { LogoPlacement } from "@/lib/brand-options";
import type { PosterTemplateId } from "@/lib/poster-templates";

export type BrandFormState = {
  brandName: string;
  marketingLine: string;
  grams: string;
  headline: string;
  phone: string;
  highlights: string;
  address: string;
  instagram: string;
  whatsapp: string;
  festivalId: string;
  festivalLabel: string;
  watermark: boolean;
  logoPlacement: LogoPlacement;
  posterTemplate: PosterTemplateId;
  /** Hex accent used on share cards (gold default). */
  accentColor: string;
  logoBase64: string | null;
  logoMimeType: string | null;
};

export const EMPTY_BRAND: BrandFormState = {
  brandName: "",
  marketingLine: "",
  grams: "",
  headline: "",
  phone: "",
  highlights: "",
  address: "",
  instagram: "",
  whatsapp: "",
  festivalId: "none",
  festivalLabel: "",
  watermark: false,
  logoPlacement: "corner_br",
  posterTemplate: "classic",
  accentColor: "#B8924A",
  logoBase64: null,
  logoMimeType: null,
};

export const BRAND_ACCENT_PRESETS = [
  "#B8924A",
  "#C9A45C",
  "#D4AF37",
  "#8B1E2D",
  "#1F4B3F",
  "#2C2016",
] as const;

/** True when there is enough brand/festival content for a share card. */
export function brandKitReady(brand: BrandFormState): boolean {
  return Boolean(
    brand.brandName.trim() ||
      brand.marketingLine.trim() ||
      brand.headline.trim() ||
      brand.logoBase64 ||
      (brand.festivalId && brand.festivalId !== "none"),
  );
}
