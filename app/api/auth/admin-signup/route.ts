import { getSuperAdminEmail, setAdminSession, setSuperAdminEmail } from "@/lib/admin";
import { normalizeEmail } from "@/lib/auth-utils";
import {
  assertIdentityAvailable,
  recordIdentityFreeGrant,
} from "@/lib/identity";
import { validatePasswordStrength } from "@/lib/password";
import { setSession } from "@/lib/session";
import { createUser, getUserByEmailOrPhone, verifyUserPassword } from "@/lib/users";
import { NextResponse } from "next/server";

/** Create the admin account from the admin sign-up form. */
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

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  const normalized = normalizeEmail(email);

  try {
    const configured = await getSuperAdminEmail();
    if (configured) {
      const currentAdmin = await getUserByEmailOrPhone(configured);
      if (currentAdmin) {
        return NextResponse.json(
          {
            error:
              "The admin login already exists. Log in, then change it under Settings.",
          },
          { status: 409 },
        );
      }
    }

    const existing = await getUserByEmailOrPhone(normalized);
    if (existing) {
      const matched = await verifyUserPassword(normalized, password);
      if (!matched || matched.id !== existing.id) {
        return NextResponse.json(
          { error: "That email already has an account. Use its current password to make it the admin." },
          { status: 401 },
        );
      }
      await setSuperAdminEmail(normalized);
      await setAdminSession(existing.id, normalized);
      await setSession(existing.id, normalized);
      return NextResponse.json({
        ok: true,
        user: { email: normalized },
      });
    }

    await assertIdentityAvailable(normalized, null);
    await recordIdentityFreeGrant(normalized, null);
    const user = await createUser(normalized, password, null);
    await setSuperAdminEmail(normalized);
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
