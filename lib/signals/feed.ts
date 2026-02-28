import { unstable_cache } from "next/cache";
import { getFounderDirectory, getFounderDirectoryLastUpdatedAt } from "@/lib/founders/store";

export type SignalFeedItem = {
  id: string;
  companyName: string;
  avatarUrl: string | null;
  founderName: string;
  companySlug: string;
  founderSlug: string;
  industry: string;
  stage: string;
  country: string;
  fundingTotal: string;
  lastRound: string;
  isHiring: boolean;
  hiringRoles: string[];
};

type SignalFeedResult = {
  updatedAt: string;
  items: SignalFeedItem[];
};

const MAX_FEED_ITEMS = 100;

const getCachedSignalsFeed = unstable_cache(
  async (): Promise<SignalFeedResult> => {
    const [founders, updatedAt] = await Promise.all([
      getFounderDirectory({ perCountryLimit: 500, limit: 1000 }),
      getFounderDirectoryLastUpdatedAt(),
    ]);

    const items = founders
      .filter(
        (item) =>
          Boolean(item.lastRound) ||
          Boolean(item.fundingInfo) ||
          item.isHiring === true,
      )
      .slice(0, MAX_FEED_ITEMS)
      .map((item) => ({
        id: item.id,
        companyName: item.companyName,
        avatarUrl: item.avatarUrl ?? null,
        founderName: item.founderName,
        companySlug: item.companySlug,
        founderSlug: item.slug,
        industry: item.industry,
        stage: item.stage,
        country: item.country ?? "Unknown",
        fundingTotal: item.fundingTotalDisplay ?? item.fundingInfo ?? "Undisclosed",
        lastRound: item.lastRound
          ? `${item.lastRound.round} ${item.lastRound.amount}`
          : "Undisclosed",
        isHiring: item.isHiring ?? false,
        hiringRoles: item.hiringRoles ?? [],
      }));

    return {
      updatedAt: updatedAt.toISOString(),
      items,
    };
  },
  ["signals-feed-v1"],
  { revalidate: 1800 },
);

export async function getSignalsFeed(limit = 25): Promise<SignalFeedResult> {
  const safeLimit = Number.isFinite(limit)
    ? Math.min(Math.max(Math.trunc(limit), 1), MAX_FEED_ITEMS)
    : 25;
  const result = await getCachedSignalsFeed();
  return {
    updatedAt: result.updatedAt,
    items: result.items.slice(0, safeLimit),
  };
}
