import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<void>;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export function ensureDatabase() {
  globalForPrisma.prismaReady ??= prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "Profile" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "studentName" TEXT NOT NULL,
      "data" JSONB NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS "Generation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "profileId" TEXT NOT NULL,
      "type" TEXT NOT NULL,
      "targetName" TEXT NOT NULL,
      "input" JSONB NOT NULL,
      "content" TEXT NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Generation_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );

    CREATE INDEX IF NOT EXISTS "Generation_profileId_idx" ON "Generation"("profileId");
  `).then(() => undefined);

  return globalForPrisma.prismaReady;
}
