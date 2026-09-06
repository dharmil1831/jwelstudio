import { requireAdminUser } from "@/lib/admin";
import { getAppSettings, setAppSettings } from "@/lib/app-settings";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    await requireAdminUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json(
      { error: msg === "UNAUTHORIZED" ? "Please log in." : "Forbidden" },
      { status: msg === "UNAUTHORIZED" ? 401 : 403 },
    );
  }

  const settings = await getAppSettings();
  return NextResponse.json({ settings });
}

export async function PATCH(req: Request) {
  try {
    await requireAdminUser();
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Forbidden";
    return NextResponse.json(
      { error: msg === "UNAUTHORIZED" ? "Please log in." : "Forbidden" },
      { status: msg === "UNAUTHORIZED" ? 401 : 403 },
    );
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const partial: Parameters<typeof setAppSettings>[0] = {};
  if (typeof body.loginTutorialVideoUrl === "string") {
    partial.loginTutorialVideoUrl = body.loginTutorialVideoUrl.trim().slice(0, 500);
  }
  for (const key of [
    "featureVideoEnabled",
    "featureSelfieEnabled",
    "featureCustomPromptEnabled",
    "featureBrandEnabled",
    "featurePublicShareEnabled",
    "smsEnabled",
  ] as const) {
    if (typeof body[key] === "boolean") {
      partial[key] = body[key] as boolean;
    }
  }

  const settings = await setAppSettings(partial);
  return NextResponse.json({ ok: true, settings });
}
