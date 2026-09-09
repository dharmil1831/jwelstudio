import { isGenerationConfigured } from "@/lib/env";
import { canUseFeature } from "@/lib/entitlements";
import {
  brandHasContent,
  parseBrandOptions,
} from "@/lib/brand-options";
import { getAppSettings } from "@/lib/app-settings";
import { generateJewelryImage } from "@/lib/generate-image";
import {
  buildBackgroundPrompt,
  buildJewelryPrompt,
  buildThemeSwapPrompt,
  withBrandPrompt,
  withSelfieTryOnPrompt,
  withThemeReferencePrompt,
} from "@/lib/prompts";
import { getSessionUser } from "@/lib/session";
import { parseStudioStyle } from "@/lib/style-options";
import { storeGenerationImage, extensionForMime } from "@/lib/storage";
import { fetchThemePreviewAsExtra } from "@/lib/theme-preview";
import type { GeminiExtraImage } from "@/lib/gemini";
import {
  CREDIT_COST_PER_GENERATION,
  deductCredits,
  refundCredits,
} from "@/lib/users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function parseExtraImage(
  json: Record<string, unknown>,
  b64Key: string,
  mimeKey: string,
  maxLen = 6_000_000,
): { data: string; mimeType: string } | null {
  const data = json[b64Key];
  if (typeof data !== "string" || !data.length) return null;
  if (data.length > maxLen) return null;
  const mime =
    typeof json[mimeKey] === "string" && json[mimeKey]
      ? String(json[mimeKey])
      : "image/jpeg";
  if (!/^image\/(jpeg|jpg|png|webp)$/i.test(mime)) return null;
  return { data, mimeType: mime };
}

export const maxDuration = 60;

async function persistGeneration(data: {
  userId: string;
  mode: string;
  format: string;
  placement: string;
  subject: string;
  shot: string;
  scene: string;
  vibe: string;
  sourceMime: string;
  resultUrl: string;
  provider?: string;
}): Promise<string> {
  try {
    const row = await prisma.generation.create({
      data: { ...data, status: "succeeded" },
    });
    return row.id;
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (!/Unknown argument `(mode|format|provider|shareEnabled)`/.test(message)) {
      throw e;
    }

    const { mode, format, provider: _provider, ...rest } = data;
    const row = await prisma.generation.create({
      data: { ...rest, status: "succeeded" },
    });
    await prisma.$executeRaw`
      UPDATE "Generation"
      SET "mode" = ${mode}, "format" = ${format}
      WHERE id = ${row.id}
    `;
    return row.id;
  }
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to generate images." },
      { status: 401 },
    );
  }

  if (user.credits < CREDIT_COST_PER_GENERATION) {
    return NextResponse.json(
      {
        error: "No credits left. Buy a credit pack to continue.",
        credits: user.credits,
      },
      { status: 402 },
    );
  }

  if (!isGenerationConfigured()) {
    return NextResponse.json(
      {
        error:
          "Server is missing image generation keys. Set OPENAI_API_KEY and/or GEMINI_API_KEY.",
      },
      { status: 503 },
    );
  }

  let json: Record<string, unknown>;
  try {
    json = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const imageBase64 = json.imageBase64;
  const mimeType =
    typeof json.mimeType === "string" ? json.mimeType : "image/jpeg";

  if (typeof imageBase64 !== "string" || !imageBase64.length) {
    return NextResponse.json(
      { error: "Missing imageBase64 (base64-encoded image)" },
      { status: 400 },
    );
  }

  if (imageBase64.length > 6_000_000) {
    return NextResponse.json(
      {
        error:
          "Photo is too large. Please try a smaller JPG, or crop closer to the jewelry.",
      },
      { status: 413 },
    );
  }

  const style = parseStudioStyle(json);
  const brand = parseBrandOptions(json);
  const settings = await getAppSettings();

  if (style.customPrompt && !canUseFeature(user.plan, "customPrompt")) {
    return NextResponse.json(
      {
        error:
          "Custom prompt is available on Gold, Platinum, and Diamond plans. Upgrade on Pricing.",
      },
      { status: 403 },
    );
  }

  if (
    brandHasContent(brand) &&
    (!canUseFeature(user.plan, "brandOverlay") || !settings.featureBrandEnabled)
  ) {
    return NextResponse.json(
      {
        error:
          "Brand / festival options are available on Gold, Platinum, and Diamond plans.",
      },
      { status: 403 },
    );
  }

  const selfie = parseExtraImage(json, "selfieBase64", "selfieMimeType");
  if (selfie) {
    if (
      style.mode !== "model" ||
      !canUseFeature(user.plan, "selfieTryOn") ||
      !settings.featureSelfieEnabled
    ) {
      return NextResponse.json(
        {
          error:
            "Selfie / own-model try-on is available on Platinum and Diamond (Model shot only).",
        },
        { status: 403 },
      );
    }
  }

  const themeId =
    typeof json.themeId === "string" ? json.themeId.trim().slice(0, 64) : "";

  const themeRef =
    themeId && canUseFeature(user.plan, "themes")
      ? await fetchThemePreviewAsExtra(user.id, themeId)
      : null;

  let prompt: string;
  if (themeRef && style.mode === "model") {
    prompt = buildThemeSwapPrompt(style);
    if (style.customPrompt) {
      prompt = [
        prompt,
        "",
        "User creative direction (only if it does not break jewelry fidelity or the theme look):",
        style.customPrompt,
      ].join(" ");
    }
  } else {
    prompt =
      style.mode === "background"
        ? buildBackgroundPrompt(style)
        : buildJewelryPrompt(style);
  }
  prompt = withBrandPrompt(prompt, brandHasContent(brand) ? brand : null);
  if (selfie) {
    prompt = withSelfieTryOnPrompt(prompt);
  }
  if (themeRef && style.mode !== "model") {
    prompt = withThemeReferencePrompt(prompt);
  }

  const extraImages: GeminiExtraImage[] = [];
  if (themeRef) {
    extraImages.push({
      data: themeRef.data,
      mimeType: themeRef.mimeType,
      label:
        "IMAGE — STYLE REFERENCE (previous generation). Match pose, model, wardrobe, lighting, background. Do NOT copy jewelry from this image:",
    });
  }
  if (selfie) {
    extraImages.push({
      data: selfie.data,
      mimeType: selfie.mimeType,
      label:
        "IMAGE — SELFIE / OWN MODEL (this is the real person to portray; preserve their face identity):",
    });
  }
  if (brand.logoBase64 && brand.logoMimeType) {
    extraImages.push({
      data: brand.logoBase64,
      mimeType: brand.logoMimeType,
      label:
        "IMAGE — BRAND LOGO (REQUIRED overlay when watermark/logo is enabled — place per logo-placement instructions; do not redesign jewelry):",
    });
  }

  const deducted = await deductCredits(user.id, CREDIT_COST_PER_GENERATION);
  if (!deducted.ok) {
    return NextResponse.json(
      { error: "Could not deduct credits", credits: deducted.credits },
      { status: 402 },
    );
  }

  try {
    const out = await generateJewelryImage({
      imageBase64,
      mimeType,
      prompt,
      format: style.format,
      extraImages: extraImages.length ? extraImages : undefined,
    });
    const buffer = Buffer.from(out.imageBase64, "base64");
    const resultUrl = await storeGenerationImage(
      user.id,
      buffer,
      extensionForMime(out.mimeType),
    );

    const generationId = await persistGeneration({
      userId: user.id,
      mode: style.mode,
      format: style.format,
      placement: style.placement,
      subject: style.subject,
      shot: style.mode === "background" ? style.framing : style.shot,
      scene: style.scene,
      vibe: style.vibe,
      sourceMime: mimeType,
      resultUrl,
      provider: out.provider,
    });

    return NextResponse.json({
      resultUrl,
      generationId,
      mimeType: out.mimeType,
      credits: deducted.credits,
      provider: out.provider,
      attemptedProviders: out.attempted,
      themeUsed: Boolean(themeRef),
      themeWarning:
        themeId && !themeRef
          ? "Theme was selected but its preview image could not be loaded. Generate used style chips only."
          : undefined,
    });
  } catch (e) {
    const credits = await refundCredits(user.id, CREDIT_COST_PER_GENERATION);
    const raw = e instanceof Error ? e.message : "Generation failed";
    const error =
      /timeout|timed out|deadline|FUNCTION_INVOCATION_TIMEOUT/i.test(raw)
        ? "Generation took too long. Please try again with a smaller photo."
        : raw;
    return NextResponse.json({ error, credits }, { status: 502 });
  }
}
