import { hasAdminSession } from "@/lib/admin";
import {
  getImageProviderPreference,
  isGeminiConfigured,
  isGenerationConfigured,
  isOpenAIConfigured,
} from "@/lib/env";
import { featuresForPlan } from "@/lib/entitlements";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import { STARTING_CREDITS } from "@/lib/users";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  const isAdmin = await hasAdminSession();
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
      isAdmin,
      ...base,
    });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      email: user.email,
      phone: user.phone,
      plan: user.plan,
    },
    credits: user.credits,
    plan: user.plan,
    features: featuresForPlan(user.plan),
    isAdmin,
    ...base,
    provider: preference,
  });
}
