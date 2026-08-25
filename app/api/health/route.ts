import {
  getImageProviderPreference,
  isGeminiConfigured,
  isGenerationConfigured,
  isOpenAIConfigured,
} from "@/lib/env";
import { isPrismaConnectivityError, prisma } from "@/lib/prisma";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { NextResponse } from "next/server";

export async function GET() {
  let database: "ok" | "error" = "ok";
  let databaseError: string | undefined;

  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (error) {
    database = "error";
    databaseError = isPrismaConnectivityError(error)
      ? "unreachable"
      : "query_failed";
  }

  return NextResponse.json({
    ok: database === "ok",
    database,
    ...(databaseError ? { databaseError } : {}),
    generationConfigured: isGenerationConfigured(),
    preference: getImageProviderPreference(),
    openai: isOpenAIConfigured(),
    gemini: isGeminiConfigured(),
    razorpay: isRazorpayConfigured(),
    time: new Date().toISOString(),
  });
}
