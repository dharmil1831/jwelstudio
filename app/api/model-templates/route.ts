import { listActiveModelTemplates } from "@/lib/model-templates";
import { NextResponse } from "next/server";

export async function GET() {
  const templates = await listActiveModelTemplates();
  return NextResponse.json(
    { templates },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=60" } },
  );
}
