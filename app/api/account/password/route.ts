import { hashPassword, validatePasswordStrength } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { ensureAuthUser, syncAuthPassword } from "@/lib/supabase-auth";
import { NextResponse } from "next/server";

/** Sets the password used the next time this account signs in with email. */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { password?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const password = body.password ?? "";
  const passwordError = validatePasswordStrength(password);
  if (passwordError) {
    return NextResponse.json({ error: passwordError }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(password) },
  });

  try {
    const authUserId = await ensureAuthUser(user.id);
    if (authUserId) await syncAuthPassword(authUserId, password);
  } catch (error) {
    console.error("[account] password sync failed", error);
  }

  return NextResponse.json({ ok: true });
}
