import type { Framing, StudioStyle } from "@/lib/style-options";

const jewelryFidelityRules = [
  "CRITICAL JEWELRY FIDELITY RULES (must obey):",
  "The uploaded image is the product reference. The jewelry in the output must be visually identical to that reference.",
  "Keep the exact same design silhouette, metal color, finish, gemstone count/shapes/colors/cuts, settings, engravings, clasp or backing, proportions, and relative sizes.",
  "Do NOT redesign, restyle, simplify, embellish, swap stones, change metal, add extra sparkle, or invent new jewelry.",
  "If any style instruction conflicts with jewelry accuracy, jewelry accuracy wins.",
].join(" ");

const placementCopy: Record<StudioStyle["placement"], string> = {
  auto:
    "Place the jewelry naturally according to what the uploaded product is; frame the shot so placement is obvious.",
  neck: "Show the piece on the neck and upper chest: necklaces, chains, pendants, chokers.",
  ears: "Show the piece on the ears: earrings or studs — ear in sharp focus.",
  hands: "Show the piece on hands: elegant pose, manicured hands, jewelry in focus.",
  finger: "Show rings on fingers with shallow depth of field and clean skin tones.",
  wrist: "Show bracelets or bangles on wrist and forearm.",
  ankle: "Show anklets on ankle or foot with tasteful crop.",
  waist: "Show waist chains, kamarbandh, or belt jewelry on midsection.",
  hair: "Show hair jewelry: maang tikka, jhoomar, or hair pins integrated in styled hair.",
  nose: "Show nose ring or nath on the nose with respectful beauty framing.",
  chest_brooch: "Show brooch pinned on chest, lapel, or saree blouse.",
  multi_piece: "Show coordinated jewelry set (necklace + earrings + bangles) styled together.",
  full_outfit:
    "Full upper-body or full-length fashion shot where jewelry is visible in a styled look.",
};

const subjectCopy: Record<StudioStyle["subject"], string> = {
  auto: "Casting: believable adult model fitting the jewelry; professional campaign look.",
  woman: "Casting: adult woman; elegant fashion/beauty portrayal.",
  man: "Casting: adult man; elegant fashion/portrait portrayal.",
  youth: "Casting: young adult model (18–25); fresh contemporary look.",
  mature: "Casting: mature adult (40s–60s); sophisticated premium feel.",
  couple: "Casting: couple wearing complementary jewelry; warm chemistry.",
  diverse: "Casting: inclusive representation across skin tones; authentic campaign.",
  south_asian: "Casting: South Asian model; natural features and styling.",
  western: "Casting: Western model; contemporary global campaign aesthetic.",
  hands_only: "Casting: hands, wrists, ears, or neck only — no identifiable face.",
  editorial_faceless: "Casting: editorial framing without clear facial identity.",
};

const shotCopy: Record<StudioStyle["shot"], string> = {
  editorial: "High-end editorial portrait with magazine lighting.",
  lifestyle: "Natural lifestyle portrait with soft daylight.",
  hands_macro: "Macro beauty shot; jewelry is the hero.",
  catalog: "Clean catalog e-commerce framing, neutral pose, product clarity.",
  side_profile: "Side or three-quarter profile highlighting placement.",
  full_body: "Full-body fashion framing with jewelry visible.",
  close_up: "Tight beauty close-up on jewelry placement area.",
  movement: "Dynamic pose with subtle motion energy; jewelry stays sharp.",
};

const framingCopy: Record<Framing, string> = {
  catalog:
    "Clean catalog e-commerce product photo: jewelry centered, sharp, evenly lit, commercial crop.",
  hero: "Luxury hero still: jewelry as the campaign centerpiece with premium depth and glow on metal only.",
  macro:
    "Macro product detail: close crop on craftsmanship, stones, and metalwork; jewelry fills the frame.",
  lifestyle_still:
    "Lifestyle still life: jewelry arranged on a styled surface with supporting props that never hide the piece.",
};

const sceneCopy: Record<StudioStyle["scene"], string> = {
  studio: "Clean studio background, softbox lighting, neutral backdrop.",
  boutique: "Upscale jewelry boutique interior with warm reflections.",
  golden_hour: "Outdoor golden hour with warm rim light.",
  wedding: "Elegant wedding setting; soft ceremonial ambiance.",
  festive_indoor: "Festive indoor setting with rich decor and warm light.",
  outdoor_garden: "Outdoor garden with natural greenery and soft bokeh.",
  dark_luxe: "Dark luxe mood with dramatic contrast and spotlight on jewelry.",
  marble_interior: "Marble interior with premium architectural backdrop.",
};

const vibeCopy: Record<StudioStyle["vibe"], string> = {
  minimal: "Minimal styling; understated wardrobe; focus on metal and stones.",
  luxury: "Luxury campaign: silk, velvet, rich tones, premium finish.",
  festive: "Celebratory festive context; jewelry highlighted tastefully.",
  bridal: "Bridal styling; traditional-meets-modern elegance.",
  everyday: "Everyday wearable styling; approachable and relatable.",
  vintage: "Vintage-inspired styling with classic tones.",
  minimalist_luxe: "Minimalist luxe: clean lines with premium finish.",
};

const backgroundVibeCopy: Record<StudioStyle["vibe"], string> = {
  minimal: "Minimal product styling; uncluttered surface; focus on metal and stones.",
  luxury: "Luxury display: silk, velvet, or rich tones with a premium finish.",
  festive: "Celebratory festive context; jewelry highlighted tastefully.",
  bridal: "Bridal still life; traditional-meets-modern elegance.",
  everyday: "Everyday wearable product styling; approachable and relatable.",
  vintage: "Vintage-inspired still life with classic tones.",
  minimalist_luxe: "Minimalist luxe: clean lines with premium finish.",
};

export function buildJewelryPrompt(style: StudioStyle): string {
  return [
    jewelryFidelityRules,
    "Only change the model, pose, wardrobe, background, and lighting — never the jewelry identity.",
    "",
    "Task: create one photorealistic photograph of a model wearing this exact jewelry piece.",
    "Skin tones natural; anatomy correct; jewelry sharp and true to the reference.",
    "",
    "Jewelry placement:",
    placementCopy[style.placement],
    "",
    "Model / casting:",
    subjectCopy[style.subject],
    "",
    "Shot & camera:",
    shotCopy[style.shot],
    "Scene:",
    sceneCopy[style.scene],
    "Mood:",
    vibeCopy[style.vibe],
    "",
    "Final check: the jewelry must match the uploaded product image exactly — same piece, not a similar piece.",
  ].join(" ");
}

export function buildBackgroundPrompt(style: StudioStyle): string {
  return [
    jewelryFidelityRules,
    "Only change the backdrop, surface, lighting, and camera — never the jewelry identity.",
    "",
    "Task: create one photorealistic product photograph of this exact jewelry piece on a styled background.",
    "No model, no person, no hands, no body, no mannequin, no neck form.",
    "The jewelry must remain the hero subject, sharp and true to the reference.",
    "",
    "Framing:",
    framingCopy[style.framing],
    "Scene / background:",
    sceneCopy[style.scene],
    "Mood:",
    backgroundVibeCopy[style.vibe],
    "",
    "Final check: the jewelry must match the uploaded product image exactly — same piece, not a similar piece.",
  ].join(" ");
}

export type { StudioStyle } from "@/lib/style-options";
