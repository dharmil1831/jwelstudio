import { getAppSettings } from "@/lib/app-settings";
import { canUseFeature } from "@/lib/entitlements";
import { isVideoGenerationConfigured } from "@/lib/env";
import { generateJewelryWithGemini } from "@/lib/gemini";
import { generateJewelryVideoWithGemini } from "@/lib/gemini-video";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { storeGenerationVideo } from "@/lib/storage";
import {
  buildVideoModelStillPrompt,
  buildVideoPrompt,
  VIDEO_JEWELRY_LOCK,
  CREDIT_COST_PER_VIDEO,
  generationFormatForAspect,
  parseVideoAspect,
  parseVideoCast,
  parseVideoPreset,
  parseVideoPurpose,
  parseVideoSubject,
  veoPersonGeneration,
  VIDEO_ASPECT_RATIO,
  videoNegativePrompt,
} from "@/lib/video-presets";
import { deductCredits, refundCredits } from "@/lib/users";
import { toUserFacingError } from "@/lib/user-facing-error";
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
      { error: "Could not prepare this photo. Please try again." },
      { status: 413 },
    );
  }
  if (!preset) {
    return NextResponse.json(
      { error: "Choose a valid video motion preset." },
      { status: 400 },
    );
  }

  const wantsWornFrame = cast === "model" && purpose !== "reveal";
  const prompt = buildVideoPrompt({
    purpose,
    preset,
    aspect,
    cast,
    subject,
    lookPreset,
    customPrompt,
    lockedFrame: wantsWornFrame,
  });

  const deducted = await deductCredits(user.id, CREDIT_COST_PER_VIDEO);
  if (!deducted.ok) {
    return NextResponse.json(
      { error: "Could not deduct credits", credits: deducted.credits },
      { status: 402 },
    );
  }


  try {
    // Jewelry USP: a model video must not start from the catalog photo.
    // That first glimpse is what gets redrawn, and the pendant changes.
    // The worn still is the only picture sent to video. Do not revert this.
    let videoImage = imageBase64;
    let videoMime = mimeType;
    if (wantsWornFrame) {
      const still = await generateJewelryWithGemini(
        imageBase64,
        mimeType,
        buildVideoModelStillPrompt({ purpose, aspect, subject, lookPreset }),
        aspect === "horizontal" ? "landscape" : "instagram_story",
        undefined,
        true,
        VIDEO_ASPECT_RATIO[aspect],
        { imageSize: "2K", timeoutMs: 80_000 },
      );
      videoImage = still.imageBase64;
      videoMime = still.mimeType;
    }
    const out = await generateJewelryVideoWithGemini({
      imageBase64: videoImage,
      mimeType: videoMime,
      prompt,
      aspectRatio: VIDEO_ASPECT_RATIO[aspect],
      personGeneration: veoPersonGeneration(cast),
      negativePrompt: videoNegativePrompt(purpose, cast),
      cast,
      openingText: wantsWornFrame
        ? `${VIDEO_JEWELRY_LOCK} This picture is already finished. Do not replace it with a catalog photo. Do not change the pendant.`
        : undefined,
      deadlineMs: wantsWornFrame ? 190_000 : undefined,
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
    console.error("[generate-video]", e instanceof Error ? e.message : e);
    const error = toUserFacingError(
      e,
      "Could not generate right now. Please try again in a moment.",
    );
    return NextResponse.json({ error, credits }, { status: 502 });
  }
}
