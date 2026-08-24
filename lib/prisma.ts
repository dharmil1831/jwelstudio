import { PrismaClient } from "@prisma/client";

/** Bump when Generation fields change so the cached PrismaClient is rebuilt. */
const PRISMA_SCHEMA_ID = "generation-format-v1";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaSchemaId?: string;
};

function createPrismaClient() {
  return new PrismaClient({
    log:
      process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
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
