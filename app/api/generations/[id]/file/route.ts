import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";

type Ctx = { params: Promise<{ id: string }> };

function extensionFor(url: string, contentType: string): string {
  const fromUrl = /\.(png|jpe?g|webp|mp4|webm)(?:\?|$)/i.exec(url)?.[1]?.toLowerCase();
  if (fromUrl === "jpeg") return "jpg";
  if (fromUrl) return fromUrl;
  const type = contentType.toLowerCase();
  if (type.includes("png")) return "png";
  if (type.includes("webp")) return "webp";
  if (type.includes("mp4")) return "mp4";
  if (type.includes("webm")) return "webm";
  return "jpg";
}

/** Same-origin file so mobile browsers and the review app can save gallery images. */
export async function GET(_req: Request, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = await prisma.generation.findFirst({
    where: { id, userId: user.id, status: "succeeded" },
    select: { resultUrl: true },
  });
  if (!row?.resultUrl) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const upstream = await fetch(row.resultUrl);
  if (!upstream.ok) {
    return NextResponse.json({ error: "Could not fetch file" }, { status: 502 });
  }

  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  const ext = extensionFor(row.resultUrl, contentType);
  const filename = `jwelpixel-${id}.${ext}`;

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": contentType.split(";")[0] || "application/octet-stream",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
