import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

export const SELECTION_LABELS: Record<string, string> = {
  product_of_the_day: "#1 of the day",
  top_featured: "Top 5 of the day",
  top_votes: "Top 10 by votes",
  vote_threshold: "100+ upvotes",
};

export async function listRecentLaunches(limit = 60) {
  if (!isDatabaseConfigured()) {
    return [];
  }
  try {
    await ensureLaunchOutreachSchema();
    return await prisma.launchProduct.findMany({
      where: { isPublished: true },
      orderBy: [{ launchedAt: "desc" }, { votesCount: "desc" }],
      take: limit,
      include: { spotlights: { where: { status: "published" }, select: { slug: true }, take: 1 } },
    });
  } catch {
    return [];
  }
}

export async function getLaunchBySlug(slug: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    await ensureLaunchOutreachSchema();
    return await prisma.launchProduct.findFirst({
      where: { slug, isPublished: true },
      include: { spotlights: { where: { status: "published" }, take: 1 } },
    });
  } catch {
    return null;
  }
}

export async function listPublishedSpotlights(limit = 48) {
  if (!isDatabaseConfigured()) {
    return [];
  }
  try {
    await ensureLaunchOutreachSchema();
    return await prisma.founderSpotlight.findMany({
      where: { status: "published", consentWebsite: true },
      orderBy: { publishedAt: "desc" },
      take: limit,
      include: { product: true },
    });
  } catch {
    return [];
  }
}

export async function getSpotlightBySlug(slug: string) {
  if (!isDatabaseConfigured()) {
    return null;
  }
  try {
    await ensureLaunchOutreachSchema();
    return await prisma.founderSpotlight.findFirst({
      where: { slug, status: "published", consentWebsite: true },
      include: { product: true },
    });
  } catch {
    return null;
  }
}

export function formatLaunchDay(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}
