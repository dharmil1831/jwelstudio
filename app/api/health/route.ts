import {
  getImageProviderPreference,
  isGeminiConfigured,
  isGenerationConfigured,
  isOpenAIConfigured,
} from "@/lib/env";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    generationConfigured: isGenerationConfigured(),
    preference: getImageProviderPreference(),
    openai: isOpenAIConfigured(),
    gemini: isGeminiConfigured(),
    razorpay: isRazorpayConfigured(),
    time: new Date().toISOString(),
  });
}
