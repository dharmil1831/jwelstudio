import { findOrCreateVerifiedAccount, SuperAdminSignInError } from "@/lib/auto-account";
import { prisma } from "@/lib/prisma";
import { setSession } from "@/lib/session";
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

/** Continue with Google: verifies a Google ID token (web or Android) and signs in. */
export async function POST(req: Request) {
  let body: { idToken?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const idToken = body.idToken?.trim();
  if (!idToken) {
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
    const ticket = await client.verifyIdToken({ idToken, audience });
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
  } catch {
    return NextResponse.json(
      { error: "Google sign-in failed. Please try again." },
      { status: 401 },
    );
  }

  try {
    const user = await findOrCreateVerifiedAccount({ kind: "email", email });
    await prisma.user.updateMany({
      where: { id: user.id, googleVerifiedAt: null },
      data: { googleVerifiedAt: new Date() },
    });
    await setSession(user.id, user.email);
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
