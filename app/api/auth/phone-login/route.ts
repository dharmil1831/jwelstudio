import { normalizePhone } from "@/lib/auth-utils";
import { findOrCreateVerifiedAccount, SuperAdminSignInError } from "@/lib/auto-account";
import { verifySmsOtp } from "@/lib/otp";
import { setSession } from "@/lib/session";
import { NextResponse } from "next/server";

/** Passwordless sign-in with phone + SMS OTP. Creates the account the first time. */
export async function POST(req: Request) {
  let body: { phone?: string; code?: string; purpose?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const phoneRaw = body.phone?.trim();
  const code = body.code?.trim();
  if (!phoneRaw || !code) {
    return NextResponse.json(
      { error: "Phone and verification code are required." },
      { status: 400 },
    );
  }

  try {
    const phone = normalizePhone(phoneRaw);
    const purpose = body.purpose === "otp_login" ? "otp_login" : "login";
    const ok = await verifySmsOtp(purpose, phone, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    const user = await findOrCreateVerifiedAccount({ kind: "phone", phone });
    await setSession(user.id, user.email);

    return NextResponse.json({
      ok: true,
      created: user.created,
      user: { email: user.email, phone: user.phone, credits: user.credits },
    });
  } catch (e) {
    if (e instanceof SuperAdminSignInError) {
      return NextResponse.json(
        {
          error:
            "Super admin must sign in at /admin/login — phone login cannot open the admin panel.",
        },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 400 },
    );
  }
}
