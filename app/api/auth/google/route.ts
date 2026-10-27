import {
  findExistingVerifiedAccount,
  FIRST_PHONE_SIGN_IN_MESSAGE,
  SuperAdminSignInError,
} from "@/lib/auto-account";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
import { ensureAuthUser, signInWithGoogleToken } from "@/lib/supabase-auth";
import { OAuth2Client } from "google-auth-library";
import { NextResponse } from "next/server";

const client = new OAuth2Client();

function allowedAudiences(): string[] {
  return [
    process.env.GOOGLE_WEB_CLIENT_ID,
    process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID,
    process.env.GOOGLE_ANDROID_CLIENT_ID,
  ].filter((v): v is string => Boolean(v?.trim()));
}

async function emailFromAccessToken(accessToken: string): Promise<string | null> {
  const audience = allowedAudiences();
  const res = await fetch("https://oauth2.googleapis.com/tokeninfo", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ access_token: accessToken }),
  });
  if (!res.ok) return null;
  const info = (await res.json()) as {
    aud?: string;
    azp?: string;
    email?: string;
    email_verified?: string | boolean;
  };
  const clientId = info.aud || info.azp || "";
  const verified = info.email_verified === true || info.email_verified === "true";
  if (!info.email || !verified || !audience.includes(clientId)) return null;
  return info.email;
}

/** Continue with Google: verifies a Google token (web popup or Android) and signs in. */
export async function POST(req: Request) {
  let body: { idToken?: string; accessToken?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idToken = body.idToken?.trim();
  const accessToken = body.accessToken?.trim();
  if (!idToken && !accessToken) {
    return NextResponse.json({ error: "Missing Google token." }, { status: 400 });
  }

  const audience = allowedAudiences();
  if (audience.length === 0) {
    return NextResponse.json(
      { error: "Google sign-in is not configured yet." },
      { status: 503 },
    );
  }

  let email: string;
  try {
    if (accessToken) {
      const fromAccess = await emailFromAccessToken(accessToken);
      if (!fromAccess) {
        return NextResponse.json(
          { error: "Google sign-in failed. Please try again." },
          { status: 401 },
        );
      }
      email = fromAccess;
    } else {
      const ticket = await client.verifyIdToken({ idToken: idToken!, audience });
      const payload = ticket.getPayload();
      if (
        !payload?.email ||
        !payload.email_verified ||
        (payload.iss !== "accounts.google.com" &&
          payload.iss !== "https://accounts.google.com")
      ) {
        return NextResponse.json(
          { error: "Google account email is not verified." },
          { status: 401 },
        );
      }
      email = payload.email;
    }
  } catch {
    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 401 },
    );
  }

  try {
    const user = await findExistingVerifiedAccount({ kind: "email", email });
    if (!user) {
      return NextResponse.json({ error: FIRST_PHONE_SIGN_IN_MESSAGE }, { status: 403 });
    }
    await ensureAuthUser(user.id);
    await prisma.user.updateMany({
      where: { id: user.id, googleVerifiedAt: null },
      data: { googleVerifiedAt: new Date() },
    });
    const linked = idToken ? await signInWithGoogleToken(idToken) : false;
    if (!linked) await setSession(user.id, user.email);
    return NextResponse.json({
      ok: true,
      created: user.created,
      user: { email: user.email, phone: user.phone, credits: user.credits },
    });
  } catch (e) {
    if (e instanceof SuperAdminSignInError) {
      return NextResponse.json(
        { error: "Super admin must sign in at /admin/login." },
        { status: 403 },
      );
    }
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sign-in failed" },
      { status: 400 },
    );
  }
}
