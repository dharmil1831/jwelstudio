import type { Framing, StudioStyle } from "@/lib/style-options";
import { buildBrandPromptLines, type BrandOptions } from "@/lib/brand-options";
import {
  parseLookPreset,
  resolvedLookImageLine,
} from "@/lib/look-presets";

const jewelryFidelityRules = [
  "CRITICAL JEWELRY FIDELITY RULES (must obey — highest priority):",
  "The uploaded image is the ONLY product reference. The jewelry in the output must be a pixel-faithful recreation of that exact piece.",
  "Preserve exact design silhouette, metal color/temperature, polish vs matte finish, gemstone count, shapes, colors, cuts, settings, bezels, prongs, engravings, clasp/backing, chain/link pattern, proportions, and relative sizes.",
  "PROPORTIONS LOCK: Never stretch, squash, elongate, widen, warp, or perspective-distort the jewelry. Keep the same aspect ratio and relative dimensions as the upload — if the canvas is taller/wider, zoom out or add background margin; do not reshape the product to fill the frame.",
  "Do NOT redesign, restyle, simplify, embellish, swap stones, change metal, add extra sparkle, change stone hue, or invent new jewelry.",
  "Do NOT invent matching earrings, rings, bracelets, or set pieces that are not clearly present in the uploaded reference. Show only what is in the reference photo.",
  "COMPLETE PIECE: Show every part of the jewelry that is visible in the upload — top, middle, and bottom, including long hanging rows, side pieces, earrings beside a necklace, and the lower pendant. Do not stop at the upper or first section. Do not leave a detached fragment, hook, or partial piece floating away from the product.",
  "SINGLE FRAME: Output exactly ONE product photograph — never a collage, contact sheet, split panel, before/after, or stacked duplicate. If the upload already shows two copies of the same set or a multi-panel catalog layout, keep only the clearest single product arrangement once. A necklace with matching earrings in one arrangement is fine; repeating that set twice in the same frame is not.",
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
  auto: "Casting: believable adult model fitting the jewelry; professional campaign look. Wardrobe should suit the selected mood (bridal/festive/luxury → formal or traditional; everyday → contemporary).",
  woman: "Casting: adult woman; elegant fashion/beauty portrayal with wardrobe that matches the selected mood.",
  man: "Casting: adult man; elegant fashion/portrait portrayal — formalwear or cultural formal attire when mood is luxury/bridal/festive.",
  youth: "Casting: young adult model (18–25); fresh contemporary look; stylish wardrobe that does not hide the jewelry.",
  mature: "Casting: mature adult (40s–60s); sophisticated premium feel; refined formal or cultural attire when mood is luxury/bridal.",
  couple: "Casting: couple; coordinated formal or wedding-appropriate attire; only the uploaded jewelry pieces are worn — do not invent complementary jewelry.",
  diverse: "Casting: inclusive representation across skin tones; authentic campaign; attire matches selected mood.",
  south_asian:
    "Casting: South Asian adult model with natural features. Wardrobe: for bridal/festive/luxury moods use traditional or fusion South Asian formalwear (saree, lehenga, sherwani, or elegant ethnic formal) — not plain Western casual unless mood is everyday.",
  north_indian:
    "Casting: North Indian adult model. Wardrobe: bridal/festive/luxury → lehenga, saree, anarkali, or sherwani as fits gender; everyday → polished contemporary Indian fashion. Jewelry stays exact to upload.",
  south_indian:
    "Casting: South Indian adult model. Wardrobe: bridal/festive/luxury → Kanjeevaram / silk saree, traditional South Indian bridal or groom attire as fits; everyday → contemporary South Indian fashion.",
  east_indian:
    "Casting: East Indian adult model. Wardrobe: bridal/festive/luxury → traditional East Indian / Bengali bridal or formal ethnic attire as fits; everyday → contemporary regional fashion.",
  west_indian:
    "Casting: West Indian / Gujarati-Maharashtrian adult model. Wardrobe: bridal/festive/luxury → Gujarati or Maharashtrian bridal / festive ethnic attire (e.g. red/bridal saree or lehenga, or groom sherwani) as fits; everyday → contemporary West Indian fashion.",
  korean: "Casting: Korean adult model; contemporary East Asian beauty aesthetic; refined modern formal or hanbok-inspired formal only if mood is festive/bridal, otherwise contemporary Korean fashion.",
  chinese: "Casting: Chinese adult model; contemporary East Asian beauty aesthetic; refined modern formal or traditional Chinese formalwear if mood is festive/bridal.",
  british: "Casting: British adult model; refined UK campaign aesthetic; tailored formal or eveningwear for luxury moods.",
  european: "Casting: European adult model; contemporary European fashion campaign look; elegant formalwear for luxury moods.",
  african: "Casting: African / African-diaspora adult model; authentic campaign representation; rich formal or cultural formal attire for festive/luxury moods.",
  arabian:
    "Casting: Arabian / Middle Eastern adult model with natural regional features. Wardrobe REQUIRED: for bridal, festive, luxury, or wedding moods dress in traditional Middle Eastern formal attire — e.g. elegant abaya, embroidered kaftan, jalabiya, or thobe / bisht as fits the model — with tasteful modest or formal regional styling. Do NOT default to generic Western cocktail dress or plain modern casual. Everyday mood may use contemporary Gulf fashion still regionally appropriate. Jewelry remains ONLY what is in the upload.",
  western: "Casting: Western model; contemporary global campaign aesthetic; evening gown or tailored formal for luxury moods.",
  hands_only: "Casting: hands, wrists, ears, or neck only — no identifiable face.",
  editorial_faceless: "Casting: editorial framing without clear facial identity; wardrobe still matches regional casting if specified via mood.",
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
    "Clean catalog e-commerce product photo: jewelry centered, sharp, evenly lit. Show the complete piece; do not use a tight commercial crop that cuts off the lower half or side pieces.",
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
  beach: "Beach setting: soft sand, sea breeze light, coastal bokeh — jewelry stays sharp and true to reference.",
  day_outdoor: "Bright daytime outdoor setting with clean natural daylight.",
  night_city: "Night city ambiance with soft bokeh lights; jewelry remains the sharp hero.",
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
    "Output frame: square 1:1. Fit the full jewelry in frame with even margins. Do NOT crop, stretch, or cut off any part of the jewelry — zoom out or add margin instead of clipping or warping the product.",
  whatsapp:
    "Output frame: square 1:1 (target 1080×1080). Center the full jewelry piece without stretching it. Do NOT crop or cut the jewelry — the entire product from the upload must stay fully visible. Do not add Instagram/WhatsApp UI chrome. Brand text/logo only if brand overlay instructions request them.",
  whatsapp_status:
    "Output frame: vertical 9:16 (target 1080×1920). Keep the entire jewelry piece fully visible in the safe center without stretching; leave empty margin top and bottom. Never crop or clip the jewelry edges. Do not add Instagram/WhatsApp UI chrome. Brand text/logo only if brand overlay instructions request them.",
  catalog:
    "Output frame: vertical catalog ~4:5. Product-first; entire jewelry fully visible — no cropping or stretching the piece.",
  instagram_post:
    "Output frame: vertical 4:5 (target 1080×1350). Jewelry is the hero and must remain fully visible with safe margins — never stretch to fill. Do NOT crop or cut any part of the jewelry — adjust camera distance instead. Do not add Instagram/WhatsApp UI chrome. Brand text/logo only if brand overlay instructions request them.",
  instagram_story:
    "Output frame: vertical 9:16 (target 1080×1920). Place jewelry in the safe center without stretching; leave margin top and bottom. The complete jewelry piece must stay fully visible — never crop or clip it. Do not add Instagram/WhatsApp UI chrome. Brand text/logo only if brand overlay instructions request them.",
  landscape:
    "Output frame: wide landscape 16:9 (target ~1211×681). Jewelry fully visible without stretching; do not crop sides of the product. Brand text/logo only if brand overlay instructions request them.",
  facebook_post:
    "Output frame: wide landscape about 1.9:1 (target 1200×630) for a Facebook post. Keep the entire jewelry piece fully visible with side margin. Do not add social UI chrome.",
  pinterest:
    "Output frame: tall pin about 2:3 (target 1000×1500). Jewelry stays fully visible in the safe center with margin above and below. Do not add social UI chrome.",
  x_landscape:
    "Output frame: wide landscape 16:9 (target 1200×675) for an X feed card. Jewelry fully visible without stretching. Do not add social UI chrome.",
  line:
    "Output frame: square 1:1 (target 1040×1040). Center the full jewelry piece with even margins. Do not add social UI chrome.",
};

const polishedSkinRule =
  "SKIN FINISH: Use polished, editorial beauty skin — even, refined, campaign-retouched look that flatters metal and gemstone highlights. Avoid raw, blotchy, overly textured, or documentary skin that steals attention from the jewelry. Keep anatomy natural and believable.";

const noCropRule =
  "FRAMING RULE: The selected output format sets the canvas aspect ratio only. Never cut, crop, clip, stretch, squash, or hide any part of the uploaded jewelry. Show the complete piece with correct proportions exactly as in the reference; use empty space / background / camera distance to fill the format — never reshape the product.";

const modelShotRules = [
  "WORN JEWELRY — THIS OVERRIDES THE PRODUCT PHOTO LAYOUT:",
  "The upload is a flat catalog photo. Long ends are often stood up for display. Do not copy that pose, that outline, or that tall shape.",
  "Wear the design once. A necklace closes at the neck and lies on the chest. Side chains and long panels hang down and stay inside the width of the body.",
  "The highest gold is at the neck. No gold above the head. No tall bars beside the face.",
  "Do not paste, overlay, or enlarge the catalog photo in front of the model. Do not show a second copy of the necklace.",
  "Scale: about the width of the chest, smaller than the torso.",
  "Keep the same motifs, metal color, stones, and strand design. Do not invent extra jewelry.",
].join(" ");

const modelFinalCheck =
  "Final check: one model, the jewelry worn once, same motifs and metal as the upload. Reject a second enlarged copy, a floating catalog layout, and any gold standing above the head.";

const fullViewRules = [
  "FULL VIEW:",
  "If the user asks for a full view, the whole model, or head to toe — including Hindi or Hinglish such as full view, poora model, or sir se pair — the photo includes the top of the head, both feet, and a little floor.",
  "Do not crop at the chest, waist, hips, or knees. On a square canvas, make the model smaller so the whole body still fits.",
  "A burkha, niqab, or abaya is a full-length garment to the feet, with the face covered the way that garment is worn. The jewelry stays visible on the chest at natural size.",
].join(" ");

const finalCheck =
  "Final check: jewelry must match the uploaded product image exactly — same piece, same stones, same metal, same proportions (no stretch/warp). Not a similar piece. No extra jewelry added. Exactly one product arrangement in the frame — no duplicated sets or collage panels.";

function lookLineForStyle(style: StudioStyle): string | null {
  const look = parseLookPreset(style.lookPreset ?? "auto");
  return resolvedLookImageLine({
    look,
    scene: style.scene,
    vibe: style.vibe,
    shot: style.shot,
    subject: style.subject,
    placement: style.placement,
  });
}

export function buildJewelryPrompt(style: StudioStyle): string {
  const lookLine = lookLineForStyle(style);
  const couple =
    parseLookPreset(style.lookPreset ?? "auto") === "couple_wedding" ||
    style.subject === "couple";

  if (style.customPrompt) {
    return [
      modelShotRules,
      "",
      "Task: one photorealistic photograph of an adult model wearing that jewelry in the scene the user describes.",
      polishedSkinRule,
      "Anatomy correct. Adult model only.",
      "",
      "The user direction decides casting, clothing, pose, framing, and background, including Hindi or mixed Hindi and English.",
      "If they name a garment, the model wears that garment — for example a burkha, abaya, saree, or lehenga. Do not replace it with a bridal, western, or campaign outfit.",
      "Do not switch this into a product-only shot and do not omit the model when the user asked for one.",
      "",
      "User creative direction:",
      style.customPrompt,
      "",
      fullViewRules,
      "Output format (canvas shape only):",
      formatCopy[style.format],
      "",
      modelShotRules,
      modelFinalCheck,
    ]
      .filter(Boolean)
      .join(" ");
  }

  return [
    modelShotRules,
    "",
    couple
      ? "Task: one photorealistic photograph of a bride and a groom together. Both people are in the frame. Not a solo portrait."
      : "Task: one photorealistic photograph of a model wearing this jewelry.",
    polishedSkinRule,
    "",
    "Jewelry placement:",
    placementCopy[style.placement],
    "",
    "Model / casting:",
    couple
      ? "Casting: exactly two adults, a bride and a groom, both visible. Coordinated wedding clothes. Wear the uploaded jewelry once on the person it fits. Do not add jewelry that is not in the upload."
      : subjectCopy[style.subject],
    lookLine,
    "",
    "Shot & camera:",
    shotCopy[style.shot],
    "Output format (canvas shape only):",
    formatCopy[style.format],
    "Scene:",
    sceneCopy[style.scene],
    "Mood:",
    vibeCopy[style.vibe],
    "",
    modelShotRules,
    couple
      ? "Final check: exactly two adults, bride and groom, both in the frame. Reject a photo of only one lady or only one man. Jewelry worn once, same motifs and metal as the upload. No second invented jewelry set."
      : modelFinalCheck,
  ]
    .filter(Boolean)
    .join(" ");
}

function jewelryShadowLine(
  shadow: StudioStyle["jewelryShadow"],
): string | null {
  switch (shadow) {
    case "off":
      return "Shadow: no cast shadow under or beside the jewelry — flat, even lighting for a clean e-commerce cutout look.";
    case "hard":
    case "floating":
    case "soft":
    default:
      return "Shadow: do not paint a cast shadow, floor shadow, contact shadow, or reflection. Keep the backdrop clean and even behind the jewelry.";
  }
}

export function buildBackgroundPrompt(style: StudioStyle): string {
  const shadowLine = jewelryShadowLine(style.jewelryShadow);

  if (style.customPrompt) {
    return [
      jewelryFidelityRules,
      "Only change the backdrop, surface, lighting, and camera — never the jewelry identity.",
      "",
      "Task: create one photorealistic product photograph of this exact jewelry piece on a styled background.",
      "No model, no person, no hands, no body, no mannequin, no neck form.",
      "The jewelry must remain the hero subject, sharp and true to the reference.",
      "",
      "User creative direction (follow unless it conflicts with jewelry fidelity):",
      style.customPrompt,
      style.backdropColor
        ? `Backdrop color: use a clean, even solid fill of exact hex ${style.backdropColor} as the main background color behind the jewelry.`
        : null,
      shadowLine,
      "",
      noCropRule,
      "Output format:",
      formatCopy[style.format],
      "",
      finalCheck,
    ]
      .filter(Boolean)
      .join(" ");
  }

  const colorLine = style.backdropColor
    ? `Backdrop color: use a clean, even solid fill of exact hex ${style.backdropColor} as the main background color behind the jewelry. Soft lighting that flatters metal and stones.`
    : "Backdrop: use the scene / setting mood below — do not force a flat solid white unless the scene is studio white.";

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
    noCropRule,
    "Output format:",
    formatCopy[style.format],
    "Scene / setting:",
    sceneCopy[style.scene],
    colorLine,
    shadowLine,
    "Mood:",
    backgroundVibeCopy[style.vibe],
    "",
    finalCheck,
  ]
    .filter(Boolean)
    .join(" ");
}

export function subjectPromptLine(subject: StudioStyle["subject"]): string {
  return subjectCopy[subject] ?? subjectCopy.auto;
}

export function withBrandPrompt(
  basePrompt: string,
  brand: BrandOptions | null | undefined,
): string {
  if (!brand) return basePrompt;
  const lines = buildBrandPromptLines(brand);
  if (!lines) return basePrompt;
  // Brand block last so it overrides earlier “clean photo” framing defaults.
  return `${basePrompt}\n\n${lines}`;
}

/** Append selfie / own-model try-on instructions (Platinum+). */
export function withSelfieTryOnPrompt(basePrompt: string): string {
  return [
    basePrompt,
    "",
    "SELFIE / OWN-MODEL TRY-ON:",
    "A labeled selfie/reference image shows the real person who must wear the jewelry.",
    "Preserve that person's facial identity, skin tone, hair, and body proportions closely.",
    "Ignore casting / model-type chips — the selfie person is the model.",
    "Place the EXACT jewelry from the jewelry product image on this person at the requested placement.",
    "Do not invent a different face or a different jewelry piece.",
    polishedSkinRule,
  ].join(" ");
}

/** Primary prompt when swapping new jewelry onto a saved theme look. */
export function buildThemeSwapPrompt(style: StudioStyle): string {
  return [
    jewelryFidelityRules,
    "",
    "TASK: Keep the saved look. Replace the jewelry.",
    "The first photo is a STYLE REFERENCE. Copy only the person, face, hair, pose, wardrobe, lighting, background, and framing.",
    "Jewelry in that reference photo is the OLD piece. Remove it completely. Do not keep its design, metal color, stone count, stone color, or shape.",
    "The LAST photo is the new jewelry and the only jewelry allowed in the result. Wear that exact design, naturally:",
    placementCopy[style.placement],
    "If the new photo shows only a necklace, remove earrings from the saved look. If it shows only earrings, remove the necklace. If it shows a set, wear that set once and nothing else.",
    "Do not invent a matching set from the old look. Do not blend the old jewelry with the new piece.",
    "When the two photos disagree, the last photo wins for every metal and stone. The first photo wins only for the person, clothes, and scene.",
    modelShotRules,
    polishedSkinRule,
    "Output format (canvas shape only):",
    formatCopy[style.format],
    "",
    jewelryFidelityRules,
    finalCheck,
  ].join(" ");
}

/**
 * Batch: later SKUs must reuse the first result's backdrop exactly.
 * Jewelry still comes only from the new product upload.
 */
export function withSharedBackgroundLockPrompt(basePrompt: string): string {
  return [
    basePrompt,
    "",
    "SHARED BACKGROUND LOCK (batch catalog):",
    "A labeled BACKGROUND LOCK image is the master photo for this set.",
    "Copy ONLY that image's empty background: same surface, color, texture, lighting direction, and softness.",
    "Do not invent a new scene, table, color, or lighting setup.",
    "Do not copy the lock image's jewelry, and do not copy its crop. If matching that photo's camera distance would cut off the new piece, zoom out and add margin.",
    "Place the FULL new jewelry product into that background as ONE arrangement only — never duplicate the set or recreate a collage from the lock image.",
    "Show every part visible in the new upload from top to bottom, including dangling rows, side earrings, and the lower pendant.",
    "Do not keep only the upper or first section. Do not leave a stray fragment, clasp, or partial piece floating above or beside the jewelry.",
    "Cast shadow should match the lock image's shadow style, under the complete piece.",
    "If any earlier scene, mood, scale, or crop line conflicts with showing the full new jewelry, the full jewelry wins. The lock image wins only for the empty background.",
  ].join(" ");
}

/** When a saved theme preview is used as style reference. */
export function withThemeReferencePrompt(basePrompt: string): string {
  return [
    basePrompt,
    "",
    "STYLE REFERENCE IMAGE (labeled):",
    "Match that look's composition, lighting, and mood closely.",
    "Ignore the jewelry in the style reference. The last product photo is the only jewelry allowed.",
  ].join(" ");
}

export type { StudioStyle } from "@/lib/style-options";
