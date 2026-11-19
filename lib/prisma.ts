import { PrismaClient, Prisma } from "@prisma/client";

const PRISMA_SCHEMA_ID = "user-last-seen-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaId?: string;
};

function allowPoolWait() {
  const raw = process.env.DATABASE_URL;
  if (!raw) return;
  const splitAt = raw.indexOf("?");
  const base = splitAt === -1 ? raw : raw.slice(0, splitAt);
  const params = new URLSearchParams(splitAt === -1 ? "" : raw.slice(splitAt + 1));
  let changed = false;

  const timeout = Number(params.get("pool_timeout") ?? "10");
  if (!Number.isFinite(timeout) || timeout < 20) {
    params.set("pool_timeout", "20");
    changed = true;
  }

  const host = base.toLowerCase();
  const isPooler =
    host.includes("pooler.") ||
    host.includes(":6543") ||
    params.get("pgbouncer") === "true";
  if (isPooler) {
    if (params.get("pgbouncer") !== "true") {
      params.set("pgbouncer", "true");
      changed = true;
    }
    if (params.get("connection_limit") !== "1") {
      params.set("connection_limit", "1");
      changed = true;
    }
  }

  if (!changed) return;
  const query = params.toString();
  process.env.DATABASE_URL = query ? `${base}?${query}` : base;
}

function createPrismaClient() {
  allowPoolWait();
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    transactionOptions: {
      maxWait: 10_000,
      timeout: 20_000,
    },
  });
}

if (
  globalForPrisma.prisma &&
  globalForPrisma.prismaSchemaId !== PRISMA_SCHEMA_ID
) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaId = PRISMA_SCHEMA_ID;
}

export function isPrismaConnectivityError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      error.code === "P1001" ||
      error.code === "P1000" ||
      error.code === "P1017" ||
      error.code === "P2024"
    );
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|P1001|P2024|Timed out fetching a new connection|ECONNREFUSED|ETIMEDOUT|Connection refused|connection pool/i.test(
    msg,
  );
}
