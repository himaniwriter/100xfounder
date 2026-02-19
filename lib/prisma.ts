import { PrismaClient } from "@prisma/client";

declare global {
  var prismaGlobal: PrismaClient | undefined;
}

function resolveDatabaseUrl(rawUrl: string | undefined): string | undefined {
  if (!rawUrl) {
    return rawUrl;
  }

  try {
    const url = new URL(rawUrl);
    const isSupabasePooler = url.hostname.endsWith(".pooler.supabase.com");

    if (!isSupabasePooler) {
      return rawUrl;
    }

    // Supabase pooler on 5432 uses session mode, which can exhaust clients quickly
    // on serverless. Prefer transaction mode with conservative Prisma connection usage.
    if (!url.port || url.port === "5432") {
      url.port = "6543";
    }
    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
    }
    const forcedConnectionLimit = process.env.PRISMA_CONNECTION_LIMIT?.trim();
    if (forcedConnectionLimit) {
      url.searchParams.set("connection_limit", forcedConnectionLimit);
    } else {
      const existingLimitRaw = url.searchParams.get("connection_limit");
      const existingLimit = existingLimitRaw
        ? Number.parseInt(existingLimitRaw, 10)
        : Number.NaN;
      if (!Number.isFinite(existingLimit) || existingLimit < 3) {
        url.searchParams.set("connection_limit", "3");
      }
    }

    const poolTimeout = process.env.PRISMA_POOL_TIMEOUT_SECONDS?.trim();
    if (poolTimeout && !url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", poolTimeout);
    }

    return url.toString();
  } catch {
    return rawUrl;
  }
}

const databaseUrl = resolveDatabaseUrl(process.env.DATABASE_URL);

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: databaseUrl
      ? {
          db: {
            url: databaseUrl,
          },
        }
      : undefined,
    log: process.env.NODE_ENV === "development" ? ["error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalThis.prismaGlobal = prisma;
}
