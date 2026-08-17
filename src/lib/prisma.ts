import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing. Add it to your .env file.");
}

const adapter = new PrismaPg({
  connectionString: databaseUrl,
});

const SCHEMA_STAMP = "20260817020000"; // bump after prisma generate so dev does not keep a stale client

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaSchemaStamp: string | undefined;
};

if (globalForPrisma.prisma && globalForPrisma.prismaSchemaStamp !== SCHEMA_STAMP) {
  void globalForPrisma.prisma.$disconnect();
  globalForPrisma.prisma = undefined;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaSchemaStamp = SCHEMA_STAMP;
}
