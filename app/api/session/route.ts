import { isAdminEmail } from "@/lib/admin";
import { isOpenAIConfigured } from "@/lib/env";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getSessionUser } from "@/lib/session";
import { STARTING_CREDITS } from "@/lib/users";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json({
      authenticated: false,
      generationConfigured: isOpenAIConfigured(),
      razorpayConfigured: isRazorpayConfigured(),
      startingCredits: STARTING_CREDITS,
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
    startingCredits: STARTING_CREDITS,
    generationConfigured: isOpenAIConfigured(),
    razorpayConfigured: isRazorpayConfigured(),
    provider: "openai",
  });
}
