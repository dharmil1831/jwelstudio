import { normalizeEmail } from "@/lib/auth-utils";
import { getSessionUser, type SessionUser } from "@/lib/session";

export function getAdminEmails(): string[] {
  const raw = process.env.ADMIN_EMAILS?.trim();
  if (!raw) return [];
  return raw
    .split(",")
    .map((e) => normalizeEmail(e))
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  const admins = getAdminEmails();
  if (admins.length === 0) return false;
  return admins.includes(normalizeEmail(email));
}

export async function requireAdminUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) throw new Error("UNAUTHORIZED");
  if (!isAdminEmail(user.email)) throw new Error("FORBIDDEN");
  return user;
}
