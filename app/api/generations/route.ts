import { getSessionUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await prisma.generation.findMany({
    where: { userId: user.id, status: "succeeded" },
    orderBy: { createdAt: "desc" },
    take: 48,
    select: {
      id: true,
      resultUrl: true,
      thumbUrl: true,
      placement: true,
      subject: true,
      shot: true,
      scene: true,
      vibe: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ items: rows });
}
