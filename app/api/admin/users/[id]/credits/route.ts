import { requireAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json(
      { error: msg === "UNAUTHORIZED" ? "Please log in." : "Forbidden" },
      { status: msg === "UNAUTHORIZED" ? 401 : 403 },
    );
  }

  const { id } = await ctx.params;

  let body: { credits?: number };
  try {
    body = (await req.json()) as { credits?: number };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const credits = body.credits;
  if (typeof credits !== "number" || !Number.isInteger(credits) || credits < 0) {
    return NextResponse.json(
      { error: "credits must be a non-negative integer" },
      { status: 400 },
    );
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { credits },
      select: { id: true, email: true, credits: true },
    });
    return NextResponse.json({ ok: true, user });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
