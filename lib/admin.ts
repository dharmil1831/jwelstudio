import {
  ADMIN_SESSION_COOKIE,
  createAdminSessionToken,
  normalizeEmail,
  verifySignedPayload,
} from "@/lib/auth-utils";
import { isPrismaConnectivityError, prisma } from "@/lib/prisma";
import { normalizePlanId, type PlanId } from "@/lib/entitlements";
import { cookies } from "next/headers";

const ONE_WEEK = 60 * 60 * 24 * 7;

export type AdminSessionUser = {
  id: string;
  email: string;
  phone: string | null;
  credits: number;
  plan: PlanId;
};

const SUPER_ADMIN_SETTING_KEY = "superAdminEmail";

/** The only admin login is the email saved from the site. */
export async function getSuperAdminEmail(): Promise<string | null> {
  try {
    const row = await prisma.appSetting.findUnique({
      where: { key: SUPER_ADMIN_SETTING_KEY },
    });
    const saved = row?.value?.trim();
    if (saved?.includes("@")) return normalizeEmail(saved);
  } catch (error) {
    if (!isPrismaConnectivityError(error)) throw error;
  }
  return null;
}

export async function setSuperAdminEmail(email: string): Promise<void> {
  const value = normalizeEmail(email);
  await prisma.appSetting.upsert({
    where: { key: SUPER_ADMIN_SETTING_KEY },
    create: { key: SUPER_ADMIN_SETTING_KEY, value },
    update: { value },
  });
}

export async function isSuperAdminEmail(email: string): Promise<boolean> {
  const admin = await getSuperAdminEmail();
  if (!admin) return false;
  return normalizeEmail(email) === admin;
}

/** @deprecated Use isSuperAdminEmail — kept for any lingering callers */
export async function isAdminEmail(email: string): Promise<boolean> {
  return isSuperAdminEmail(email);
}

export async function getAdminSessionUser(): Promise<AdminSessionUser | null> {
  const jar = await cookies();
  const token = jar.get(ADMIN_SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySignedPayload<{
    userId: string;
    email: string;
    role?: string;
  }>(token);
  if (!payload?.userId || payload.role !== "super_admin") return null;
  if (!(await isSuperAdminEmail(payload.email))) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !(await isSuperAdminEmail(user.email))) return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      credits: user.credits,
      plan: normalizePlanId(user.plan),
    };
  } catch (error) {
    if (isPrismaConnectivityError(error)) {
      console.error("[admin-session] database unreachable");
      return null;
    }
    throw error;
  }
}

export async function setAdminSession(
  userId: string,
  email: string,
): Promise<void> {
  if (!(await isSuperAdminEmail(email))) {
    throw new Error("Not the configured super admin.");
  }
  const jar = await cookies();
  jar.set(ADMIN_SESSION_COOKIE, createAdminSessionToken(userId, email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_WEEK,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearAdminSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

export async function requireAdminUser(): Promise<AdminSessionUser> {
  const user = await getAdminSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}

export async function hasAdminSession(): Promise<boolean> {
  return (await getAdminSessionUser()) !== null;
}
