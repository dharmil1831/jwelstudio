import { isSuperAdminEmail } from "@/lib/admin";
import { normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import {
  sendEmailChannelOtp,
  sendSmsChannelOtp,
  verifyEmailOtp,
  verifySmsOtp,
} from "@/lib/otp";
import { prisma } from "@/lib/prisma";
import { getSessionUser, setSession } from "@/lib/session";
import { NextResponse } from "next/server";

type Body = {
  action?: "send" | "verify";
  channel?: "email" | "sms";
  value?: string;
  code?: string;
};

function bad(error: string, status = 400) {
  return NextResponse.json({ error }, { status });
}

/**
 * Changes the signed-in user's email or phone. The new address must be verified with
 * a one-time code first, because both are used to sign in.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return bad("Please sign in first.", 401);

  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return bad("Invalid JSON");
  }

  const channel = body.channel === "sms" ? "sms" : "email";
  const raw = body.value?.trim() ?? "";

  let value: string;
  try {
    if (channel === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
        return bad("Enter a valid email address.");
      }
      value = normalizeEmail(raw);
    } else {
      value = normalizePhone(raw);
    }
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Enter a valid mobile number.");
  }

  if (value === (channel === "email" ? user.email : user.phone)) {
    return bad(`This is already your ${channel === "email" ? "email" : "phone number"}.`);
  }
  if (channel === "email" && (await isSuperAdminEmail(value))) {
    return bad("This email cannot be used.");
  }

  const taken = await prisma.user.findFirst({
    where: channel === "email" ? { email: value } : { phone: value },
    select: { id: true },
  });
  if (taken && taken.id !== user.id) {
    return bad(
      `Another account already uses this ${channel === "email" ? "email" : "phone number"}.`,
    );
  }

  try {
    if (body.action === "verify") {
      const code = body.code?.trim() ?? "";
      if (!/^\d{4,8}$/.test(code)) return bad("Enter the code we sent you.");
      const ok =
        channel === "email"
          ? await verifyEmailOtp("change_contact", value, code)
          : await verifySmsOtp("change_contact", value, code);
      if (!ok) return bad("That code is wrong or has expired.");

      const now = new Date();
      const updated = await prisma.user.update({
        where: { id: user.id },
        data:
          channel === "email"
            ? { email: value, emailVerifiedAt: now }
            : { phone: value, phoneVerifiedAt: now },
        select: { id: true, email: true, phone: true },
      });
      if (channel === "email") await setSession(updated.id, updated.email);
      return NextResponse.json({ ok: true, email: updated.email, phone: updated.phone });
    }

    const result =
      channel === "email"
        ? await sendEmailChannelOtp("change_contact", value)
        : await sendSmsChannelOtp("change_contact", value);
    return NextResponse.json({
      ok: true,
      message:
        channel === "email"
          ? "We sent a code to your new email."
          : "We sent a code to your new number by SMS.",
      ...(process.env.NODE_ENV !== "production" && result.devCode
        ? { devCode: result.devCode }
        : {}),
    });
  } catch (e) {
    return bad(e instanceof Error ? e.message : "Something went wrong. Please try again.");
  }
}
