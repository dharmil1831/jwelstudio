import { normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import { verifyEmailOtp, verifySmsOtp } from "@/lib/otp";
import { validatePasswordStrength } from "@/lib/password";
import { updateUserPassword, updateUserPasswordByPhone } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: {
    email?: string;
    phone?: string;
    code?: string;
    password?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const code = body.code?.trim();
  const password = body.password ?? "";
  const phoneRaw = body.phone?.trim();
  const emailRaw = body.email?.trim();

  if (!code) {
    return NextResponse.json(
      { error: "Verification code is required." },
      { status: 400 },
    );
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    if (phoneRaw) {
      const phone = normalizePhone(phoneRaw);
      const ok = await verifySmsOtp("reset", phone, code);
      if (!ok) {
        return NextResponse.json(
          { error: "Invalid or expired verification code." },
          { status: 401 },
        );
      }
      const updated = await updateUserPasswordByPhone(phone, password);
      if (!updated) {
        return NextResponse.json({ error: "No account found." }, { status: 404 });
      }
      return NextResponse.json({
        ok: true,
        message: "Password updated. You can log in now.",
      });
    }

    if (!emailRaw || !emailRaw.includes("@")) {
      return NextResponse.json(
        { error: "Email or phone and verification code are required." },
        { status: 400 },
      );
    }

    const email = normalizeEmail(emailRaw);
    const ok = await verifyEmailOtp("reset", email, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    const updated = await updateUserPassword(email, password);
    if (!updated) {
      return NextResponse.json({ error: "No account found." }, { status: 404 });
    }

    return NextResponse.json({
      ok: true,
      message: "Password updated. You can log in now.",
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not reset password" },
      { status: 400 },
    );
  }
}
