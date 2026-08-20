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

  const modes = new Map<string, string>();
  if (rows.length > 0) {
    try {
      const withMode = await prisma.generation.findMany({
        where: { id: { in: rows.map((r) => r.id) } },
        select: { id: true, mode: true },
      });
      for (const row of withMode) modes.set(row.id, row.mode);
    } catch {
      const withMode = await prisma.$queryRaw<Array<{ id: string; mode: string }>>`
        SELECT id, mode FROM "Generation"
        WHERE "userId" = ${user.id} AND status = 'succeeded'
        ORDER BY "createdAt" DESC
        LIMIT 48
      `;
      for (const row of withMode) modes.set(row.id, row.mode);
    }
  }

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      mode: modes.get(row.id) ?? "model",
    })),
  });
}
