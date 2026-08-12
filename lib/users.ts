import { normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import { hashPassword, verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";

export const STARTING_CREDITS = 5;
export const CREDIT_COST_PER_GENERATION = 1;

export type PublicUser = {
  id: string;
  email: string;
  phone: string | null;
  credits: number;
};

export async function getUserById(userId: string): Promise<PublicUser | null> {
  const u = await prisma.user.findUnique({ where: { id: userId } });
  if (!u) return null;
  return { id: u.id, email: u.email, phone: u.phone, credits: u.credits };
}

export async function getUserByEmailOrPhone(
  identifier: string,
): Promise<PublicUser | null> {
  const trimmed = identifier.trim();
  let email: string | null = null;
  let phone: string | null = null;

  try {
    if (trimmed.includes("@")) {
      email = normalizeEmail(trimmed);
    } else {
      phone = normalizePhone(trimmed);
    }
  } catch {
    return null;
  }

  const u = email
    ? await prisma.user.findUnique({ where: { email } })
    : phone
      ? await prisma.user.findUnique({ where: { phone } })
      : null;

  if (!u) return null;
  return { id: u.id, email: u.email, phone: u.phone, credits: u.credits };
}

export async function createUser(
  email: string,
  password: string,
  phone?: string | null,
): Promise<{ id: string; credits: number }> {
  const phoneTrimmed = phone?.trim();
  const passwordHash = await hashPassword(password);

  const u = await prisma.user.create({
    data: {
      email: normalizeEmail(email),
      phone: phoneTrimmed ? normalizePhone(phoneTrimmed) : null,
      passwordHash,
      emailVerifiedAt: new Date(),
      phoneVerifiedAt: null,
      credits: STARTING_CREDITS,
    },
  });
  return { id: u.id, credits: u.credits };
}

export async function verifyUserPassword(
  email: string,
  password: string,
): Promise<PublicUser | null> {
  const u = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!u?.passwordHash) return null;

  const ok = await verifyPassword(password, u.passwordHash);
  if (!ok) return null;

  return { id: u.id, email: u.email, phone: u.phone, credits: u.credits };
}

export async function updateUserPassword(
  email: string,
  password: string,
): Promise<boolean> {
  const u = await prisma.user.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!u) return false;
  const passwordHash = await hashPassword(password);
  await prisma.user.update({
    where: { id: u.id },
    data: { passwordHash },
  });
  return true;
}

export async function deductCredits(
  userId: string,
  amount: number,
): Promise<{ ok: true; credits: number } | { ok: false; credits: number }> {
  try {
    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.user.findUnique({ where: { id: userId } });
      if (!row || row.credits < amount) return null;
      return tx.user.update({
        where: { id: userId },
        data: { credits: row.credits - amount },
      });
    });
    if (!updated) {
      const row = await prisma.user.findUnique({ where: { id: userId } });
      return { ok: false, credits: row?.credits ?? 0 };
    }
    return { ok: true, credits: updated.credits };
  } catch {
    const row = await prisma.user.findUnique({ where: { id: userId } });
    return { ok: false, credits: row?.credits ?? 0 };
  }
}

export async function refundCredits(
  userId: string,
  amount: number,
): Promise<number> {
  const u = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  });
  return u.credits;
}

export async function addCredits(
  userId: string,
  amount: number,
): Promise<number> {
  const u = await prisma.user.update({
    where: { id: userId },
    data: { credits: { increment: amount } },
  });
  return u.credits;
}
