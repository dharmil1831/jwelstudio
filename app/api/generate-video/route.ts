import { getAppSettings } from "@/lib/app-settings";
import { canUseFeature } from "@/lib/entitlements";
import { isVideoGenerationConfigured } from "@/lib/env";
import { generateJewelryVideoWithGemini } from "@/lib/gemini-video";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { storeGenerationVideo } from "@/lib/storage";
import {
  buildVideoPrompt,
  CREDIT_COST_PER_VIDEO,
  generationFormatForAspect,
  parseVideoAspect,
  parseVideoCast,
  parseVideoPreset,
  parseVideoPurpose,
  parseVideoSubject,
  veoPersonGeneration,
  VIDEO_ASPECT_RATIO,
} from "@/lib/video-presets";
import { deductCredits, refundCredits } from "@/lib/users";
import { NextResponse } from "next/server";

export const maxDuration = 300;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { error: "Please log in to generate video." },
      { status: 401 },
    );
  }

  const settings = await getAppSettings();
  if (
    !canUseFeature(user.plan, "videoGeneration") ||
    !settings.featureVideoEnabled
  ) {
    return NextResponse.json(
      {
        error:
          "AI video is available on the Diamond plan. Upgrade on Pricing.",
      },
      { status: 403 },
    );
  }

  if (!isVideoGenerationConfigured()) {
    return NextResponse.json(
      {
        error:
          "Video generation is not configured. Set GEMINI_API_KEY (and optional GEMINI_VIDEO_MODEL).",
      },
      { status: 503 },
    );
  }

  if (user.credits < CREDIT_COST_PER_VIDEO) {
    return NextResponse.json(
      {
        error: `Video needs ${CREDIT_COST_PER_VIDEO} credits. Buy a pack or use image modes.`,
        credits: user.credits,
        cost: CREDIT_COST_PER_VIDEO,
      },
      { status: 402 },
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
  const preset = parseVideoPreset(json.preset);
  const aspect = parseVideoAspect(json.aspect);
  const purpose = parseVideoPurpose(json.purpose);
  const cast = parseVideoCast(json.cast);
  const subject = parseVideoSubject(json.subject);
  const customPrompt = typeof json.customPrompt === "string" ? json.customPrompt.trim().slice(0, 2000) : null;
  const lookPreset =
    typeof json.lookPreset === "string"
      ? json.lookPreset
      : typeof json.look === "string"
        ? json.look
        : "auto";

  if (typeof imageBase64 !== "string" || !imageBase64.length) {
    return NextResponse.json(
      { error: "Missing imageBase64 (base64-encoded jewelry image)" },
      { status: 400 },
    );
  }
  if (imageBase64.length > 6_000_000) {
    return NextResponse.json(
      { error: "Photo is too large. Try a smaller JPG." },
      { status: 413 },
    );
  }
  if (!preset) {
    return NextResponse.json(
      { error: "Choose a valid video motion preset." },
      { status: 400 },
    );
  }

  const prompt = buildVideoPrompt({
    purpose,
    preset,
    aspect,
    cast,
    subject,
    lookPreset,
    customPrompt,
  });

  const deducted = await deductCredits(user.id, CREDIT_COST_PER_VIDEO);
  if (!deducted.ok) {
    return NextResponse.json(
      { error: "Could not deduct credits", credits: deducted.credits },
      { status: 402 },
    );
  }

  try {
    const out = await generateJewelryVideoWithGemini({
      imageBase64,
      mimeType,
      prompt,
      aspectRatio: VIDEO_ASPECT_RATIO[aspect],
      personGeneration: veoPersonGeneration(cast),
    });
    const buffer = Buffer.from(out.videoBase64, "base64");
    const ext = out.mimeType.includes("webm") ? "webm" : "mp4";
    const resultUrl = await storeGenerationVideo(user.id, buffer, ext);

    const row = await prisma.generation.create({
      data: {
        userId: user.id,
        mode: "video",
        format: generationFormatForAspect(aspect),
        placement: cast,
        subject: cast === "model" ? subject : "auto",
        shot: preset,
        scene: purpose,
        vibe: aspect,
        sourceMime: mimeType,
        resultUrl,
        provider: "gemini",
        status: "succeeded",
      },
    });

    return NextResponse.json({
      resultUrl,
      generationId: row.id,
      mimeType: out.mimeType,
      credits: deducted.credits,
      cost: CREDIT_COST_PER_VIDEO,
      preset,
      purpose,
      aspect,
      cast,
      subject: cast === "model" ? subject : undefined,
    });
  } catch (e) {
    const credits = await refundCredits(user.id, CREDIT_COST_PER_VIDEO);
    const raw = e instanceof Error ? e.message : "Video generation failed";
    const error =
      /timeout|timed out|deadline|FUNCTION_INVOCATION_TIMEOUT/i.test(raw)
        ? "Video took too long. Please try again with a smaller photo."
        : raw;
    return NextResponse.json({ error, credits }, { status: 502 });
  }
}
