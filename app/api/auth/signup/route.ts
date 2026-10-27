import { FIRST_PHONE_SIGN_IN_MESSAGE } from "@/lib/auto-account";
import { NextResponse } from "next/server";

/** New accounts start with a phone number and SMS code, not email and password. */
export async function POST() {
  return NextResponse.json({ error: FIRST_PHONE_SIGN_IN_MESSAGE }, { status: 403 });
}
