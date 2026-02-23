import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireDashboardSession } from "@/lib/dashboard/api-auth";
import {
  fromDashboardEntityDbValue,
  type DashboardFeedItem,
} from "@/lib/dashboard/types";
import { getAllBlogPosts } from "@/lib/blog/store";
import { getFounderDirectory } from "@/lib/founders/store";
import { ensureDashboardRetentionSchema } from "@/lib/db-bootstrap";
import {
  DATABASE_CONFIG_ERROR,
  isDatabaseConfigured,
  toPublicDatabaseError,
} from "@/lib/db-config";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(40).optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function topicSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function safeIsoDate(value: string | null | undefined): string {
  if (!value) {
    return new Date().toISOString();
  }
  const parsed = Date.parse(value);
  if (Number.isNaN(parsed)) {
    return new Date().toISOString();
  }
  return new Date(parsed).toISOString();
}

function normalizeText(value: string | null | undefined): string {
  return (value ?? "")
    .toLowerCase()
    .trim();
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

  const parsed = querySchema.safeParse({
    limit: request.nextUrl.searchParams.get("limit") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid query params." },
      { status: 400 },
    );
  }

  const limit = parsed.data.limit ?? 15;

  try {
    await ensureDashboardRetentionSchema();

    const watchlist = await prisma.userWatchlistItem.findMany({
      where: { userId: access.session.userId },
      orderBy: { createdAt: "desc" },
      take: 40,
      select: {
        id: true,
        entityType: true,
        entitySlug: true,
        entityName: true,
        createdAt: true,
      },
    });

    if (watchlist.length === 0) {
      return NextResponse.json({ success: true, items: [] }, { status: 200 });
    }

    const [founders, posts] = await Promise.all([
      getFounderDirectory({ limit: 1600, perCountryLimit: 500 }),
      getAllBlogPosts(),
    ]);

    const foundersBySlug = new Map(founders.map((item) => [item.slug, item]));
    const foundersByCompanySlug = new Map(founders.map((item) => [item.companySlug, item]));

    const feed: DashboardFeedItem[] = [];

    watchlist.forEach((watch) => {
      const entityType = fromDashboardEntityDbValue(watch.entityType);

      if (entityType === "founder" || entityType === "company") {
        const founder =
          entityType === "founder"
            ? foundersBySlug.get(watch.entitySlug)
            : foundersByCompanySlug.get(watch.entitySlug);

        if (!founder) {
          return;
        }

        const summaryBits = [
          founder.lastRound
            ? `Last round: ${founder.lastRound.round} ${founder.lastRound.amount}`
            : null,
          founder.isHiring ? "Hiring now" : null,
          founder.country ?? null,
        ].filter(Boolean);

        feed.push({
          id: `signal-${watch.id}-${founder.id}`,
          kind: "signal",
          title:
            entityType === "founder"
              ? `${founder.founderName} • ${founder.companyName}`
              : founder.companyName,
          description:
            summaryBits.join(" • ") ||
            founder.fundingTotalDisplay ||
            founder.fundingInfo ||
            "Tracked company signal",
          href: entityType === "founder" ? `/founders/${founder.slug}` : `/company/${founder.companySlug}`,
          createdAt: safeIsoDate(founder.lastRound?.announcedOn),
          entityType,
          entityName: watch.entityName,
        });
        return;
      }

      const watchedTopic = normalizeText(watch.entitySlug || watch.entityName);
      const topicMatches = posts
        .filter((post) => {
          const postTopic = normalizeText(post.topicSlug || topicSlug(post.category || ""));
          const postCategory = normalizeText(post.category);
          return (
            postTopic === watchedTopic ||
            postCategory === watchedTopic ||
            postTopic.includes(watchedTopic) ||
            watchedTopic.includes(postTopic)
          );
        })
        .slice(0, 3);

      topicMatches.forEach((post) => {
        feed.push({
          id: `news-${watch.id}-${post.slug}`,
          kind: "news",
          title: post.title,
          description: `${post.category} • ${post.readingTime}`,
          href: `/blog/${post.slug}`,
          createdAt: safeIsoDate(post.publishedAt),
          entityType: "topic",
          entityName: watch.entityName,
        });
      });
    });

    const deduped = Array.from(
      new Map(feed.map((item) => [item.id, item])).values(),
    ).sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));

    return NextResponse.json(
      {
        success: true,
        items: deduped.slice(0, limit),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Unable to load dashboard feed."),
      },
      { status: 500 },
    );
  }
}
