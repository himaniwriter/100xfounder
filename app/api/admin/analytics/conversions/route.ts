import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";
import {
  ensureFeaturedFounderSchema,
  ensureGrowthWaveSchema,
} from "@/lib/db-bootstrap";

const querySchema = z.object({
  range: z.enum(["7d", "30d"]).optional(),
});

type DailySeriesPoint = {
  date: string;
  getFeaturedSubmits: number;
  pricingWaitlistSubmits: number;
  searchSubmits: number;
};

function startDateFromRange(range: "7d" | "30d"): Date {
  const days = range === "7d" ? 7 : 30;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - (days - 1));
  return date;
}

function dayKey(value: Date): string {
  return value.toISOString().slice(0, 10);
}

function buildDayBuckets(startDate: Date, endDate: Date): Map<string, DailySeriesPoint> {
  const map = new Map<string, DailySeriesPoint>();
  const cursor = new Date(startDate);

  while (cursor <= endDate) {
    const key = dayKey(cursor);
    map.set(key, {
      date: key,
      getFeaturedSubmits: 0,
      pricingWaitlistSubmits: 0,
      searchSubmits: 0,
    });
    cursor.setDate(cursor.getDate() + 1);
  }

  return map;
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
        error: "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const parsed = querySchema.safeParse({
    range: request.nextUrl.searchParams.get("range") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid range query parameter." },
      { status: 400 },
    );
  }

  const range = parsed.data.range ?? "7d";
  const startDate = startDateFromRange(range);
  const endDate = new Date();

  try {
    await Promise.all([
      ensureFeaturedFounderSchema(),
      ensureGrowthWaveSchema(),
    ]);

    const [events, featuredRows, pricingRows] = await Promise.all([
      prisma.siteEvent.findMany({
        where: { createdAt: { gte: startDate } },
        select: {
          eventName: true,
          path: true,
          payload: true,
          createdAt: true,
        },
      }),
      prisma.featuredFounderRequest.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
      prisma.pricingWaitlistRequest.findMany({
        where: { createdAt: { gte: startDate } },
        select: { createdAt: true },
      }),
    ]);

    const ctaClicks = events.filter((item) => item.eventName === "cta_click");
    const searchSubmitEvents = events.filter((item) => item.eventName === "search_submit");

    const featuredStarts = ctaClicks.filter((item) => {
      if (item.path === "/get-featured") {
        return true;
      }

      if (typeof item.payload === "object" && item.payload && !Array.isArray(item.payload)) {
        const payload = item.payload as Record<string, unknown>;
        return payload.cta_target === "/get-featured";
      }

      return false;
    }).length;

    const startsByPath = new Map<string, number>();
    const conversionsByPath = new Map<string, number>();

    ctaClicks.forEach((item) => {
      startsByPath.set(item.path, (startsByPath.get(item.path) ?? 0) + 1);
    });

    events
      .filter(
        (item) =>
          item.eventName === "featured_form_submit" ||
          item.eventName === "pricing_waitlist_submit" ||
          item.eventName === "search_submit",
      )
      .forEach((item) => {
        conversionsByPath.set(item.path, (conversionsByPath.get(item.path) ?? 0) + 1);
      });

    const topLandingPages = Array.from(startsByPath.entries())
      .map(([path, starts]) => {
        const conversions = conversionsByPath.get(path) ?? 0;
        const conversionRate = starts > 0 ? Number(((conversions / starts) * 100).toFixed(2)) : 0;
        return {
          path,
          starts,
          conversions,
          conversionRate,
        };
      })
      .sort((a, b) => (b.conversionRate !== a.conversionRate ? b.conversionRate - a.conversionRate : b.starts - a.starts))
      .slice(0, 10);

    const dayBuckets = buildDayBuckets(startDate, endDate);

    featuredRows.forEach((item) => {
      const key = dayKey(item.createdAt);
      const bucket = dayBuckets.get(key);
      if (bucket) {
        bucket.getFeaturedSubmits += 1;
      }
    });

    pricingRows.forEach((item) => {
      const key = dayKey(item.createdAt);
      const bucket = dayBuckets.get(key);
      if (bucket) {
        bucket.pricingWaitlistSubmits += 1;
      }
    });

    searchSubmitEvents.forEach((item) => {
      const key = dayKey(item.createdAt);
      const bucket = dayBuckets.get(key);
      if (bucket) {
        bucket.searchSubmits += 1;
      }
    });

    return NextResponse.json(
      {
        success: true,
        metrics: {
          getFeaturedStarts: featuredStarts,
          getFeaturedSubmits: featuredRows.length,
          pricingWaitlistSubmits: pricingRows.length,
          searchSubmits: searchSubmitEvents.length,
        },
        topLandingPages,
        dailySeries: Array.from(dayBuckets.values()),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to load analytics."),
      },
      { status: 500 },
    );
  }
}
