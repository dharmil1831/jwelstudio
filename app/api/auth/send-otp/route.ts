import { normalizeEmail } from "@/lib/auth-utils";
import { sendOtp } from "@/lib/otp";
import { getUserByEmailOrPhone } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { email?: string; purpose?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const purpose = body.purpose === "reset" ? "reset" : "signup";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "Provide a valid email address." },
      { status: 400 },
    );
  }

  try {
    if (purpose === "signup") {
      const existing = await getUserByEmailOrPhone(email);
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 },
        );
      }
    } else {
      const existing = await getUserByEmailOrPhone(email);
      if (!existing) {
        return NextResponse.json({
          ok: true,
          message: "If an account exists, a reset code was sent.",
        });
      }
    }

    const result = await sendOtp(purpose, normalizeEmail(email));
    return NextResponse.json({
      ok: true,
      message:
        purpose === "reset"
          ? "If an account exists, a reset code was sent."
          : "Verification code sent to your email.",
      ...(process.env.NODE_ENV !== "production" && result.devCode
        ? { devCode: result.devCode }
        : {}),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Could not send code" },
      { status: 400 },
    );
  }
}
