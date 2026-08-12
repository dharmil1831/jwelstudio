import {
  generateOtpCode,
  hashOtp,
  normalizeEmail,
  verifyOtpHash,
} from "@/lib/auth-utils";
import { sendEmailOtp } from "@/lib/email";
import { prisma } from "@/lib/prisma";

const OTP_TTL_MS = 10 * 60 * 1000;
const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_MS = 45 * 1000;

export type OtpPurpose = "signup" | "reset";

export async function sendOtp(
  purpose: OtpPurpose,
  rawEmail: string,
): Promise<{ devCode?: string }> {
  const email = normalizeEmail(rawEmail);
  const recent = await prisma.otpChallenge.findFirst({
    where: { purpose, email },
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

  await prisma.otpChallenge.deleteMany({ where: { purpose, email } });
  await prisma.otpChallenge.create({
    data: {
      purpose,
      email,
      codeHash: hashOtp(code),
      expiresAt,
    },
  });

  await sendEmailOtp(email, code, purpose);

  if (process.env.NODE_ENV !== "production") {
    return { devCode: code };
  }
  return {};
}

export async function verifyOtp(
  purpose: OtpPurpose,
  rawEmail: string,
  code: string,
): Promise<boolean> {
  const email = normalizeEmail(rawEmail);
  const challenge = await prisma.otpChallenge.findFirst({
    where: { purpose, email },
    orderBy: { createdAt: "desc" },
  });

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
