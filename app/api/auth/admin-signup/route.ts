import { isSuperAdminEmail, setAdminSession } from "@/lib/admin";
import { normalizeEmail } from "@/lib/auth-utils";
import {
  assertIdentityAvailable,
  recordIdentityFreeGrant,
} from "@/lib/identity";
import { validatePasswordStrength } from "@/lib/password";
import { setSession } from "@/lib/session";
import { createUser, getUserByEmailOrPhone } from "@/lib/users";
import { NextResponse } from "next/server";

/** Create the single super-admin account (only SUPER_ADMIN_EMAIL allowed). */
export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Provide a valid email address." },
      { status: 400 },
    );
  }

  if (!isSuperAdminEmail(email)) {
    return NextResponse.json(
      {
        error:
          "Only the configured SUPER_ADMIN_EMAIL can sign up here. Update .env if needed.",
      },
      { status: 403 },
    );
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    const existing = await getUserByEmailOrPhone(email);
    if (existing) {
      return NextResponse.json(
        { error: "Super admin already exists. Log in instead." },
        { status: 409 },
      );
    }

    await assertIdentityAvailable(email, null);
    await recordIdentityFreeGrant(email, null);
    const user = await createUser(email, password, null);
    const normalized = normalizeEmail(email);
    await setAdminSession(user.id, normalized);
    await setSession(user.id, normalized);

    return NextResponse.json({
      ok: true,
      user: { email: normalized },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create admin" },
      { status: 400 },
    );
  }
}
