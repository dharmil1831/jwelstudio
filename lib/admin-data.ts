import { prisma } from "@/lib/prisma";

/** Calendar day in India, YYYY-MM-DD. The admin "today" uses this, not the server clock. */
export function todayInIndia(): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

/** Midnight-to-midnight IST for a YYYY-MM-DD date. */
export function indiaDayRange(
  date: string,
): { start: Date; end: Date } | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const start = new Date(`${date}T00:00:00+05:30`);
  if (Number.isNaN(start.getTime())) return null;
  return { start, end: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
}

export async function getAdminStats() {
  const startOfDay = indiaDayRange(todayInIndia())!.start;

  const [
    userCount,
    generationCount,
    generationsToday,
    paidPayments,
    revenue,
    creditsSum,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.generation.count(),
    prisma.generation.count({
      where: { createdAt: { gte: startOfDay } },
    }),
    prisma.payment.count({ where: { status: "paid" } }),
    prisma.payment.aggregate({
      where: { status: "paid" },
      _sum: { amountPaise: true },
    }),
    prisma.user.aggregate({ _sum: { credits: true } }),
  ]);

  return {
    userCount,
    generationCount,
    generationsToday,
    paidPayments,
    revenuePaise: revenue._sum.amountPaise ?? 0,
    creditsInCirculation: creditsSum._sum.credits ?? 0,
  };
}

export async function listAdminUsers(limit = 100) {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      email: true,
      phone: true,
      credits: true,
      plan: true,
      emailVerifiedAt: true,
      phoneVerifiedAt: true,
      createdAt: true,
      _count: { select: { generations: true, payments: true } },
    },
  });
}

export async function listAdminPayments(limit = 100) {
  return prisma.payment.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true, phone: true } },
    },
  });
}

const ACTIVE_WINDOW_MS = 15 * 60 * 1000;

export async function listActiveUsers() {
  const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);
  const [activeNow, recent] = await Promise.all([
    prisma.user.count({ where: { lastSeenAt: { gte: activeSince } } }),
    prisma.user.findMany({
      where: { lastSeenAt: { not: null } },
      orderBy: { lastSeenAt: "desc" },
      take: 25,
      select: {
        id: true,
        email: true,
        phone: true,
        plan: true,
        credits: true,
        lastSeenAt: true,
        lastLoginAt: true,
      },
    }),
  ]);

  return {
    activeNow,
    activeSince,
    recent: recent.map((user) => ({
      ...user,
      active: user.lastSeenAt !== null && user.lastSeenAt >= activeSince,
    })),
  };
}

export async function listAdminGenerations(limit = 50) {
  return prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true } },
    },
  });
}

export async function adminGenerationsByDay(emailQuery: string) {
  const email = emailQuery.trim();
  const rows = await prisma.generation.findMany({
    where: email
      ? { user: { email: { contains: email, mode: "insensitive" } } }
      : {},
    select: {
      createdAt: true,
      mode: true,
      user: { select: { email: true, phone: true } },
    },
  });

  const dayKey = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const days = new Map<
    string,
    {
      day: string;
      email: string;
      phone: string | null;
      count: number;
      model: number;
      background: number;
      video: number;
    }
  >();

  for (const row of rows) {
    const day = dayKey.format(row.createdAt);
    const key = `${day}\n${row.user.email}`;
    const bucket = days.get(key) ?? {
      day,
      email: row.user.email,
      phone: row.user.phone,
      count: 0,
      model: 0,
      background: 0,
      video: 0,
    };
    bucket.count += 1;
    if (row.mode === "background") bucket.background += 1;
    else if (row.mode === "video") bucket.video += 1;
    else bucket.model += 1;
    days.set(key, bucket);
  }

  return [...days.values()].sort((a, b) => {
    if (a.day !== b.day) return a.day < b.day ? 1 : -1;
    return b.count - a.count;
  });
}

export async function adminGenerationsForDay(date: string, emailQuery: string) {
  const range = indiaDayRange(date);
  if (!range) return null;

  const email = emailQuery.trim();
  const where = {
    createdAt: { gte: range.start, lt: range.end },
    ...(email
      ? { user: { email: { contains: email, mode: "insensitive" as const } } }
      : {}),
  };

  const [count, byMode, byUser, generations] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.groupBy({
      by: ["mode"],
      where,
      _count: { _all: true },
    }),
    prisma.generation.groupBy({
      by: ["userId"],
      where,
      _count: { _all: true },
    }),
    prisma.generation.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { user: { select: { email: true } } },
    }),
  ]);

  const users = await prisma.user.findMany({
    where: { id: { in: byUser.map((row) => row.userId) } },
    select: { id: true, email: true },
  });
  const emailById = new Map(users.map((user) => [user.id, user.email]));

  return {
    count,
    byMode: byMode
      .map((row) => ({ mode: row.mode, count: row._count._all }))
      .sort((a, b) => b.count - a.count),
    byUser: byUser
      .map((row) => ({
        email: emailById.get(row.userId) ?? "Unknown account",
        count: row._count._all,
      }))
      .sort((a, b) => b.count - a.count),
    generations,
  };
}
