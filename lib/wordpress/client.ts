import { buildExcerpt, countWords, toReadingTime } from "@/lib/blog/post-utils";
import type { BlogPost } from "@/lib/blog/types";

const PER_PAGE = 100;
const MAX_PAGES = 10;
const FETCH_TIMEOUT_MS = 10_000;

export const WORDPRESS_CACHE_TAG = "wordpress";

type WpRendered = { rendered: string };

type WpTerm = { taxonomy: string; name: string; slug: string };

type WpPost = {
  id: number;
  slug: string;
  date_gmt: string;
  modified_gmt: string;
  title: WpRendered;
  excerpt: WpRendered;
  content: WpRendered;
  sticky?: boolean;
  yoast_head_json?: { title?: string; description?: string; og_image?: Array<{ url: string }> };
  _embedded?: {
    author?: Array<{ name: string }>;
    "wp:featuredmedia"?: Array<{ source_url?: string; caption?: WpRendered }>;
    "wp:term"?: WpTerm[][];
  };
};

export type WordPressPage = {
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  seoTitle: string;
  seoDescription: string;
  modifiedAt: string;
};

/** Base URL of the WordPress install used as the headless CMS, e.g. https://cms.100xfounder.com */
export function getWordPressUrl(): string | null {
  const value = process.env.WORDPRESS_URL?.trim().replace(/\/+$/, "");
  return value || null;
}

export function isWordPressConfigured(): boolean {
  return Boolean(getWordPressUrl());
}

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
};

export function decodeEntities(value: string): string {
  return value
    .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&([a-z]+);/gi, (entity, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? entity);
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
}

async function wpFetch<T>(path: string): Promise<{ data: T; totalPages: number } | null> {
  const baseUrl = getWordPressUrl();
  if (!baseUrl) {
    return null;
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(`${baseUrl}/wp-json/wp/v2/${path}`, {
      signal: controller.signal,
      headers: { Accept: "application/json" },
      next: { revalidate: 300, tags: [WORDPRESS_CACHE_TAG] },
    });
    if (!response.ok) {
      return null;
    }
    return {
      data: (await response.json()) as T,
      totalPages: Number(response.headers.get("x-wp-totalpages") || "1"),
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function mapWordPressPost(post: WpPost): BlogPost {
  const content = post.content.rendered;
  const wordCount = countWords(content);
  const terms = (post._embedded?.["wp:term"] ?? []).flat();
  const categories = terms.filter((term) => term.taxonomy === "category" && term.slug !== "uncategorized");
  const media = post._embedded?.["wp:featuredmedia"]?.[0];
  const title = decodeEntities(post.title.rendered);
  const excerpt = stripTags(post.excerpt.rendered) || buildExcerpt(content);
  const publishedAt = `${post.date_gmt}Z`;

  return {
    slug: post.slug,
    title,
    excerpt,
    category: categories[0]?.name ?? "Startups",
    topicSlug: categories[0]?.slug,
    readingTime: toReadingTime(wordCount),
    wordCount,
    thumbnail: media?.source_url || post.yoast_head_json?.og_image?.[0]?.url || "",
    imageCredit: media?.caption ? stripTags(media.caption.rendered) || undefined : undefined,
    publishedAt,
    createdAt: publishedAt,
    updatedAt: `${post.modified_gmt}Z`,
    isFeatured: Boolean(post.sticky),
    isTrending: false,
    author: post._embedded?.author?.[0]?.name ?? "100xFounder",
    content,
    status: "PUBLISHED",
    sourceName: "100xFounder",
    seoTitle: post.yoast_head_json?.title ? decodeEntities(post.yoast_head_json.title) : title,
    seoDescription: post.yoast_head_json?.description || excerpt,
  };
}

/** Published posts from WordPress, mapped to the site's BlogPost shape. */
export async function fetchWordPressPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const result = await wpFetch<WpPost[]>(`posts?per_page=${PER_PAGE}&page=${page}&_embed=1`);
    if (!result) {
      break;
    }
    posts.push(...result.data.map(mapWordPressPost));
    if (page >= result.totalPages) {
      break;
    }
  }
  return posts;
}

export async function fetchWordPressPage(slug: string): Promise<WordPressPage | null> {
  const result = await wpFetch<WpPost[]>(`pages?slug=${encodeURIComponent(slug)}&_embed=1`);
  const page = result?.data[0];
  if (!page) {
    return null;
  }
  const title = decodeEntities(page.title.rendered);
  const excerpt = stripTags(page.excerpt.rendered) || buildExcerpt(page.content.rendered);
  return {
    slug: page.slug,
    title,
    content: page.content.rendered,
    excerpt,
    seoTitle: page.yoast_head_json?.title ? decodeEntities(page.yoast_head_json.title) : title,
    seoDescription: page.yoast_head_json?.description || excerpt,
    modifiedAt: `${page.modified_gmt}Z`,
  };
}

export async function fetchWordPressPageSlugs(): Promise<string[]> {
  const result = await wpFetch<Array<{ slug: string }>>(`pages?per_page=${PER_PAGE}&_fields=slug`);
  return result?.data.map((page) => page.slug) ?? [];
}
