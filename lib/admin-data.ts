import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

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

export async function listAdminGenerations(limit = 50) {
  return prisma.generation.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: { select: { email: true } },
    },
  });
}
