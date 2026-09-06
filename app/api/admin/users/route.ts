import { isSuperAdminEmail, requireAdminUser } from "@/lib/admin";
import { normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import { normalizePlanId, PLAN_IDS, type PlanId } from "@/lib/entitlements";
import { validatePasswordStrength } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createUser, STARTING_CREDITS } from "@/lib/users";
import { NextResponse } from "next/server";

function adminAuthError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Forbidden";
  return NextResponse.json(
    { error: msg === "UNAUTHORIZED" ? "Please log in as admin." : "Forbidden" },
    { status: msg === "UNAUTHORIZED" ? 401 : 403 },
  );
}

/** Create a studio user from the admin panel. */
export async function POST(req: Request) {
  try {
    await requireAdminUser();
  } catch (e) {
    return adminAuthError(e);
  }

  let body: {
    email?: string;
    password?: string;
    phone?: string | null;
    credits?: number;
    plan?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const phoneRaw = body.phone?.trim() || null;

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Provide a valid email address." },
      { status: 400 },
    );
  }

  if (isSuperAdminEmail(email)) {
    return NextResponse.json(
      {
        error:
          "That email is reserved for the super admin. Use /admin/login signup instead.",
      },
      { status: 403 },
    );
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  let phone: string | null = null;
  if (phoneRaw) {
    try {
      phone = normalizePhone(phoneRaw);
    } catch (e) {
      return NextResponse.json(
        { error: e instanceof Error ? e.message : "Invalid phone" },
        { status: 400 },
      );
    }
  }

  const plan: PlanId =
    body.plan && (PLAN_IDS as readonly string[]).includes(body.plan)
      ? (body.plan as PlanId)
      : "free";

  const credits =
    typeof body.credits === "number" &&
    Number.isInteger(body.credits) &&
    body.credits >= 0
      ? body.credits
      : STARTING_CREDITS;

  try {
    const existing = await prisma.user.findUnique({
      where: { email: normalizeEmail(email) },
    });
    if (existing) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 },
      );
    }
    if (phone) {
      const phoneTaken = await prisma.user.findUnique({ where: { phone } });
      if (phoneTaken) {
        return NextResponse.json(
          { error: "A user with this phone already exists." },
          { status: 409 },
        );
      }
    }

    const created = await createUser(email, password, phone);
    const user = await prisma.user.update({
      where: { id: created.id },
      data: { credits, plan },
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
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create user" },
      { status: 400 },
    );
  }
}
