import { isOpenAIConfigured } from "@/lib/env";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    provider: "openai",
    openai: isOpenAIConfigured(),
    razorpay: isRazorpayConfigured(),
    time: new Date().toISOString(),
  });
}
