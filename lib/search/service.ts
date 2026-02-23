import { getAllBlogPosts } from "@/lib/blog/store";
import { getFounderDirectory } from "@/lib/founders/store";
import { getTopicSummaries } from "@/lib/news/hubs";
import { getSignalsFeed } from "@/lib/signals/feed";
import type {
  SearchApiResponse,
  SearchBlogResult,
  SearchCompanyResult,
  SearchFounderResult,
  SearchSignalResult,
  SearchTopicResult,
  SearchResultType,
} from "@/lib/search/types";

export type SearchOptions = {
  query: string;
  type: "all" | SearchResultType;
  limit: number;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function toTokens(value: string): string[] {
  return normalize(value)
    .split(" ")
    .map((token) => token.trim())
    .filter(Boolean);
}

function scoreText(value: string, query: string, weight: number): number {
  if (!value) {
    return 0;
  }

  const normalizedValue = normalize(value);
  if (!normalizedValue) {
    return 0;
  }

  if (normalizedValue === query) {
    return weight * 4;
  }

  if (normalizedValue.startsWith(query)) {
    return weight * 3;
  }

  if (normalizedValue.includes(` ${query} `) || normalizedValue.endsWith(` ${query}`)) {
    return weight * 2;
  }

  if (normalizedValue.includes(query)) {
    return weight;
  }

  return 0;
}

function scoreTokenMatch(value: string, queryTokens: string[], weight: number): number {
  if (!value || queryTokens.length === 0) {
    return 0;
  }

  const valueTokens = toTokens(value);
  if (valueTokens.length === 0) {
    return 0;
  }

  const matchedTokenCount = queryTokens.filter((queryToken) =>
    valueTokens.some((valueToken) => valueToken.includes(queryToken)),
  ).length;

  if (matchedTokenCount === 0) {
    return 0;
  }

  if (matchedTokenCount === queryTokens.length) {
    return weight * 2.5;
  }

  if (queryTokens.length === 1) {
    return weight * 1.25;
  }

  const requiredForStrongPartial = Math.ceil(queryTokens.length * 0.75);
  if (matchedTokenCount >= requiredForStrongPartial && matchedTokenCount >= 2) {
    return weight * 1.5;
  }

  if (matchedTokenCount >= 2) {
    return weight * 0.75;
  }

  return 0;
}

function scoreField(value: string, query: string, queryTokens: string[], weight: number): number {
  return Math.max(scoreText(value, query, weight), scoreTokenMatch(value, queryTokens, weight));
}

function limitResults<T>(items: T[], limit: number): T[] {
  return items.slice(0, Math.max(1, limit));
}

export async function searchSite(options: SearchOptions): Promise<SearchApiResponse> {
  const q = normalize(options.query);
  const queryTokens = toTokens(q);
  const requestedType = options.type;
  const requestedLimit = Math.max(1, Math.min(options.limit, 50));
  const includeFounders = requestedType === "all" || requestedType === "founder" || requestedType === "company";
  const includePosts = requestedType === "all" || requestedType === "blog";
  const includeSignals = requestedType === "all" || requestedType === "signal";
  const includeTopics = requestedType === "all" || requestedType === "topic";

  const [founders, posts, signalsFeed, topicSummaries] = await Promise.all([
    includeFounders ? getFounderDirectory({ perCountryLimit: 500 }) : Promise.resolve([]),
    includePosts ? getAllBlogPosts() : Promise.resolve([]),
    includeSignals ? getSignalsFeed(120) : Promise.resolve({ updatedAt: "", items: [] }),
    includeTopics ? getTopicSummaries(120) : Promise.resolve([]),
  ]);

  const founderScored =
    requestedType === "all" || requestedType === "founder"
      ? founders
          .map((item) => {
            const score =
              scoreField(item.founderName, q, queryTokens, 10) +
              scoreField(item.companyName, q, queryTokens, 9) +
              scoreField(`${item.founderName} ${item.companyName}`, q, queryTokens, 9) +
              scoreField(item.industry, q, queryTokens, 5) +
              scoreField(item.stage, q, queryTokens, 4) +
              scoreField(item.productSummary, q, queryTokens, 2);

            if (score <= 0) {
              return null;
            }

            const result: SearchFounderResult = {
              slug: item.slug,
              founderName: item.founderName,
              companyName: item.companyName,
              companySlug: item.companySlug,
              industry: item.industry,
              stage: item.stage,
              country: item.country ?? "Unknown",
            };

            return { result, score };
          })
          .filter((item): item is { result: SearchFounderResult; score: number } => Boolean(item))
          .sort((a, b) => b.score - a.score)
      : [];

  const companyScored =
    requestedType === "all" || requestedType === "company"
      ? (() => {
          const byCompany = new Map<string, { result: SearchCompanyResult; score: number }>();

          founders.forEach((item) => {
            const score =
              scoreField(item.companyName, q, queryTokens, 10) +
              scoreField(item.founderName, q, queryTokens, 9) +
              scoreField(`${item.companyName} ${item.founderName}`, q, queryTokens, 9) +
              scoreField(item.industry, q, queryTokens, 6) +
              scoreField(item.stage, q, queryTokens, 4) +
              scoreField(item.productSummary, q, queryTokens, 2);

            if (score <= 0) {
              return;
            }

            const current = byCompany.get(item.companySlug);
            const candidate = {
              result: {
                companySlug: item.companySlug,
                companyName: item.companyName,
                founderName: item.founderName,
                industry: item.industry,
                stage: item.stage,
                country: item.country ?? "Unknown",
                funding: item.fundingTotalDisplay ?? item.fundingInfo ?? "Undisclosed",
              },
              score,
            };

            if (!current || candidate.score > current.score) {
              byCompany.set(item.companySlug, candidate);
            }
          });

          return Array.from(byCompany.values()).sort((a, b) => b.score - a.score);
        })()
      : [];

  const postScored =
    requestedType === "all" || requestedType === "blog"
      ? posts
          .map((post) => {
            const score =
              scoreField(post.title, q, queryTokens, 10) +
              scoreField(post.category, q, queryTokens, 5) +
              scoreField(post.excerpt, q, queryTokens, 3) +
              scoreField(post.content, q, queryTokens, 1);

            if (score <= 0) {
              return null;
            }

            const result: SearchBlogResult = {
              slug: post.slug,
              title: post.title,
              excerpt: post.excerpt,
              category: post.category,
              publishedAt: post.publishedAt,
            };

            return { result, score };
          })
          .filter((item): item is { result: SearchBlogResult; score: number } => Boolean(item))
          .sort((a, b) => b.score - a.score)
      : [];

  const signalScored =
    requestedType === "all" || requestedType === "signal"
      ? signalsFeed.items
          .map((item) => {
            const score =
              scoreField(item.companyName, q, queryTokens, 10) +
              scoreField(item.founderName, q, queryTokens, 9) +
              scoreField(item.industry, q, queryTokens, 5) +
              scoreField(item.stage, q, queryTokens, 4) +
              scoreField(item.country, q, queryTokens, 3) +
              scoreField(item.lastRound, q, queryTokens, 3) +
              scoreField(item.fundingTotal, q, queryTokens, 3);

            if (score <= 0) {
              return null;
            }

            const result: SearchSignalResult = {
              id: item.id,
              companyName: item.companyName,
              founderName: item.founderName,
              companySlug: item.companySlug,
              industry: item.industry,
              stage: item.stage,
              country: item.country,
              fundingTotal: item.fundingTotal,
              lastRound: item.lastRound,
              isHiring: item.isHiring,
            };

            return { result, score };
          })
          .filter((item): item is { result: SearchSignalResult; score: number } => Boolean(item))
          .sort((a, b) => b.score - a.score)
      : [];

  const topicScored =
    requestedType === "all" || requestedType === "topic"
      ? topicSummaries
          .map((topic) => {
            const score =
              scoreField(topic.label, q, queryTokens, 10) +
              scoreField(topic.slug.replace(/-/g, " "), q, queryTokens, 8);

            if (score <= 0) {
              return null;
            }

            const result: SearchTopicResult = {
              slug: topic.slug,
              label: topic.label,
              count: topic.count,
              lastPublishedAt: topic.lastPublishedAt,
            };

            return { result, score };
          })
          .filter((item): item is { result: SearchTopicResult; score: number } => Boolean(item))
          .sort((a, b) => b.score - a.score)
      : [];

  const splitLimit = Math.max(4, Math.ceil(requestedLimit / 3));
  const splitLimitCompact = Math.max(3, Math.ceil(requestedLimit / 4));

  const foundersResults = limitResults(
    founderScored.map((item) => item.result),
    requestedType === "founder" ? requestedLimit : splitLimit,
  );
  const companiesResults = limitResults(
    companyScored.map((item) => item.result),
    requestedType === "company" ? requestedLimit : splitLimit,
  );
  const postsResults = limitResults(
    postScored.map((item) => item.result),
    requestedType === "blog" ? requestedLimit : splitLimit,
  );
  const signalsResults = limitResults(
    signalScored.map((item) => item.result),
    requestedType === "signal" ? requestedLimit : splitLimitCompact,
  );
  const topicsResults = limitResults(
    topicScored.map((item) => item.result),
    requestedType === "topic" ? requestedLimit : splitLimitCompact,
  );

  return {
    success: true,
    query: options.query.trim(),
    results: {
      founders: foundersResults,
      companies: companiesResults,
      posts: postsResults,
      signals: signalsResults,
      topics: topicsResults,
    },
    total:
      foundersResults.length +
      companiesResults.length +
      postsResults.length +
      signalsResults.length +
      topicsResults.length,
  };
}
