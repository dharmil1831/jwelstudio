import { fallbackFestivals, listFestivals } from "@/lib/google-festivals";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const festivals = await listFestivals();
    return NextResponse.json({ festivals });
  } catch (err) {
    console.error("[festivals]", err instanceof Error ? err.message : err);
    return NextResponse.json({ festivals: fallbackFestivals() });
  }
}
