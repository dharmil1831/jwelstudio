import { requireAdminUser } from "@/lib/admin";
import {
  getHomePlaceholders,
  saveHomePlaceholders,
  type HomePlaceholderSelection,
} from "@/lib/home-placeholders";
import { NextResponse } from "next/server";

function forbidden(error: unknown) {
  const msg = error instanceof Error ? error.message : "Forbidden";
  return NextResponse.json(
    { error: msg === "UNAUTHORIZED" ? "Please log in." : "Forbidden" },
    { status: msg === "UNAUTHORIZED" ? 401 : 403 },
  );
}

export async function GET() {
  try {
    await requireAdminUser();
  } catch (error) {
    return forbidden(error);
  }
  const images = await getHomePlaceholders();
  return NextResponse.json({ images });
}

export async function PATCH(req: Request) {
  try {
    await requireAdminUser();
  } catch (error) {
    return forbidden(error);
  }

  let body: Partial<HomePlaceholderSelection>;
  try {
    body = (await req.json()) as Partial<HomePlaceholderSelection>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const images = await saveHomePlaceholders({
    hero: Array.isArray(body.hero) ? body.hero.filter((v) => typeof v === "string") : [],
    gallery: Array.isArray(body.gallery) ? body.gallery.filter((v) => typeof v === "string") : [],
    before: typeof body.before === "string" ? body.before : "",
    after: typeof body.after === "string" ? body.after : "",
    stepUpload: typeof body.stepUpload === "string" ? body.stepUpload : "",
    stepModel: typeof body.stepModel === "string" ? body.stepModel : "",
    stepBackdrop: typeof body.stepBackdrop === "string" ? body.stepBackdrop : "",
    stepDownload: typeof body.stepDownload === "string" ? body.stepDownload : "",
  });
  return NextResponse.json({ ok: true, images });
}
