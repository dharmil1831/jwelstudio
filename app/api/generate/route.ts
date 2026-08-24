import { isGenerationConfigured } from "@/lib/env";
import { generateJewelryImage } from "@/lib/generate-image";
import { buildBackgroundPrompt, buildJewelryPrompt } from "@/lib/prompts";
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
}) {
  try {
    await prisma.generation.create({
      data: { ...data, status: "succeeded" },
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    if (!/Unknown argument `(mode|format)`/.test(message)) throw e;

    const { mode, format, ...rest } = data;
    const row = await prisma.generation.create({
      data: { ...rest, status: "succeeded" },
    });
    await prisma.$executeRaw`
      UPDATE "Generation"
      SET "mode" = ${mode}, "format" = ${format}
      WHERE id = ${row.id}
    `;
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
  const prompt =
    style.mode === "background"
      ? buildBackgroundPrompt(style)
      : buildJewelryPrompt(style);

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
    });
    const buffer = Buffer.from(out.imageBase64, "base64");
    const resultUrl = await storeGenerationImage(user.id, buffer, "png");

    await persistGeneration({
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
    });

    return NextResponse.json({
      resultUrl,
      mimeType: out.mimeType,
      credits: deducted.credits,
      provider: out.provider,
      attemptedProviders: out.attempted,
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
