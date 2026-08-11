import { getOpenAIApiKey } from "@/lib/env";
import { NextResponse } from "next/server";

/**
 * Dev helper: confirms the server sees an API key shape (never returns the full key).
 * Disabled in production.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const k = getOpenAIApiKey();
  return NextResponse.json({
    configured: Boolean(k),
    length: k?.length ?? 0,
    startsWithSk: k?.startsWith("sk-") ?? false,
    hint: k
      ? k.startsWith("sk-")
        ? "Key shape looks like an OpenAI API key. If requests fail, create a new key at platform.openai.com and ensure billing is enabled."
        : "Most OpenAI keys start with sk- — double-check you copied the full key from https://platform.openai.com/api-keys"
      : "No OPENAI_API_KEY in env. Set one in .env and restart next dev.",
  });
}
