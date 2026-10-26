import { prisma } from "@/lib/prisma";
import { clearSession, getSessionUser } from "@/lib/session";
import { deleteUserFiles } from "@/lib/storage";
import { deleteAuthUser } from "@/lib/supabase-auth";
import { NextResponse } from "next/server";

/**
 * Permanently deletes the signed-in account: generations, saved looks, payments
 * (cascade) and stored files. The free-credit ledger is kept so credits are not re-granted.
 */
export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { confirm?: string };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    body = {};
  }
  if (body.confirm !== "DELETE") {
    return NextResponse.json(
      { error: 'Type DELETE to confirm.' },
      { status: 400 },
    );
  }

  const existing = await prisma.user.findUnique({
    where: { id: user.id },
    select: { authUserId: true },
  });

  try {
    await deleteUserFiles(user.id);
  } catch (e) {
    console.error("[account/delete] file cleanup failed", e);
  }

  await prisma.user.delete({ where: { id: user.id } });
  if (existing?.authUserId) {
    try {
      await deleteAuthUser(existing.authUserId);
    } catch (e) {
      console.error("[account/delete] supabase user cleanup failed", e);
    }
  }
  await clearSession();

  return NextResponse.json({ ok: true });
}
