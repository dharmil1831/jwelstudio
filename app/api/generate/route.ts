import { isOpenAIConfigured } from "@/lib/env";
import { generateJewelryModelShot } from "@/lib/openai";
import { buildJewelryPrompt } from "@/lib/prompts";
import { getSessionUser } from "@/lib/session";
import { parseStudioStyle } from "@/lib/style-options";
import { storeGenerationImage } from "@/lib/storage";
import {
  CREDIT_COST_PER_GENERATION,
  deductCredits,
  refundCredits,
} from "@/lib/users";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const maxDuration = 120;

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

  if (!isOpenAIConfigured()) {
    return NextResponse.json(
      { error: "Server is missing OPENAI_API_KEY." },
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

  const style = parseStudioStyle(json);
  const prompt = buildJewelryPrompt(style);

  const deducted = await deductCredits(user.id, CREDIT_COST_PER_GENERATION);
  if (!deducted.ok) {
    return NextResponse.json(
      { error: "Could not deduct credits", credits: deducted.credits },
      { status: 402 },
    );
  }

  try {
    const out = await generateJewelryModelShot(imageBase64, mimeType, prompt);
    const buffer = Buffer.from(out.imageBase64, "base64");
    const resultUrl = await storeGenerationImage(user.id, buffer, "png");

    await prisma.generation.create({
      data: {
        userId: user.id,
        placement: style.placement,
        subject: style.subject,
        shot: style.shot,
        scene: style.scene,
        vibe: style.vibe,
        sourceMime: mimeType,
        resultUrl,
        status: "succeeded",
      },
    });

    return NextResponse.json({
      resultUrl,
      mimeType: out.mimeType,
      credits: deducted.credits,
      provider: "openai",
    });
  } catch (e) {
    const credits = await refundCredits(user.id, CREDIT_COST_PER_GENERATION);
    return NextResponse.json(
      {
        error: e instanceof Error ? e.message : "Generation failed",
        credits,
      },
      { status: 502 },
    );
  }
}
