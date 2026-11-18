import {
  FIRST_GOOGLE_SIGN_IN_MESSAGE,
  PHONE_SIGN_IN_PAUSED_MESSAGE,
} from "@/lib/auto-account";
import { normalizeEmail } from "@/lib/auth-utils";
import { sendEmailChannelOtp } from "@/lib/otp";
import { getUserByEmailOrPhone } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: {
    email?: string;
    phone?: string;
    purpose?: string;
    channel?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const purposeRaw = body.purpose?.trim() || "signup";
  const purpose =
    purposeRaw === "reset" ||
    purposeRaw === "login" ||
    purposeRaw === "verify_phone" ||
    purposeRaw === "otp_login"
      ? purposeRaw
      : "signup";

  const wantsSms =
    body.channel === "sms" ||
    Boolean(body.phone?.trim() && !body.email?.includes("@"));

  try {
    if (wantsSms) {
      return NextResponse.json(
        { error: PHONE_SIGN_IN_PAUSED_MESSAGE },
        { status: 503 },
      );
    }

    const email = body.email?.trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Provide a valid email address." },
        { status: 400 },
      );
    }

    const normalized = normalizeEmail(email);

    if (purpose === "otp_login") {
      const existing = await getUserByEmailOrPhone(normalized);
      if (!existing) {
        return NextResponse.json(
          { error: FIRST_GOOGLE_SIGN_IN_MESSAGE },
          { status: 403 },
        );
      }
    } else if (purpose === "signup") {
      const existing = await getUserByEmailOrPhone(normalized);
      if (existing) {
        return NextResponse.json(
          { error: "An account with this email already exists. Please log in." },
          { status: 400 },
        );
      }
    } else if (purpose === "reset" || purpose === "login") {
      const existing = await getUserByEmailOrPhone(normalized);
      if (!existing) {
        return NextResponse.json({
          ok: true,
          channel: "email",
          message: "If an account exists, a code was sent.",
        });
      }
    }

    const result = await sendEmailChannelOtp(
      purpose === "login" ? "reset" : purpose === "verify_phone" ? "signup" : purpose,
      normalized,
    );
    if (purpose === "otp_login") {
      return NextResponse.json({
        ok: true,
        channel: "email",
        message: "Sign-in code sent to your email.",
        ...(process.env.NODE_ENV !== "production" && result.devCode
          ? { devCode: result.devCode }
          : {}),
      });
    }
    return NextResponse.json({
      ok: true,
      channel: "email",
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
