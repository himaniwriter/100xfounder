import { getAllBlogPostsWithOptions } from "@/lib/blog/store";
import type { BlogPost } from "@/lib/blog/types";
import { countryToSlug } from "@/lib/founders/country-tier";
import { getStageOptions, slugifySegment } from "@/lib/founders/hubs";
import { getCountryCoverage, getFounderDirectory } from "@/lib/founders/store";
import type { FounderDirectoryItem } from "@/lib/founders/types";

export type NewsHubSummary = {
  slug: string;
  label: string;
  count: number;
  lastPublishedAt: string;
};

export type TopicNewsContext = {
  topic: NewsHubSummary;
  items: BlogPost[];
  relatedTopics: NewsHubSummary[];
};

export type CountryNewsContext = {
  country: string;
  countrySlug: string;
  tier: string;
  items: BlogPost[];
  relatedTopics: NewsHubSummary[];
};

export type CompanyNewsContext = {
  company: FounderDirectoryItem;
  companyFounders: FounderDirectoryItem[];
  relatedCompanies: FounderDirectoryItem[];
  items: BlogPost[];
  relatedTopics: NewsHubSummary[];
};

export type FundingStageNewsContext = {
  slug: string;
  label: string;
  items: BlogPost[];
  relatedStages: Array<{ slug: string; label: string; count: number }>;
  relatedTopics: NewsHubSummary[];
};

function parseDate(value: string | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? 0 : parsed;
}

function humanizeSlug(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function topicFromPost(post: BlogPost): { slug: string; label: string } {
  const categoryLabel = (post.category || "").trim();
  const rawSlug = (post.topicSlug || categoryLabel || "news").trim();
  const slug = slugifySegment(rawSlug);
  if (!slug) {
    return { slug: "news", label: "News" };
  }

  const categorySlug = slugifySegment(categoryLabel);
  if (categoryLabel && categorySlug === slug) {
    return { slug, label: categoryLabel };
  }

  if (categoryLabel && post.topicSlug) {
    return { slug, label: categoryLabel };
  }

  return { slug, label: humanizeSlug(slug) };
}

function toSearchText(post: BlogPost): string {
  return [
    post.title,
    post.subtitle,
    post.excerpt,
    post.content,
    post.category,
    post.topicSlug,
    post.sourceName,
    post.sourceTitle,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function dedupePosts(posts: BlogPost[]): BlogPost[] {
  const bySlug = new Map<string, BlogPost>();
  posts.forEach((post) => {
    bySlug.set(post.slug, post);
  });
  return Array.from(bySlug.values());
}

function sortPosts(posts: BlogPost[]): BlogPost[] {
  return [...posts].sort((a, b) => {
    const left = parseDate(b.updatedAt ?? b.publishedAt);
    const right = parseDate(a.updatedAt ?? a.publishedAt);
    return left - right;
  });
}

function summarizeTopics(posts: BlogPost[]): NewsHubSummary[] {
  const grouped = new Map<string, NewsHubSummary>();

  posts.forEach((post) => {
    const topic = topicFromPost(post);
    const publishedAt = post.updatedAt ?? post.publishedAt;
    const current = grouped.get(topic.slug);

    if (!current) {
      grouped.set(topic.slug, {
        slug: topic.slug,
        label: topic.label,
        count: 1,
        lastPublishedAt: publishedAt,
      });
      return;
    }

    current.count += 1;
    if (parseDate(publishedAt) > parseDate(current.lastPublishedAt)) {
      current.lastPublishedAt = publishedAt;
    }
  });

  return Array.from(grouped.values()).sort((a, b) => {
    if (b.count !== a.count) {
      return b.count - a.count;
    }
    return parseDate(b.lastPublishedAt) - parseDate(a.lastPublishedAt);
  });
}

function summarizeRelatedTopics(posts: BlogPost[], excludes: Set<string>): NewsHubSummary[] {
  return summarizeTopics(posts).filter((item) => !excludes.has(item.slug)).slice(0, 12);
}

function countryAliases(country: string): string[] {
  const base = country.trim().toLowerCase();
  if (!base) {
    return [];
  }

  if (base === "united states") {
    return ["united states", "usa", "us", "u.s.", "america"];
  }

  if (base === "united kingdom") {
    return ["united kingdom", "uk", "u.k.", "britain"];
  }

  if (base === "india") {
    return ["india", "indian"];
  }

  return [base];
}

function includesAny(text: string, queries: string[]): boolean {
  return queries.some((query) => query && text.includes(query.toLowerCase()));
}

function uniqueCompanies(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  const byCompany = new Map<string, FounderDirectoryItem>();
  items.forEach((item) => {
    if (!byCompany.has(item.companySlug)) {
      byCompany.set(item.companySlug, item);
    }
  });
  return Array.from(byCompany.values());
}

export async function getTopicSummaries(limit = 80): Promise<NewsHubSummary[]> {
  const posts = await getAllBlogPostsWithOptions();
  return summarizeTopics(posts).slice(0, Math.max(1, limit));
}

export async function getTopicNewsContext(
  topicSlug: string,
  limit = 60,
): Promise<TopicNewsContext | null> {
  const normalizedSlug = slugifySegment(topicSlug);
  if (!normalizedSlug) {
    return null;
  }

  const posts = await getAllBlogPostsWithOptions();
  const exactMatches = posts.filter((post) => topicFromPost(post).slug === normalizedSlug);
  const fallbackMatches =
    exactMatches.length > 0
      ? exactMatches
      : posts.filter((post) => toSearchText(post).includes(normalizedSlug.replace(/-/g, " ")));

  if (fallbackMatches.length === 0) {
    return null;
  }

  const topicLabel = topicFromPost(fallbackMatches[0]).label || humanizeSlug(normalizedSlug);
  const ordered = sortPosts(dedupePosts(fallbackMatches)).slice(0, Math.max(1, limit));

  return {
    topic: {
      slug: normalizedSlug,
      label: topicLabel,
      count: fallbackMatches.length,
      lastPublishedAt: ordered[0]?.publishedAt ?? new Date().toISOString(),
    },
    items: ordered,
    relatedTopics: summarizeRelatedTopics(posts, new Set([normalizedSlug])),
  };
}

export async function getCountryNewsContext(
  countrySlug: string,
  limit = 60,
): Promise<CountryNewsContext | null> {
  const normalizedSlug = slugifySegment(countrySlug);
  const coverage = await getCountryCoverage();
  const country = coverage.find((item) => item.countrySlug === normalizedSlug);
  if (!country) {
    return null;
  }

  const posts = await getAllBlogPostsWithOptions();
  const aliases = countryAliases(country.country);
  const matches = posts.filter((post) => includesAny(toSearchText(post), aliases));

  return {
    country: country.country,
    countrySlug: country.countrySlug,
    tier: country.tier,
    items: sortPosts(dedupePosts(matches)).slice(0, Math.max(1, limit)),
    relatedTopics: summarizeRelatedTopics(matches.length > 0 ? matches : posts, new Set()),
  };
}

export async function getCompanyNewsContext(
  companySlug: string,
  limit = 60,
): Promise<CompanyNewsContext | null> {
  const normalizedSlug = slugifySegment(companySlug);
  const founders = await getFounderDirectory({ perCountryLimit: 500 });
  const companyFounders = founders.filter((item) => item.companySlug === normalizedSlug);
  if (companyFounders.length === 0) {
    return null;
  }

  const primary = companyFounders[0];
  const searchQueries = Array.from(
    new Set(
      [
        primary.companyName,
        ...companyFounders.map((item) => item.founderName),
        ...companyFounders.map((item) => item.companyName),
      ]
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean),
    ),
  );

  const posts = await getAllBlogPostsWithOptions();
  const matches = posts.filter((post) => includesAny(toSearchText(post), searchQueries));
  const relatedCompanies = uniqueCompanies(
    founders
      .filter(
        (item) =>
          item.companySlug !== primary.companySlug && item.industry === primary.industry,
      )
      .slice(0, 12),
  );

  return {
    company: primary,
    companyFounders,
    relatedCompanies,
    items: sortPosts(dedupePosts(matches)).slice(0, Math.max(1, limit)),
    relatedTopics: summarizeRelatedTopics(matches.length > 0 ? matches : posts, new Set()),
  };
}

export async function getFundingRoundOptions(limit = 24) {
  const options = await getStageOptions();
  return options.slice(0, Math.max(1, limit));
}

export async function getFundingStageNewsContext(
  stageSlug: string,
  limit = 60,
): Promise<FundingStageNewsContext | null> {
  const normalizedSlug = slugifySegment(stageSlug);
  const stageOptions = await getStageOptions();
  const stage = stageOptions.find((item) => item.slug === normalizedSlug);
  if (!stage) {
    return null;
  }

  const normalizedQuery = stage.label.toLowerCase();
  const alternateQuery = normalizedSlug.replace(/-/g, " ");
  const posts = await getAllBlogPostsWithOptions();
  const matches = posts.filter((post) => {
    const haystack = toSearchText(post);
    return haystack.includes(normalizedQuery) || haystack.includes(alternateQuery);
  });

  return {
    slug: stage.slug,
    label: stage.label,
    items: sortPosts(dedupePosts(matches)).slice(0, Math.max(1, limit)),
    relatedStages: stageOptions
      .filter((item) => item.slug !== stage.slug)
      .slice(0, 10),
    relatedTopics: summarizeRelatedTopics(matches.length > 0 ? matches : posts, new Set()),
  };
}

export function resolveCountryNewsHref(country: string): string {
  return `/countries/${countryToSlug(country)}/news`;
}
