import { normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import { sendEmailChannelOtp, sendSmsChannelOtp } from "@/lib/otp";
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
    purposeRaw === "verify_phone"
      ? purposeRaw
      : "signup";

  const wantsSms =
    body.channel === "sms" ||
    Boolean(body.phone?.trim() && !body.email?.includes("@"));

  try {
    if (wantsSms) {
      const phoneRaw = body.phone?.trim();
      if (!phoneRaw) {
        return NextResponse.json(
          { error: "Provide a valid 10-digit mobile number." },
          { status: 400 },
        );
      }
      let phone: string;
      try {
        phone = normalizePhone(phoneRaw);
      } catch (e) {
        return NextResponse.json(
          { error: e instanceof Error ? e.message : "Invalid phone" },
          { status: 400 },
        );
      }

      const existing = await getUserByEmailOrPhone(phone);

      if (purpose === "signup" || purpose === "verify_phone") {
        if (purpose === "signup" && existing) {
          return NextResponse.json(
            { error: "An account with this phone already exists. Please log in." },
            { status: 400 },
          );
        }
      } else if (purpose === "reset" || purpose === "login") {
        if (!existing) {
          return NextResponse.json({
            ok: true,
            message:
              purpose === "reset"
                ? "If an account exists, a reset code was sent."
                : "If an account exists, a login code was sent.",
            channel: "sms",
          });
        }
      }

      const result = await sendSmsChannelOtp(purpose, phone);
      return NextResponse.json({
        ok: true,
        channel: "sms",
        message:
          purpose === "reset"
            ? "If an account exists, a reset code was sent by SMS."
            : purpose === "login"
              ? "Login code sent by SMS."
              : "Verification code sent by SMS.",
        ...(process.env.NODE_ENV !== "production" && result.devCode
          ? { devCode: result.devCode }
          : {}),
      });
    }

    const email = body.email?.trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "Provide a valid email address or mobile number." },
        { status: 400 },
      );
    }

    const normalized = normalizeEmail(email);

    if (purpose === "signup") {
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
