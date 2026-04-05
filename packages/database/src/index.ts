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

function createPrismaClient() {
  const pool = globalForPrisma.prismaPool ?? createPrismaPool();
  const adapter = new PrismaPg(pool);

  const client = new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = client;
    globalForPrisma.prismaPool = pool;
  }

  return client;
}

let _prisma: PrismaClient | undefined;

export const prisma = new Proxy({} as PrismaClient, {
  get(_target, prop) {
    if (!_prisma) {
      _prisma = globalForPrisma.prisma ?? createPrismaClient();
    }
    return (_prisma as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export * from "@prisma/client";
