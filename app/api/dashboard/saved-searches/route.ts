import { Prisma } from "@prisma/client";
import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import {
  DASHBOARD_FREE_LIMITS,
  SEARCH_TYPE_VALUES,
  type SavedSearchItem,
} from "@/lib/dashboard/types";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const createSavedSearchSchema = z.object({
  query: z.string().trim().min(2).max(180),
  type: z.enum(SEARCH_TYPE_VALUES).default("all"),
  filtersJson: z.record(z.string(), z.unknown()).nullable().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toSavedSearchResponse(item: {
  id: string;
  query: string;
  searchType: string;
  filtersJson: unknown;
  createdAt: Date;
}): SavedSearchItem {
  return {
    id: item.id,
    query: item.query,
    type: SEARCH_TYPE_VALUES.includes(item.searchType as (typeof SEARCH_TYPE_VALUES)[number])
      ? (item.searchType as SavedSearchItem["type"])
      : "all",
    filtersJson:
      item.filtersJson && typeof item.filtersJson === "object" && !Array.isArray(item.filtersJson)
        ? (item.filtersJson as Record<string, unknown>)
        : null,
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
    const items = await prisma.userSavedSearch.findMany({
      where: { userId: access.session.userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        query: true,
        searchType: true,
        filtersJson: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, items: items.map(toSavedSearchResponse) },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to load saved searches."),
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
  const parsed = createSavedSearchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid saved search payload." },
      { status: 400 },
    );
  }

  try {
    await ensureDashboardRetentionSchema();

    const currentCount = await prisma.userSavedSearch.count({
      where: { userId: access.session.userId },
    });

    if (currentCount >= DASHBOARD_FREE_LIMITS.savedSearches) {
      return NextResponse.json(
        {
          success: false,
          error: `Free plan supports up to ${DASHBOARD_FREE_LIMITS.savedSearches} saved searches.`,
          upgradeRequired: true,
        },
        { status: 403 },
      );
    }

    const created = await prisma.userSavedSearch.create({
      data: {
        userId: access.session.userId,
        query: parsed.data.query.trim(),
        searchType: parsed.data.type,
        ...(parsed.data.filtersJson
          ? { filtersJson: parsed.data.filtersJson as Prisma.InputJsonValue }
          : {}),
      },
      select: {
        id: true,
        query: true,
        searchType: true,
        filtersJson: true,
        createdAt: true,
      },
    });

    return NextResponse.json(
      { success: true, item: toSavedSearchResponse(created) },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof Error && /unique/i.test(error.message)) {
      return NextResponse.json(
        { success: false, error: "This search is already saved." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to save search."),
      },
      { status: 500 },
    );
  }
}
