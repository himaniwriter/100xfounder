import type { FounderSpotlight, LaunchProduct } from "@prisma/client";
import { ensureLaunchOutreachSchema } from "@/lib/db-bootstrap";
import { getProductHuntDayWindow } from "@/lib/launch/producthunt";
import { prisma } from "@/lib/prisma";

const DIGEST_SIZE = 5;
const BASE_HASHTAGS = "#startups #producthunt #founders #buildinpublic #indiehackers #saas #100xfounder";

export type DigestPayload = { productIds: string[]; dayLabel: string };
export type SpotlightPayload = { spotlightId: string };

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

function formatDay(dayLabel: string): string {
  const [year, month, day] = dayLabel.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", { month: "long", day: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(year, month - 1, day)),
  );
}

export function buildDigestCaption(products: LaunchProduct[], dayLabel: string): string {
  const lines = products.map((product, index) => `${index + 1}. ${product.name}: ${truncate(product.tagline, 90)}`);
  return [
    `🚀 Top ${products.length} startup launches on Product Hunt, ${formatDay(dayLabel)}`,
    "",
    ...lines,
    "",
    "Which one would you try? Tell us below 👇",
    "",
    "Full list and links: 100xfounder.com/launches (link in bio)",
    "",
    BASE_HASHTAGS,
  ].join("\n");
}

export function buildSpotlightCaption(spotlight: FounderSpotlight & { product: LaunchProduct }): string {
  const handle = spotlight.instagramHandle ? ` (@${spotlight.instagramHandle})` : "";
  const role = spotlight.role ? `, ${spotlight.role}` : "";
  return [
    `✨ Founder spotlight: meet ${spotlight.founderName}${handle}${role} of ${spotlight.product.name}.`,
    "",
    `“${truncate(spotlight.storyOrigin, 280)}”`,
    "",
    `${spotlight.product.name}: ${spotlight.product.tagline}`,
    "",
    "Read the full story on 100xfounder.com/spotlight (link in bio).",
    "Want to be featured? DM us.",
    "",
    `#founderstory ${BASE_HASHTAGS}`,
  ].join("\n");
}

export function digestSlideCount(productCount: number): number {
  return productCount + 2;
}

export const SPOTLIGHT_SLIDE_COUNT = 4;

/** Queues the daily "top launches" carousel for the given Product Hunt day. */
export async function queueDailyDigest(daysAgo = 1) {
  await ensureLaunchOutreachSchema();
  const window = getProductHuntDayWindow(daysAgo);
  const products = await prisma.launchProduct.findMany({
    where: { isPublished: true, launchedAt: { gte: window.start, lt: window.end } },
    orderBy: { votesCount: "desc" },
    take: DIGEST_SIZE,
  });
  if (products.length === 0) {
    return null;
  }

  const payload: DigestPayload = { productIds: products.map((product) => product.id), dayLabel: window.label };
  const data = {
    title: `Top launches, ${formatDay(window.label)}`,
    caption: buildDigestCaption(products, window.label),
    slideCount: digestSlideCount(products.length),
    payload,
  };
  return prisma.instagramQueueItem.upsert({
    where: { refKey: `digest:${window.label}` },
    create: { kind: "daily_digest", refKey: `digest:${window.label}`, ...data },
    // Refresh content, but never reset an item that was already posted.
    update: data,
  });
}

export async function queueSpotlightInstagramPost(spotlight: FounderSpotlight & { product: LaunchProduct }) {
  const payload: SpotlightPayload = { spotlightId: spotlight.id };
  const data = {
    title: `Spotlight: ${spotlight.founderName} (${spotlight.product.name})`,
    caption: buildSpotlightCaption(spotlight),
    slideCount: SPOTLIGHT_SLIDE_COUNT,
    payload,
  };
  return prisma.instagramQueueItem.upsert({
    where: { refKey: `spotlight:${spotlight.id}` },
    create: { kind: "spotlight", refKey: `spotlight:${spotlight.id}`, ...data },
    update: data,
  });
}
