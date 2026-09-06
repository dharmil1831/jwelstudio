import {
  clearAdminSession,
  isSuperAdminEmail,
  setAdminSession,
} from "@/lib/admin";
import { normalizeEmail } from "@/lib/auth-utils";
import { setSession } from "@/lib/session";
import { verifyUserPassword } from "@/lib/users";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email and password are required." },
      { status: 400 },
    );
  }

  if (!isSuperAdminEmail(email)) {
    return NextResponse.json(
      { error: "This account is not the super admin." },
      { status: 403 },
    );
  }

  try {
    const user = await verifyUserPassword(email, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 },
      );
    }

    await setAdminSession(user.id, normalizeEmail(user.email));
    await setSession(user.id, normalizeEmail(user.email));

    return NextResponse.json({
      ok: true,
      user: { email: user.email },
    });
  } catch (e) {
    await clearAdminSession();
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Login failed" },
      { status: 400 },
    );
  }
}
