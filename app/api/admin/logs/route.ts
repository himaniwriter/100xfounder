import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { ensureGrowthWaveSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

const querySchema = z.object({
  scope: z.enum(["404", "all"]).optional(),
  limit: z.coerce.number().int().min(1).max(500).optional(),
  path: z.string().trim().max(240).optional(),
});

function getFilters(request: NextRequest) {
  return querySchema.safeParse({
    scope: request.nextUrl.searchParams.get("scope") ?? undefined,
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
    path: request.nextUrl.searchParams.get("path") ?? undefined,
  });
}

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const parsed = getFilters(request);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters." },
      { status: 400 },
    );
  }

  const scope = parsed.data.scope ?? "404";
  const limit = parsed.data.limit ?? 100;
  const pathFilter = parsed.data.path?.trim();

  const whereClause = {
    ...(scope === "404" ? { eventName: "page_not_found" } : {}),
    ...(pathFilter ? { path: { contains: pathFilter, mode: "insensitive" as const } } : {}),
  };

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  try {
    await ensureGrowthWaveSchema();

    const [rows, totalCount, count24h, groupedByEvent] = await Promise.all([
      prisma.siteEvent.findMany({
        where: whereClause,
        orderBy: { createdAt: "desc" },
        take: limit,
        select: {
          id: true,
          eventName: true,
          path: true,
          referrer: true,
          sessionId: true,
          payload: true,
          createdAt: true,
        },
      }),
      prisma.siteEvent.count({ where: whereClause }),
      prisma.siteEvent.count({
        where: {
          ...whereClause,
          createdAt: { gte: since24h },
        },
      }),
      prisma.siteEvent.groupBy({
        by: ["eventName"],
        _count: { _all: true },
        orderBy: {
          _count: { eventName: "desc" },
        },
      }),
    ]);

    const uniquePaths = new Set(rows.map((row) => row.path)).size;

    return NextResponse.json(
      {
        success: true,
        scope,
        summary: {
          total: totalCount,
          last24h: count24h,
          uniquePaths,
          eventsByType: groupedByEvent.map((item) => ({
            eventName: item.eventName,
            count: item._count._all,
          })),
        },
        logs: rows.map((row) => ({
          id: row.id,
          event_name: row.eventName,
          path: row.path,
          referrer: row.referrer,
          session_id: row.sessionId,
          payload: row.payload,
          created_at: row.createdAt.toISOString(),
        })),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to load logs."),
      },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error:
          "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const parsed = getFilters(request);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query parameters." },
      { status: 400 },
    );
  }

  const scope = parsed.data.scope ?? "404";
  const pathFilter = parsed.data.path?.trim();

  const whereClause = {
    ...(scope === "404" ? { eventName: "page_not_found" } : {}),
    ...(pathFilter ? { path: { contains: pathFilter, mode: "insensitive" as const } } : {}),
  };

  try {
    await ensureGrowthWaveSchema();
    const deleted = await prisma.siteEvent.deleteMany({
      where: whereClause,
    });

    return NextResponse.json(
      {
        success: true,
        deletedCount: deleted.count,
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to clear logs."),
      },
      { status: 500 },
    );
  }
}

