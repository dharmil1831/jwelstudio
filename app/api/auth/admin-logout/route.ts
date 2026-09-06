import { clearAdminSession } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ ok: true });
}
