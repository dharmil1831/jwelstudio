import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  normalizePhone,
  verifyOtpHash,
} from "@/lib/auth-utils";
import { sendEmailOtp } from "@/lib/email";
import { isMsg91Configured, sendMsg91Otp } from "@/lib/msg91";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45 * 1000;
const MAX_SMS_PER_PHONE_PER_DAY = 10;

export type OtpPurpose = "signup" | "reset" | "login" | "verify_phone";
export type OtpChannel = "email" | "sms";

function startOfUtcDay(): Date {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

async function assertSmsDailyCap(phone: string): Promise<void> {
  const count = await prisma.otpChallenge.count({
    where: {
      channel: "sms",
      phone,
      createdAt: { gte: startOfUtcDay() },
    },
  });
  if (count >= MAX_SMS_PER_PHONE_PER_DAY) {
    throw new Error("SMS limit reached for today. Try again tomorrow or use email.");
  }
}

export async function sendEmailChannelOtp(
  purpose: OtpPurpose,
  rawEmail: string,
): Promise<{ devCode?: string }> {
  const email = normalizeEmail(rawEmail);
  const recent = await prisma.otpChallenge.findFirst({
    where: { purpose, channel: "email", email },
    orderBy: { createdAt: "desc" },
  });
  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    throw new Error("Please wait a moment before requesting another code.");
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.deleteMany({
    where: { purpose, channel: "email", email },
  });
  await prisma.otpChallenge.create({
    data: {
      purpose,
      channel: "email",
      email,
      phone: null,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  const emailPurpose = purpose === "reset" ? "reset" : "signup";
  await sendEmailOtp(email, code, emailPurpose);

  if (process.env.NODE_ENV !== "production") {
    return { devCode: code };
  }
  return {};
}

/** @deprecated Prefer sendEmailChannelOtp — kept for existing callers. */
export async function sendOtp(
  purpose: "signup" | "reset",
  rawEmail: string,
): Promise<{ devCode?: string }> {
  return sendEmailChannelOtp(purpose, rawEmail);
}

export async function sendSmsChannelOtp(
  purpose: OtpPurpose,
  rawPhone: string,
): Promise<{ devCode?: string }> {
  const phone = normalizePhone(rawPhone);

  if (!isMsg91Configured() && process.env.NODE_ENV === "production") {
    throw new Error("SMS is not configured on the server.");
  }

  await assertSmsDailyCap(phone);

  const recent = await prisma.otpChallenge.findFirst({
    where: { purpose, channel: "sms", phone },
    orderBy: { createdAt: "desc" },
  });
  if (
    recent &&
    Date.now() - recent.createdAt.getTime() < RESEND_COOLDOWN_MS
  ) {
    throw new Error("Please wait a moment before requesting another code.");
  }

  const code = generateOtpCode();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS);

  await prisma.otpChallenge.deleteMany({
    where: { purpose, channel: "sms", phone },
  });
  await prisma.otpChallenge.create({
    data: {
      purpose,
      channel: "sms",
      email: "",
      phone,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  await sendMsg91Otp(phone, code);

  if (process.env.NODE_ENV !== "production" || !isMsg91Configured()) {
    return { devCode: code };
  }
  return {};
}

export async function verifyEmailOtp(
  purpose: OtpPurpose,
  rawEmail: string,
  code: string,
): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const challenge = await prisma.otpChallenge.findFirst({
    where: { purpose, channel: "email", email },
    orderBy: { createdAt: "desc" },
  });
  return consumeChallenge(challenge, code);
}

/** @deprecated Prefer verifyEmailOtp */
export async function verifyOtp(
  purpose: "signup" | "reset",
  rawEmail: string,
  code: string,
): Promise<boolean> {
  return verifyEmailOtp(purpose, rawEmail, code);
}

export async function verifySmsOtp(
  purpose: OtpPurpose,
  rawPhone: string,
  code: string,
): Promise<boolean> {
  const phone = normalizePhone(rawPhone);
  const challenge = await prisma.otpChallenge.findFirst({
    where: { purpose, channel: "sms", phone },
    orderBy: { createdAt: "desc" },
  });
  return consumeChallenge(challenge, code);
}

async function consumeChallenge(
  challenge: {
    id: string;
    codeHash: string;
    expiresAt: Date;
    attempts: number;
  } | null,
  code: string,
): Promise<boolean> {
  if (!challenge) return false;
  if (challenge.expiresAt.getTime() < Date.now()) return false;
  if (challenge.attempts >= MAX_ATTEMPTS) return false;

  const ok = verifyOtpHash(code.trim(), challenge.codeHash);

  await prisma.otpChallenge.update({
    where: { id: challenge.id },
    data: { attempts: { increment: 1 } },
  });

  if (ok) {
    await prisma.otpChallenge.delete({ where: { id: challenge.id } });
  }

  return ok;
}
