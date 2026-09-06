import { isSuperAdminEmail } from "@/lib/admin";
import { normalizePhone } from "@/lib/auth-utils";
import { verifySmsOtp } from "@/lib/otp";
import { setSession } from "@/lib/session";
import { getUserByEmailOrPhone, markPhoneVerified } from "@/lib/users";
import { NextResponse } from "next/server";

/** Passwordless login with phone + SMS OTP. */
export async function POST(req: Request) {
  let body: { phone?: string; code?: string };
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
    const ok = await verifySmsOtp("login", phone, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    const user = await getUserByEmailOrPhone(phone);
    if (!user) {
      return NextResponse.json({ error: "No account found." }, { status: 404 });
    }

    if (isSuperAdminEmail(user.email)) {
      return NextResponse.json(
        {
          error:
            "Super admin must sign in at /admin/login — phone login cannot open the admin panel.",
        },
        { status: 403 },
      );
    }

    await markPhoneVerified(user.id);
    await setSession(user.id, user.email);

    return NextResponse.json({
      ok: true,
      user: { email: user.email, phone: user.phone, credits: user.credits },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 400 },
    );
  }
}
