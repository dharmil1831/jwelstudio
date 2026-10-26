import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/session";
import { NextResponse } from "next/server";

const MAX_LENGTH = 80;

function cleanText(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;
  if (typeof value !== "string") return null;
  const trimmed = value.replace(/\s+/g, " ").trim().slice(0, MAX_LENGTH);
  return trimmed || null;
}

/** Updates the signed-in user's display name and business name. */
export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ error: "Please sign in first." }, { status: 401 });
  }

  let body: { name?: unknown; businessName?: unknown };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      name: cleanText(body.name),
      businessName: cleanText(body.businessName),
    },
    select: { name: true, businessName: true },
  });

  return NextResponse.json({ ok: true, ...updated });
}
