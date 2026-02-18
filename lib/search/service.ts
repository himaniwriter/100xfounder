import { getAllBlogPosts } from "@/lib/blog/store";
import { getFounderDirectory } from "@/lib/founders/store";
import type {
  SearchApiResponse,
  SearchBlogResult,
  SearchCompanyResult,
  SearchFounderResult,
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

function limitResults<T>(items: T[], limit: number): T[] {
  return items.slice(0, Math.max(1, limit));
}

export async function searchSite(options: SearchOptions): Promise<SearchApiResponse> {
  const q = normalize(options.query);
  const requestedType = options.type;
  const requestedLimit = Math.max(1, Math.min(options.limit, 50));

  const [founders, posts] = await Promise.all([
    getFounderDirectory({ perCountryLimit: 500 }),
    getAllBlogPosts(),
  ]);

  const founderScored =
    requestedType === "all" || requestedType === "founder"
      ? founders
          .map((item) => {
            const score =
              scoreText(item.founderName, q, 10) +
              scoreText(item.companyName, q, 9) +
              scoreText(item.industry, q, 5) +
              scoreText(item.stage, q, 4) +
              scoreText(item.productSummary, q, 2);

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
              scoreText(item.companyName, q, 10) +
              scoreText(item.industry, q, 6) +
              scoreText(item.stage, q, 4) +
              scoreText(item.productSummary, q, 2);

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
              scoreText(post.title, q, 10) +
              scoreText(post.category, q, 5) +
              scoreText(post.excerpt, q, 3) +
              scoreText(post.content, q, 1);

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

  const foundersResults = limitResults(
    founderScored.map((item) => item.result),
    requestedType === "founder" ? requestedLimit : Math.max(5, Math.ceil(requestedLimit / 2)),
  );
  const companiesResults = limitResults(
    companyScored.map((item) => item.result),
    requestedType === "company" ? requestedLimit : Math.max(5, Math.ceil(requestedLimit / 2)),
  );
  const postsResults = limitResults(
    postScored.map((item) => item.result),
    requestedType === "blog" ? requestedLimit : Math.max(5, Math.ceil(requestedLimit / 2)),
  );

  return {
    success: true,
    query: options.query.trim(),
    results: {
      founders: foundersResults,
      companies: companiesResults,
      posts: postsResults,
    },
    total: foundersResults.length + companiesResults.length + postsResults.length,
  };
}
