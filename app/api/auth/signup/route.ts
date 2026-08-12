import { normalizeEmail } from "@/lib/auth-utils";
import {
  assertIdentityAvailable,
  recordIdentityFreeGrant,
} from "@/lib/identity";
import { verifyOtp } from "@/lib/otp";
import { validatePasswordStrength } from "@/lib/password";
import { setSession } from "@/lib/session";
import { createUser } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: {
    email?: string;
    password?: string;
    phone?: string;
    code?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const phone = body.phone?.trim() || null;
  const code = body.code?.trim();

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Provide a valid email address." },
      { status: 400 },
    );
  }

  if (!code) {
    return NextResponse.json(
      { error: "Enter the verification code sent to your email." },
      { status: 400 },
    );
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    const ok = await verifyOtp("signup", email, code);
    if (!ok) {
      return NextResponse.json(
        { error: "Invalid or expired verification code." },
        { status: 401 },
      );
    }

    await assertIdentityAvailable(email, phone);
    await recordIdentityFreeGrant(email, phone);
    const user = await createUser(email, password, phone);
    const normalized = normalizeEmail(email);
    await setSession(user.id, normalized);

    return NextResponse.json({
      ok: true,
      user: {
        email: normalized,
        phone: phone ? phone : null,
        credits: user.credits,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not create account" },
      { status: 400 },
    );
  }
}
