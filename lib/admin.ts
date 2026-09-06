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

/** Single super-admin email from env. Falls back to first ADMIN_EMAILS entry. */
export function getSuperAdminEmail(): string | null {
  const single = process.env.SUPER_ADMIN_EMAIL?.trim();
  if (single) return normalizeEmail(single);
  const legacy = process.env.ADMIN_EMAILS?.trim();
  if (!legacy) return null;
  const first = legacy.split(",")[0]?.trim();
  return first ? normalizeEmail(first) : null;
}

export function isSuperAdminEmail(email: string): boolean {
  const admin = getSuperAdminEmail();
  if (!admin) return false;
  return normalizeEmail(email) === admin;
}

/** @deprecated Use isSuperAdminEmail — kept for any lingering callers */
export function isAdminEmail(email: string): boolean {
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
  if (!isSuperAdminEmail(payload.email)) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user || !isSuperAdminEmail(user.email)) return null;

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
  if (!isSuperAdminEmail(email)) {
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
