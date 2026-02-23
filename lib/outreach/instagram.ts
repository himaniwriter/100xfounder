import { ensureOutreachFunnelSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured } from "@/lib/db-config";
import { getInstagramProfileUrl } from "@/lib/marketing/outreach";
import { prisma } from "@/lib/prisma";
import type { InstagramFeedItem } from "@/lib/outreach/types";

const FALLBACK_CARDS = [
  {
    key: "funding-wire",
    caption: "Funding Wire",
    media: "/images/covers/funding-wire.svg",
  },
  {
    key: "ai-ecosystem",
    caption: "AI Ecosystem",
    media: "/images/covers/ai-grid.svg",
  },
  {
    key: "startup-brief",
    caption: "Startup Brief",
    media: "/images/covers/startup-brief.svg",
  },
  {
    key: "talent-radar",
    caption: "Talent Radar",
    media: "/images/covers/talent-map.svg",
  },
  {
    key: "delhi",
    caption: "Delhi Ecosystem",
    media: "/images/cities/delhi.svg",
  },
  {
    key: "bangalore",
    caption: "Bangalore Ecosystem",
    media: "/images/cities/bangalore.svg",
  },
];

export function getFallbackInstagramFeed(limit = 6): InstagramFeedItem[] {
  const profileUrl = getInstagramProfileUrl();
  const now = new Date().toISOString();

  return FALLBACK_CARDS.slice(0, limit).map((item) => ({
    id: item.key,
    external_post_id: item.key,
    caption: item.caption,
    media_url: item.media,
    permalink: profileUrl,
    thumbnail_url: null,
    posted_at: now,
    ingested_at: now,
  }));
}

export async function getInstagramFeed(limit = 6): Promise<InstagramFeedItem[]> {
  const capped = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 30) : 6;

  if (!isDatabaseConfigured()) {
    return getFallbackInstagramFeed(capped);
  }

  try {
    await ensureOutreachFunnelSchema();

    const rows = await prisma.instagramPost.findMany({
      orderBy: [{ postedAt: "desc" }],
      take: capped,
    });

    if (!rows.length) {
      return getFallbackInstagramFeed(capped);
    }

    return rows.map((item) => ({
      id: item.id,
      external_post_id: item.externalPostId,
      caption: item.caption,
      media_url: item.mediaUrl,
      permalink: item.permalink,
      thumbnail_url: item.thumbnailUrl,
      posted_at: item.postedAt.toISOString(),
      ingested_at: item.ingestedAt.toISOString(),
    }));
  } catch {
    return getFallbackInstagramFeed(capped);
  }
}
