import { FIRST_GOOGLE_SIGN_IN_MESSAGE } from "@/lib/auto-account";
import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({ error: FIRST_GOOGLE_SIGN_IN_MESSAGE }, { status: 403 });
}
