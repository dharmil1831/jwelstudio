import { requireAdminUser } from "@/lib/admin";
import { normalizePlanId, PLAN_IDS, type PlanId } from "@/lib/entitlements";
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

  let body: { plan?: string };
  try {
    body = (await req.json()) as { plan?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const plan = normalizePlanId(body.plan);
  if (!(PLAN_IDS as readonly string[]).includes(plan)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: { plan },
      select: { id: true, email: true, plan: true, credits: true },
    });
    return NextResponse.json({
      ok: true,
      user: { ...user, plan: user.plan as PlanId },
    });
  } catch {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
}
