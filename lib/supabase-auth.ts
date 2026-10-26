import { normalizeEmail } from "@/lib/auth-utils";
import { isSuperAdminEmail } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { supabaseAuthKey, supabaseUrl } from "@/lib/supabase-env";
import { getSupabaseAdmin } from "@/lib/supabase";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

type CookieToSet = { name: string; value: string; options: CookieOptions };

/** Cookie-aware client for route handlers. Returns null when Supabase is not configured. */
export async function createSupabaseServerClient() {
  const url = supabaseUrl();
  const key = supabaseAuthKey();
  if (!url || !key) return null;
  const jar = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return jar.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            jar.set(name, value, options);
          }
        } catch {
          // Server Components cannot write cookies. Middleware refreshes the session.
        }
      },
    },
  });
}

/** Create the Supabase user for an app account that does not have one yet. Skips the super admin. */
export async function ensureAuthUser(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;
  if (await isSuperAdminEmail(user.email)) return null;
  if (user.authUserId) return user.authUserId;

  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase auth is not configured.");

  const email = normalizeEmail(user.email);
  const phone = user.phoneVerifiedAt && user.phone ? user.phone : undefined;
  const created = await admin.auth.admin.createUser({
    email,
    email_confirm: Boolean(user.emailVerifiedAt) || email.endsWith("@users.jwelpixel.app"),
    phone,
    phone_confirm: Boolean(phone),
    user_metadata: { appUserId: user.id },
  });

  let authId = created.data.user?.id ?? null;
  if (!authId) {
    const link = await admin.auth.admin.generateLink({ type: "magiclink", email });
    authId = link.data.user?.id ?? null;
    if (!authId) {
      throw new Error(created.error?.message || "Could not create the login.");
    }
  }

  await prisma.user.update({ where: { id: user.id }, data: { authUserId: authId } });
  return authId;
}

/** Open a Supabase session for an email we have already verified ourselves. No email is sent. */
export async function openSupabaseSession(email: string): Promise<void> {
  const admin = getSupabaseAdmin();
  const client = await createSupabaseServerClient();
  if (!admin || !client) throw new Error("Supabase auth is not configured.");

  const link = await admin.auth.admin.generateLink({
    type: "magiclink",
    email: normalizeEmail(email),
  });
  const tokenHash = link.data.properties?.hashed_token;
  if (link.error || !tokenHash) {
    throw new Error(link.error?.message || "Could not start the session.");
  }

  const verified = await client.auth.verifyOtp({
    token_hash: tokenHash,
    type: "magiclink",
  });
  if (verified.error) throw new Error(verified.error.message);
}

export async function signInWithPasswordSession(email: string, password: string): Promise<void> {
  const client = await createSupabaseServerClient();
  if (!client) throw new Error("Supabase auth is not configured.");
  const signed = await client.auth.signInWithPassword({
    email: normalizeEmail(email),
    password,
  });
  if (signed.error) throw new Error(signed.error.message);
}

export async function signInWithGoogleToken(idToken: string): Promise<boolean> {
  const client = await createSupabaseServerClient();
  if (!client) return false;
  const signed = await client.auth.signInWithIdToken({ provider: "google", token: idToken });
  return !signed.error && Boolean(signed.data.session);
}

export async function syncAuthPassword(authUserId: string, password: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase auth is not configured.");
  const updated = await admin.auth.admin.updateUserById(authUserId, { password });
  if (updated.error) throw new Error(updated.error.message);
}

export async function syncAuthContact(
  authUserId: string,
  patch: { email?: string; phone?: string },
): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) throw new Error("Supabase auth is not configured.");
  const updated = await admin.auth.admin.updateUserById(authUserId, {
    ...(patch.email ? { email: normalizeEmail(patch.email), email_confirm: true } : {}),
    ...(patch.phone ? { phone: patch.phone, phone_confirm: true } : {}),
  });
  if (updated.error) throw new Error(updated.error.message);
}

export async function deleteAuthUser(authUserId: string): Promise<void> {
  const admin = getSupabaseAdmin();
  if (!admin) return;
  const removed = await admin.auth.admin.deleteUser(authUserId);
  if (removed.error) throw new Error(removed.error.message);
}
