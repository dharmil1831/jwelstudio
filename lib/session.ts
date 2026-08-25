import {
  createSessionToken,
  createSignupProgressToken,
  SESSION_COOKIE,
  SIGNUP_COOKIE,
  verifySignedPayload,
} from "@/lib/auth-utils";
import { isPrismaConnectivityError, prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

const ONE_MONTH = 60 * 60 * 24 * 30;
const THIRTY_MIN = 60 * 30;

export type SessionUser = {
  id: string;
  email: string;
  phone: string | null;
  credits: number;
};

export async function getSessionUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const payload = verifySignedPayload<{ userId: string; email: string }>(
    token,
  );
  if (!payload?.userId) return null;

  try {
    const user = await prisma.user.findUnique({ where: { id: payload.userId } });
    if (!user) return null;

    return {
      id: user.id,
      email: user.email,
      phone: user.phone,
      credits: user.credits,
    };
  } catch (error) {
    if (isPrismaConnectivityError(error)) {
      console.error(
        "[session] database unreachable — treat as logged out until DB recovers",
      );
      return null;
    }
    throw error;
  }
}

export async function setSession(userId: string, email: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, createSessionToken(userId, email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: ONE_MONTH,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function clearSession(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  jar.delete(SIGNUP_COOKIE);
}

export async function setSignupProgress(email: string): Promise<void> {
  const jar = await cookies();
  jar.set(SIGNUP_COOKIE, createSignupProgressToken(email), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_MIN,
    secure: process.env.NODE_ENV === "production",
  });
}

export async function getSignupProgressEmail(): Promise<string | null> {
  const jar = await cookies();
  const token = jar.get(SIGNUP_COOKIE)?.value;
  if (!token) return null;
  const payload = verifySignedPayload<{ email: string; emailVerified: boolean }>(
    token,
  );
  if (!payload?.emailVerified) return null;
  return payload.email;
}

export async function requireSessionUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  return user;
}
