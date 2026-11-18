import { PHONE_SIGN_IN_PAUSED_MESSAGE } from "@/lib/auto-account";
import { NextResponse } from "next/server";

/** Phone SMS sign-in is paused until DLT / MSG91 is ready. */
export async function POST() {
  return NextResponse.json({ error: PHONE_SIGN_IN_PAUSED_MESSAGE }, { status: 503 });
}
