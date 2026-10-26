import { normalizeEmail } from "@/lib/auth-utils";
import { findOrCreateVerifiedAccount, SuperAdminSignInError } from "@/lib/auto-account";
import { verifyEmailOtp } from "@/lib/otp";
import { setSession } from "@/lib/session";
import { ensureAuthUser } from "@/lib/supabase-auth";
import { NextResponse } from "next/server";

/** Passwordless sign-in with an emailed code. Creates the account the first time. */
export async function POST(req: Request) {
  let body: { email?: string; code?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const emailRaw = body.email?.trim();
  const code = body.code?.trim();
  if (!emailRaw || !emailRaw.includes("@") || !code) {
    return NextResponse.json(
      { error: "Email and verification code are required." },
      { status: 400 },
    );
  }

  try {
    const email = normalizeEmail(emailRaw);
    const ok = await verifyEmailOtp("otp_login", email, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    const user = await findOrCreateVerifiedAccount({ kind: "email", email });
    await ensureAuthUser(user.id);
    await setSession(user.id, user.email);

    return NextResponse.json({
      ok: true,
      created: user.created,
      user: { email: user.email, phone: user.phone, credits: user.credits },
    });
  } catch (e) {
    if (e instanceof SuperAdminSignInError) {
      return NextResponse.json(
        { error: "Super admin must sign in at /admin/login." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sign-in failed" },
      { status: 400 },
    );
  }
}
