import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaPool: Pool | undefined;
};

function createPrismaPool() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set.");
  }

  const url = new URL(databaseUrl);
  url.searchParams.delete("channel_binding");
  url.searchParams.delete("sslmode");

  return new Pool({
    connectionString: url.toString(),
    ssl: {
      rejectUnauthorized: false,
    },
  });
}

const prismaPool = globalForPrisma.prismaPool ?? createPrismaPool();
const prismaAdapter = new PrismaPg(prismaPool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: prismaAdapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaPool = prismaPool;
}

export * from "@prisma/client";
