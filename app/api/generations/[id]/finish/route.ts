import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { storeGenerationVideo } from "@/lib/storage";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

export const maxDuration = 60;

/** Save the finished studio video (lid and shop mark) so the gallery plays that file. */
export async function POST(req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please log in." }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = await prisma.generation.findFirst({
    where: { id, userId: user.id, mode: "video", status: "succeeded" },
    select: { id: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof Blob) || file.size < 2000 || file.size > 18_000_000) {
    return NextResponse.json({ error: "Could not save the video." }, { status: 400 });
  }

  const type = file.type || "video/mp4";
  const ext = type.includes("webm") ? "webm" : "mp4";
  const buffer = Buffer.from(await file.arrayBuffer());
  const resultUrl = await storeGenerationVideo(user.id, buffer, ext, "unbox-");
  await prisma.generation.update({
    where: { id },
    data: { resultUrl },
  });

  return NextResponse.json({ resultUrl, mimeType: ext === "webm" ? "video/webm" : "video/mp4" });
}
