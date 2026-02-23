import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import {
  DASHBOARD_FREE_LIMITS,
  fromDashboardEntityDbValue,
  toDashboardEntityDbValue,
  type WatchlistItem,
} from "@/lib/dashboard/types";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const createWatchlistSchema = z.object({
  entityType: z.enum(["founder", "company", "topic"]),
  entitySlug: z
    .string()
    .trim()
    .min(2)
    .max(160)
    .regex(/^[a-z0-9-]+$/i, "entitySlug must be URL-safe."),
  entityName: z.string().trim().min(2).max(180),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toWatchlistResponse(item: {
  id: string;
  entityType: "FOUNDER" | "COMPANY" | "TOPIC";
  entitySlug: string;
  entityName: string;
  createdAt: Date;
}): WatchlistItem {
  return {
    id: item.id,
    entityType: fromDashboardEntityDbValue(item.entityType),
    entitySlug: item.entitySlug,
    entityName: item.entityName,
    createdAt: item.createdAt.toISOString(),
  };
}

export async function GET(request: NextRequest) {
  const access = await requireDashboardSession(request);
  if ("error" in access) {
    return access.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: DATABASE_CONFIG_ERROR },
      { status: 503 },
    );
  }

  try {
    await ensureDashboardRetentionSchema();
    const items = await prisma.userWatchlistItem.findMany({
      where: { userId: access.session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        entityType: true,
        entitySlug: true,
        entityName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, items: items.map(toWatchlistResponse) },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to load watchlist."),
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const access = await requireDashboardSession(request);
  if ("error" in access) {
    return access.error;
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { success: false, error: DATABASE_CONFIG_ERROR },
      { status: 503 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = createWatchlistSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid watchlist payload." },
      { status: 400 },
    );
  }

  try {
    await ensureDashboardRetentionSchema();

    const currentCount = await prisma.userWatchlistItem.count({
      where: { userId: access.session.userId },
    });

    if (currentCount >= DASHBOARD_FREE_LIMITS.watchlistItems) {
      return NextResponse.json(
        {
          success: false,
          error: `Free plan supports up to ${DASHBOARD_FREE_LIMITS.watchlistItems} tracked entities.`,
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const entityType = toDashboardEntityDbValue(parsed.data.entityType);
    const existing = await prisma.userWatchlistItem.findUnique({
      where: {
        userId_entityType_entitySlug: {
          userId: access.session.userId,
          entityType,
          entitySlug: parsed.data.entitySlug.trim().toLowerCase(),
        },
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "This item is already in your watchlist." },
        { status: 409 },
      );
    }

    const created = await prisma.userWatchlistItem.create({
      data: {
        userId: access.session.userId,
        entityType,
        entitySlug: parsed.data.entitySlug.trim().toLowerCase(),
        entityName: parsed.data.entityName.trim(),
      },
      select: {
        id: true,
        entityType: true,
        entitySlug: true,
        entityName: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, item: toWatchlistResponse(created) },
      { status: 201 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to save watchlist item."),
      },
      { status: 500 },
    );
  }
}
