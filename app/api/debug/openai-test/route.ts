import { getOpenAIApiKey } from "@/lib/env";
import { NextResponse } from "next/server";

/**
 * Calls OpenAI's models list endpoint with your key.
 * If this fails with 401, the key is wrong — not your app code.
 * Dev only.
 */
export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const key = getOpenAIApiKey();
  if (!key) {
    return NextResponse.json({
      ok: false,
      step: "missing_env",
      message:
        "Set OPENAI_API_KEY in .env and restart the dev server.",
    });
  }

  let res: Response;
  try {
    res = await fetch("https://api.openai.com/v1/models", {
      method: "GET",
      headers: { Authorization: `Bearer ${key}` },
      cache: "no-store",
    });
  } catch (e) {
    return NextResponse.json({
      ok: false,
      step: "network",
      message: e instanceof Error ? e.message : "Fetch failed",
    });
  }

  const bodyText = await res.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(bodyText) as { error?: { message?: string } };
  } catch {
    parsed = null;
  }

  const apiErr =
    parsed &&
    typeof parsed === "object" &&
    "error" in parsed &&
    parsed.error &&
    typeof parsed.error === "object"
      ? (parsed.error as { message?: string })
      : null;

  return NextResponse.json({
    ok: res.ok,
    httpStatus: res.status,
    openai: res.ok
      ? "API key is valid for api.openai.com (list models succeeded)."
      : apiErr?.message ?? bodyText.slice(0, 300),
    fix: res.ok
      ? null
      : [
          "Create a new key at https://platform.openai.com/api-keys",
          "Ensure billing is enabled on your OpenAI account",
          "Ensure .env has no spaces: OPENAI_API_KEY=sk-... (one line, restart npm run dev)",
        ],
  });
}
