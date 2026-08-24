import { isAdminEmail } from "@/lib/admin";
import {
  getImageProviderPreference,
  isGeminiConfigured,
  isGenerationConfigured,
  isOpenAIConfigured,
} from "@/lib/env";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import { STARTING_CREDITS } from "@/lib/users";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  const generationConfigured = isGenerationConfigured();
  const preference = getImageProviderPreference();

  const base = {
    generationConfigured,
    razorpayConfigured: isRazorpayConfigured(),
    startingCredits: STARTING_CREDITS,
    providers: {
      openai: isOpenAIConfigured(),
      gemini: isGeminiConfigured(),
      preference,
    },
  };

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      ...base,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: user.email,
      phone: user.phone,
    },
    credits: user.credits,
    isAdmin: isAdminEmail(user.email),
    ...base,
    provider: preference,
  });
}
