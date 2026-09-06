import { canUseFeature } from "@/lib/entitlements";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { normalizeThemeStyle, serializeThemeStyle } from "@/lib/themes";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  if (!canUseFeature(user.plan, "themes")) {
    return NextResponse.json(
      { error: "Saved themes unlock on Platinum and Diamond." },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.theme.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Theme not found." }, { status: 404 });
  }

  let json: Record<string, unknown>;
  try {
    json = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: { name?: string; styleJson?: string; previewUrl?: string | null } =
    {};

  if (typeof json.name === "string") {
    const name = json.name.trim().slice(0, 80);
    if (!name) {
      return NextResponse.json({ error: "Theme name is required." }, { status: 400 });
    }
    data.name = name;
  }

  if (json.style && typeof json.style === "object" && !Array.isArray(json.style)) {
    const style = normalizeThemeStyle(json.style as Record<string, unknown>);
    if (!style) {
      return NextResponse.json({ error: "Invalid theme style." }, { status: 400 });
    }
    data.styleJson = serializeThemeStyle(style);
  }

  if (json.previewUrl === null) {
    data.previewUrl = null;
  } else if (typeof json.previewUrl === "string" && json.previewUrl.startsWith("http")) {
    data.previewUrl = json.previewUrl.slice(0, 2000);
  }

  const theme = await prisma.theme.update({
    where: { id: existing.id },
    data,
    select: {
      id: true,
      name: true,
      styleJson: true,
      previewUrl: true,
      createdAt: true,
    },
  });

  return NextResponse.json({
    theme: { ...theme, createdAt: theme.createdAt.toISOString() },
  });
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }
  if (!canUseFeature(user.plan, "themes")) {
    return NextResponse.json(
      { error: "Saved themes unlock on Platinum and Diamond." },
      { status: 403 },
    );
  }

  const { id } = await ctx.params;
  const existing = await prisma.theme.findFirst({
    where: { id, userId: user.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Theme not found." }, { status: 404 });
  }

  await prisma.theme.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}
