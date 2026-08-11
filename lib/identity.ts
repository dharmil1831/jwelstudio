import { hashIdentity, normalizeEmail, normalizePhone } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function assertIdentityAvailable(
  email: string,
  phone?: string | null,
): Promise<void> {
  const emailNorm = normalizeEmail(email);

  const existingEmail = await prisma.user.findUnique({
    where: { email: emailNorm },
  });
  if (existingEmail) {
    throw new Error("An account with this email already exists. Please log in.");
  }

  const emailHash = hashIdentity(emailNorm);
  const emailLedger = await prisma.identityLedger.findUnique({
    where: { emailHash },
  });
  if (emailLedger && emailLedger.freeGenerationsUsed >= 5) {
    throw new Error("This email has already used its free generations.");
  }

  const phoneTrimmed = phone?.trim();
  if (!phoneTrimmed) return;

  const phoneNorm = normalizePhone(phoneTrimmed);
  const existingPhone = await prisma.user.findUnique({
    where: { phone: phoneNorm },
  });
  if (existingPhone) {
    throw new Error(
      "An account with this phone number already exists. Please log in.",
    );
  }

  const phoneHash = hashIdentity(phoneNorm);
  const phoneLedger = await prisma.identityLedger.findUnique({
    where: { phoneHash },
  });
  if (phoneLedger && phoneLedger.freeGenerationsUsed >= 5) {
    throw new Error("This phone number has already used its free generations.");
  }
}

export async function recordIdentityFreeGrant(
  email: string,
  phone?: string | null,
): Promise<void> {
  const emailHash = hashIdentity(normalizeEmail(email));

  await prisma.identityLedger.upsert({
    where: { emailHash },
    create: { emailHash, freeGenerationsUsed: 0 },
    update: {},
  });

  const phoneTrimmed = phone?.trim();
  if (!phoneTrimmed) return;

  const phoneHash = hashIdentity(normalizePhone(phoneTrimmed));
  await prisma.identityLedger.upsert({
    where: { phoneHash },
    create: { phoneHash, freeGenerationsUsed: 0 },
    update: {},
  });
}
