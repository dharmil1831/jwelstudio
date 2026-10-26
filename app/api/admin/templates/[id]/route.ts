import { requireAdminUser } from "@/lib/admin";
import { cleanTemplateDescription, isTemplateCategory } from "@/lib/model-templates";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function adminAuthError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Forbidden";
  return NextResponse.json(
    { error: msg === "UNAUTHORIZED" ? "Please log in as admin." : "Forbidden" },
    { status: msg === "UNAUTHORIZED" ? 401 : 403 },
  );
}

/** Update category, description, active flag, or move up/down. */
export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser();
  } catch (e) {
    return adminAuthError(e);
  }

  const { id } = await ctx.params;
  let body: { category?: string; description?: string | null; active?: boolean; move?: "up" | "down" };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.modelTemplate.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Template not found." }, { status: 404 });
  }

  if (body.move === "up" || body.move === "down") {
    const all = await prisma.modelTemplate.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      select: { id: true },
    });
    const idx = all.findIndex((t) => t.id === id);
    const swap = body.move === "up" ? idx - 1 : idx + 1;
    if (swap >= 0 && swap < all.length) {
      [all[idx], all[swap]] = [all[swap], all[idx]];
      await prisma.$transaction(
        all.map((t, i) =>
          prisma.modelTemplate.update({ where: { id: t.id }, data: { sortOrder: i } }),
        ),
      );
    }
    return NextResponse.json({ ok: true });
  }

  const data: { category?: string; description?: string | null; active?: boolean } = {};
  if (body.category !== undefined) {
    if (!isTemplateCategory(body.category)) {
      return NextResponse.json({ error: "Invalid category." }, { status: 400 });
    }
    data.category = body.category;
  }
  if (body.description !== undefined) data.description = cleanTemplateDescription(body.description);
  if (typeof body.active === "boolean") data.active = body.active;
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  const template = await prisma.modelTemplate.update({ where: { id }, data });
  return NextResponse.json({ ok: true, template });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser();
  } catch (e) {
    return adminAuthError(e);
  }

  const { id } = await ctx.params;
  await prisma.modelTemplate.deleteMany({ where: { id } });
  return NextResponse.json({ ok: true });
}
