import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** The signed-in user id, used as the store purchase account. */
export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in first." }, { status: 401 });
  }
  return NextResponse.json(
    { userId: user.id },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
