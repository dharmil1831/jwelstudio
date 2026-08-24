import type { Framing, StudioStyle } from "@/lib/style-options";

const jewelryFidelityRules = [
  "CRITICAL JEWELRY FIDELITY RULES (must obey — highest priority):",
  "The uploaded image is the ONLY product reference. The jewelry in the output must be a pixel-faithful recreation of that exact piece.",
  "Preserve exact design silhouette, metal color/temperature, polish vs matte finish, gemstone count, shapes, colors, cuts, settings, bezels, prongs, engravings, clasp/backing, chain/link pattern, proportions, and relative sizes.",
  "Do NOT redesign, restyle, simplify, embellish, swap stones, change metal, add extra sparkle, change stone hue, or invent new jewelry.",
  "Do NOT invent matching earrings, rings, bracelets, or set pieces that are not clearly present in the uploaded reference. Show only what is in the reference photo.",
  "If any style, scene, mood, casting, or camera instruction conflicts with jewelry accuracy, jewelry accuracy always wins.",
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
  multi_piece:
    "Show the coordinated jewelry pieces that appear in the uploaded reference only — do not invent extra matching items.",
  full_outfit:
    "Full upper-body or full-length fashion shot where the uploaded jewelry is clearly visible in a styled look.",
};

const subjectCopy: Record<StudioStyle["subject"], string> = {
  auto: "Casting: believable adult model fitting the jewelry; professional campaign look.",
  woman: "Casting: adult woman; elegant fashion/beauty portrayal.",
  man: "Casting: adult man; elegant fashion/portrait portrayal.",
  youth: "Casting: young adult model (18–25); fresh contemporary look.",
  mature: "Casting: mature adult (40s–60s); sophisticated premium feel.",
  couple: "Casting: couple; only the uploaded jewelry pieces are worn — do not invent complementary jewelry.",
  diverse: "Casting: inclusive representation across skin tones; authentic campaign.",
  south_asian: "Casting: South Asian model; natural features and styling.",
  western: "Casting: Western model; contemporary global campaign aesthetic.",
  hands_only: "Casting: hands, wrists, ears, or neck only — no identifiable face.",
  editorial_faceless: "Casting: editorial framing without clear facial identity.",
};

const shotCopy: Record<StudioStyle["shot"], string> = {
  editorial: "High-end editorial portrait with magazine lighting; jewelry identity locked to the reference.",
  lifestyle: "Natural lifestyle portrait with soft daylight; jewelry identity locked to the reference.",
  hands_macro: "Macro beauty shot; jewelry is the hero and must match the reference exactly.",
  catalog: "Clean catalog e-commerce framing, neutral pose, maximum product clarity.",
  side_profile: "Side or three-quarter profile highlighting placement; jewelry must match the reference.",
  full_body: "Full-body fashion framing with jewelry clearly visible and true to the reference.",
  close_up: "Tight beauty close-up on jewelry placement area; prioritize exact jewelry detail.",
  movement:
    "Subtle dynamic energy in pose, hair, or fabric only. Jewelry must remain sharp, undistorted, and identical to the reference — no motion blur on metal or stones.",
};

const framingCopy: Record<Framing, string> = {
  catalog:
    "Clean catalog e-commerce product photo: jewelry centered, sharp, evenly lit, commercial crop.",
  hero: "Luxury hero still: jewelry as the campaign centerpiece; keep metal and stones true to the reference (no invented glow patterns).",
  macro:
    "Macro product detail: close crop on craftsmanship, stones, and metalwork; jewelry fills the frame and matches the reference exactly.",
  lifestyle_still:
    "Lifestyle still life: jewelry arranged on a styled surface with supporting props that never hide or alter the piece.",
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
  luxury: "Luxury campaign: silk, velvet, rich tones, premium finish — wardrobe and set only, not jewelry redesign.",
  festive: "Celebratory festive context; jewelry highlighted tastefully without altering the piece.",
  bridal: "Bridal styling; traditional-meets-modern elegance — wardrobe and set only.",
  everyday: "Everyday wearable styling; approachable and relatable.",
  vintage: "Vintage-inspired wardrobe and set tones — do not restyle the jewelry itself into a different vintage design.",
  minimalist_luxe: "Minimalist luxe wardrobe and set: clean lines with premium finish — jewelry stays exactly as uploaded.",
};

const backgroundVibeCopy: Record<StudioStyle["vibe"], string> = {
  minimal: "Minimal product styling; uncluttered surface; focus on metal and stones.",
  luxury: "Luxury display: silk, velvet, or rich tones with a premium finish — backdrop only.",
  festive: "Celebratory festive context; jewelry highlighted tastefully without altering the piece.",
  bridal: "Bridal still life; traditional-meets-modern elegance — surface and props only.",
  everyday: "Everyday wearable product styling; approachable and relatable.",
  vintage: "Vintage-inspired still-life surface and props — do not restyle the jewelry design.",
  minimalist_luxe: "Minimalist luxe surface: clean lines with premium finish — jewelry stays exactly as uploaded.",
};

const formatCopy: Record<StudioStyle["format"], string> = {
  square:
    "Compose as a square 1:1 frame. Center the jewelry; leave even margins on all sides.",
  whatsapp:
    "Compose as a square 1:1 WhatsApp Business catalog photo. Jewelry centered, clean, easy to read on a phone.",
  catalog:
    "Compose as a vertical catalog / e-commerce frame (about 4:5). Product-first crop with the jewelry fully visible.",
  instagram_post:
    "Compose as a vertical Instagram feed post (about 4:5). Jewelry is the hero; keep important detail away from edges.",
  instagram_story:
    "Compose as a vertical Instagram Story / WhatsApp Status (9:16). Place jewelry in the safe center; leave extra space top and bottom for Story UI.",
  landscape:
    "Compose as a wide landscape / banner frame (about 3:2). Jewelry prominent, not cropped at the sides.",
};

const finalCheck =
  "Final check: jewelry must match the uploaded product image exactly — same piece, same stones, same metal, same proportions. Not a similar piece. No extra jewelry added.";

export function buildJewelryPrompt(style: StudioStyle): string {
  return [
    jewelryFidelityRules,
    "Only change the model, pose, wardrobe, background, and lighting — never the jewelry identity.",
    "",
    "Task: create one photorealistic photograph of a model wearing this exact jewelry piece from the upload.",
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
    "Output format:",
    formatCopy[style.format],
    "Scene:",
    sceneCopy[style.scene],
    "Mood:",
    vibeCopy[style.vibe],
    "",
    finalCheck,
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
    "Output format:",
    formatCopy[style.format],
    "Scene / background:",
    sceneCopy[style.scene],
    "Mood:",
    backgroundVibeCopy[style.vibe],
    "",
    finalCheck,
  ].join(" ");
}

export type { StudioStyle } from "@/lib/style-options";
