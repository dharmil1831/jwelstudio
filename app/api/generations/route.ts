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

  const extras = new Map<string, { mode: string; format: string }>();
  if (rows.length > 0) {
    try {
      const withExtras = await prisma.generation.findMany({
        where: { id: { in: rows.map((r) => r.id) } },
        select: { id: true, mode: true, format: true },
      });
      for (const row of withExtras) {
        extras.set(row.id, { mode: row.mode, format: row.format });
      }
    } catch {
      const withExtras = await prisma.$queryRaw<
        Array<{ id: string; mode: string; format: string | null }>
      >`
        SELECT id, mode, format FROM "Generation"
        WHERE "userId" = ${user.id} AND status = 'succeeded'
        ORDER BY "createdAt" DESC
        LIMIT 48
      `;
      for (const row of withExtras) {
        extras.set(row.id, {
          mode: row.mode,
          format: row.format ?? "square",
        });
      }
    }
  }

  return NextResponse.json({
    items: rows.map((row) => ({
      ...row,
      mode: extras.get(row.id)?.mode ?? "model",
      format: extras.get(row.id)?.format ?? "square",
    })),
  });
}
