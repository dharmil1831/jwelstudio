import { requireAdminUser } from "@/lib/admin";
import {
  cleanTemplateDescription,
  copyGenerationToTemplateStorage,
  isTemplateCategory,
} from "@/lib/model-templates";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function adminAuthError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Forbidden";
  return NextResponse.json(
    { error: msg === "UNAUTHORIZED" ? "Please log in as admin." : "Forbidden" },
    { status: msg === "UNAUTHORIZED" ? 401 : 403 },
  );
}

/** Templates plus recent model shots that can become templates. */
export async function GET() {
  try {
    await requireAdminUser();
  } catch (e) {
    return adminAuthError(e);
  }

  const [templates, generations] = await Promise.all([
    prisma.modelTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    }),
    prisma.generation.findMany({
      where: { mode: "model", status: "succeeded" },
      orderBy: { createdAt: "desc" },
      take: 60,
      select: {
        id: true,
        resultUrl: true,
        thumbUrl: true,
        subject: true,
        scene: true,
        createdAt: true,
        user: { select: { email: true } },
      },
    }),
  ]);

  return NextResponse.json({
    templates,
    generations: generations.map((g) => ({
      id: g.id,
      resultUrl: g.resultUrl,
      thumbUrl: g.thumbUrl,
      subject: g.subject,
      scene: g.scene,
      createdAt: g.createdAt,
      userEmail: g.user.email,
    })),
  });
}

/** Create a template from an existing generation. */
export async function POST(req: Request) {
  try {
    await requireAdminUser();
  } catch (e) {
    return adminAuthError(e);
  }

  let body: { generationId?: string; category?: string; description?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!isTemplateCategory(body.category)) {
    return NextResponse.json({ error: "Choose a category." }, { status: 400 });
  }
  const generation = body.generationId
    ? await prisma.generation.findUnique({
        where: { id: body.generationId },
        select: { id: true, resultUrl: true, mode: true },
      })
    : null;
  if (!generation || generation.mode !== "model") {
    return NextResponse.json({ error: "Model shot not found." }, { status: 404 });
  }

  let imageUrl: string;
  try {
    imageUrl = await copyGenerationToTemplateStorage(generation.resultUrl);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not copy the photo." },
      { status: 502 },
    );
  }

  const last = await prisma.modelTemplate.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const template = await prisma.modelTemplate.create({
    data: {
      category: body.category,
      description: cleanTemplateDescription(body.description),
      imageUrl,
      sourceGenerationId: generation.id,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
  });
  return NextResponse.json({ ok: true, template });
}
