import { verifyOtp } from "@/lib/otp";
import { validatePasswordStrength } from "@/lib/password";
import { updateUserPassword } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { email?: string; code?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const code = body.code?.trim();
  const password = body.password ?? "";

  if (!email || !code) {
    return NextResponse.json(
      { error: "Email and verification code are required." },
      { status: 400 },
    );
  }

  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  try {
    const ok = await verifyOtp("reset", email, code);
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
