import { requireAdminUser } from "@/lib/admin";
import {
  addHomePlaceholderUpload,
  publicSrcFromStoredUrl,
} from "@/lib/home-placeholders";
import { extensionForMime, storeGenerationImage } from "@/lib/storage";
import { NextResponse } from "next/server";

const MAX_BYTES = 4 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    await requireAdminUser();
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Forbidden";
    return NextResponse.json(
      { error: msg === "UNAUTHORIZED" ? "Please log in." : "Forbidden" },
      { status: msg === "UNAUTHORIZED" ? 401 : 403 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Upload a JPG, PNG, or WebP." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Choose a photo to upload." }, { status: 400 });
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Use a photo under 4 MB." }, { status: 400 });
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return NextResponse.json({ error: "Use a JPG, PNG, or WebP." }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const stored = await storeGenerationImage(
    "home-placeholders",
    buffer,
    extensionForMime(file.type),
  );
  const src = publicSrcFromStoredUrl(stored);
  if (!src) {
    return NextResponse.json({ error: "The photo could not be saved." }, { status: 500 });
  }
  const images = await addHomePlaceholderUpload(src);
  return NextResponse.json({ ok: true, src, images });
}
