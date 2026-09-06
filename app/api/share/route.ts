import { getAppSettings } from "@/lib/app-settings";
import { appBaseUrl } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/** Enable public share for a generation owned by the current user. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const settings = await getAppSettings();
  if (!settings.featurePublicShareEnabled) {
    return NextResponse.json(
      { error: "Public sharing is temporarily disabled." },
      { status: 503 },
    );
  }

  let body: { generationId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const generationId = body.generationId?.trim();
  if (!generationId) {
    return NextResponse.json({ error: "generationId is required" }, { status: 400 });
  }

  const row = await prisma.generation.findFirst({
    where: { id: generationId, userId: user.id, status: "succeeded" },
  });
  if (!row) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  if (!row.shareEnabled) {
    await prisma.generation.update({
      where: { id: row.id },
      data: { shareEnabled: true },
    });
  }

  const shareUrl = `${appBaseUrl()}/s/${row.id}`;
  return NextResponse.json({
    ok: true,
    shareUrl,
    generationId: row.id,
    resultUrl: row.resultUrl,
  });
}

/** Revoke public share (owner). */
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  let body: { generationId?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const generationId = body.generationId?.trim();
  if (!generationId) {
    return NextResponse.json({ error: "generationId is required" }, { status: 400 });
  }

  const row = await prisma.generation.findFirst({
    where: { id: generationId, userId: user.id },
  });
  if (!row) {
    return NextResponse.json({ error: "Generation not found" }, { status: 404 });
  }

  await prisma.generation.update({
    where: { id: row.id },
    data: { shareEnabled: false },
  });

  return NextResponse.json({ ok: true });
}
