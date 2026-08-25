import { PrismaClient, Prisma } from "@prisma/client";

/** Bump when Generation fields change or to force a fresh PrismaClient after DB outages. */
const PRISMA_SCHEMA_ID = "generation-format-v2-connect-timeout";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaId?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    // Fail faster on unreachable hosts instead of hanging the request forever.
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

/** True when Prisma could not reach Postgres (paused project, network, bad URL). */
export function isPrismaConnectivityError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientInitializationError) return true;
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    // P1001 can't reach, P1000 auth, P1017 server closed connection
    return error.code === "P1001" || error.code === "P1000" || error.code === "P1017";
  }
  const msg = error instanceof Error ? error.message : String(error);
  return /Can't reach database server|P1001|ECONNREFUSED|ETIMEDOUT|Connection refused/i.test(
    msg,
  );
}
