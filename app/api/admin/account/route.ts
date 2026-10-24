import { requireAdminUser, setAdminSession, setSuperAdminEmail } from "@/lib/admin";
import { normalizeEmail } from "@/lib/auth-utils";
import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { verifyUserPassword } from "@/lib/users";
import { NextResponse } from "next/server";

function authError(e: unknown) {
  const msg = e instanceof Error ? e.message : "Forbidden";
  return NextResponse.json(
    { error: msg === "UNAUTHORIZED" ? "Please log in as admin." : "Forbidden" },
    { status: msg === "UNAUTHORIZED" ? 401 : 403 },
  );
}

export async function GET() {
  try {
    const admin = await requireAdminUser();
    return NextResponse.json({ email: admin.email });
  } catch (e) {
    return authError(e);
  }
}

export async function POST(req: Request) {
  let admin;
  try {
    admin = await requireAdminUser();
  } catch (e) {
    return authError(e);
  }

  let body: {
    currentPassword?: string;
    email?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const currentPassword = body.currentPassword ?? "";
  const nextEmail = body.email?.trim()
    ? normalizeEmail(body.email.trim())
    : normalizeEmail(admin.email);
  const newPassword = body.newPassword ?? "";
  const confirmPassword = body.confirmPassword ?? "";

  if (!currentPassword) {
    return NextResponse.json(
      { error: "Enter your current password." },
      { status: 400 },
    );
  }

  const signedIn = await verifyUserPassword(admin.email, currentPassword);
  if (!signedIn || signedIn.id !== admin.id) {
    return NextResponse.json(
      { error: "Current password is wrong." },
      { status: 401 },
    );
  }

  const emailChanged = nextEmail !== normalizeEmail(admin.email);
  const passwordChanged = newPassword.length > 0;

  if (!emailChanged && !passwordChanged) {
    return NextResponse.json(
      { error: "Enter a new email or a new password." },
      { status: 400 },
    );
  }

  if (!nextEmail.includes("@")) {
    return NextResponse.json({ error: "Enter a valid email." }, { status: 400 });
  }

  if (emailChanged) {
    const taken = await prisma.user.findUnique({ where: { email: nextEmail } });
    if (taken && taken.id !== admin.id) {
      return NextResponse.json(
        { error: "That email is already used by another account." },
        { status: 409 },
      );
    }
  }

  if (passwordChanged) {
    if (newPassword !== confirmPassword) {
      return NextResponse.json(
        { error: "New passwords do not match." },
        { status: 400 },
      );
    }
    const passwordError = validatePasswordStrength(newPassword);
    if (passwordError) {
      return NextResponse.json({ error: passwordError }, { status: 400 });
    }
  }

  await prisma.user.update({
    where: { id: admin.id },
    data: {
      ...(emailChanged ? { email: nextEmail } : {}),
      ...(passwordChanged ? { passwordHash: await hashPassword(newPassword) } : {}),
    },
  });
  await setSuperAdminEmail(nextEmail);
  await setAdminSession(admin.id, nextEmail);
  await setSession(admin.id, nextEmail);

  return NextResponse.json({ ok: true, email: nextEmail });
}
