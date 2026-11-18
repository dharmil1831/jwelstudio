import { isSuperAdminEmail } from "@/lib/admin";
import { hashIdentity, normalizeEmail, normalizePhone, randomId } from "@/lib/auth-utils";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { STARTING_CREDITS } from "@/lib/users";

export type SignInIdentity =
  | { kind: "email"; email: string }
  | { kind: "phone"; phone: string };

export type SignedInAccount = {
  id: string;
  email: string;
  phone: string | null;
  credits: number;
  created: boolean;
};

export function phonePlaceholderEmail(phone: string): string {
  return `phone-${phone.replace(/\D/g, "")}@users.jwelpixel.app`;
}

export class SuperAdminSignInError extends Error {
  constructor() {
    super("Super admin must sign in at /admin/login.");
  }
}

/** Kept for older clients that still import this name. */
export const FIRST_PHONE_SIGN_IN_MESSAGE =
  "Your first sign-in has to be with Gmail. After that, you can use Gmail again, an email code, or the password you set.";

export const FIRST_GOOGLE_SIGN_IN_MESSAGE = FIRST_PHONE_SIGN_IN_MESSAGE;

export const PHONE_SIGN_IN_PAUSED_MESSAGE =
  "Phone SMS sign-in is paused. Create your account with Gmail, then use Gmail, an email code, or your password to return.";

export async function findExistingVerifiedAccount(
  identity: SignInIdentity,
): Promise<SignedInAccount | null> {
  const email =
    identity.kind === "email" ? normalizeEmail(identity.email) : null;
  const phone = identity.kind === "phone" ? normalizePhone(identity.phone) : null;

  if (email && (await isSuperAdminEmail(email))) throw new SuperAdminSignInError();

  const existing = phone
    ? await prisma.user.findUnique({ where: { phone } })
    : await prisma.user.findUnique({ where: { email: email! } });

  if (!existing) return null;
  if (await isSuperAdminEmail(existing.email)) throw new SuperAdminSignInError();

  const verified = await prisma.user.update({
    where: { id: existing.id },
    data: phone
      ? { phoneVerifiedAt: existing.phoneVerifiedAt ?? new Date() }
      : { emailVerifiedAt: existing.emailVerifiedAt ?? new Date() },
  });
  return {
    id: verified.id,
    email: verified.email,
    phone: verified.phone,
    credits: verified.credits,
    created: false,
  };
}

export async function findOrCreateVerifiedAccount(
  identity: SignInIdentity,
): Promise<SignedInAccount> {
  const existing = await findExistingVerifiedAccount(identity);
  if (existing) return existing;

  const email =
    identity.kind === "email"
      ? normalizeEmail(identity.email)
      : phonePlaceholderEmail(normalizePhone(identity.phone));
  const phone = identity.kind === "phone" ? normalizePhone(identity.phone) : null;

  const ledgerKey = phone
    ? { phoneHash: hashIdentity(phone) }
    : { emailHash: hashIdentity(email) };
  const alreadyGranted = await prisma.identityLedger.findUnique({ where: ledgerKey });
  await prisma.identityLedger.upsert({
    where: ledgerKey,
    create: { ...ledgerKey, freeGenerationsUsed: 0 },
    update: {},
  });

  const user = await prisma.user.create({
    data: {
      email,
      phone,
      passwordHash: await hashPassword(randomId() + randomId()),
      emailVerifiedAt: phone ? null : new Date(),
      phoneVerifiedAt: phone ? new Date() : null,
      credits: alreadyGranted ? 0 : STARTING_CREDITS,
    },
  });

  return {
    id: user.id,
    email: user.email,
    phone: user.phone,
    credits: user.credits,
    created: true,
  };
}
