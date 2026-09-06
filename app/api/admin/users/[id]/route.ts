import { isSuperAdminEmail, requireAdminUser } from "@/lib/admin";
import { normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import { PLAN_IDS, type PlanId } from "@/lib/entitlements";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

function adminAuthError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Forbidden";
  return NextResponse.json(
    { error: msg === "UNAUTHORIZED" ? "Please log in as admin." : "Forbidden" },
    { status:  msg === "UNAUTHORIZED" ? 401 : 403 },
  );
}

/** Update user fields (email, phone, password, credits, plan). */
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

  let body: {
    email?: string;
    phone?: string | null;
    password?: string;
    credits?: number;
    plan?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const data: {
    email?: string;
    phone?: string | null;
    passwordHash?: string;
    credits?: number;
    plan?: string;
  } = {};

  if (body.email !== undefined) {
    const email = body.email.trim();
    if (!email.includes("@")) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    const normalized = normalizeEmail(email);
    if (isSuperAdminEmail(existing.email) && !isSuperAdminEmail(normalized)) {
      return NextResponse.json(
        { error: "Cannot change the super admin email away from SUPER_ADMIN_EMAIL." },
        { status: 403 },
      );
    }
    if (
      !isSuperAdminEmail(existing.email) &&
      isSuperAdminEmail(normalized)
    ) {
      return NextResponse.json(
        { error: "That email is reserved for the super admin." },
        { status: 403 },
      );
    }
    data.email = normalized;
  }

  if (body.phone !== undefined) {
    const raw = body.phone?.trim() || null;
    if (!raw) {
      data.phone = null;
    } else {
      try {
        data.phone = normalizePhone(raw);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid phone" },
          { status: 400 },
        );
      }
    }
  }

  if (body.password !== undefined && body.password !== "") {
    const passwordError = validatePasswordStrength(body.password);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
    data.passwordHash = await hashPassword(body.password);
  }

  if (body.credits !== undefined) {
    if (
      typeof body.credits !== "number" ||
      !Number.isInteger(body.credits) ||
      body.credits < 0
    ) {
      return NextResponse.json(
        { error: "credits must be a non-negative integer" },
        { status: 400 },
      );
    }
    data.credits = body.credits;
  }

  if (body.plan !== undefined) {
    if (!(PLAN_IDS as readonly string[]).includes(body.plan)) {
      return NextResponse.json({ error: "Invalid plan." }, { status: 400 });
    }
    data.plan = body.plan as PlanId;
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "No fields to update." }, { status: 400 });
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        phone: true,
        credits: true,
        plan: true,
      },
    });
    return NextResponse.json({ ok: true, user });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Update failed";
    if (msg.toLowerCase().includes("unique")) {
      return NextResponse.json(
        { error: "Email or phone already in use." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

/** Delete a user and cascaded generations / payments / themes. */
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
  const existing = await prisma.user.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (isSuperAdminEmail(existing.email)) {
    return NextResponse.json(
      { error: "Cannot delete the super admin account." },
      { status: 403 },
    );
  }

  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
