import { countWords } from "@/lib/blog/post-utils";
import { getAllBlogPostsWithOptions, getBlogPostBySlug } from "@/lib/blog/store";
import type { BlogPost } from "@/lib/blog/types";
import { getFounderDirectory } from "@/lib/founders/store";

export type NewsEntityType = "topic" | "company" | "founder";

function normalizeLimit(value: number | undefined, defaults = 20): number {
  if (!value || Number.isNaN(value)) {
    return defaults;
  }
  return Math.min(Math.max(Math.round(value), 1), 100);
}

function matchText(value: string, query: string): boolean {
  return value.toLowerCase().includes(query.toLowerCase());
}

export async function getPublishedNews(limit?: number): Promise<BlogPost[]> {
  const posts = await getAllBlogPostsWithOptions();
  return posts.slice(0, normalizeLimit(limit, 20));
}

export async function getNewsByTopicSlug(slug: string, limit?: number): Promise<BlogPost[]> {
  const posts = await getAllBlogPostsWithOptions();
  const normalizedSlug = slug.trim().toLowerCase();
  return posts
    .filter((post) => (post.topicSlug || "").toLowerCase() === normalizedSlug)
    .slice(0, normalizeLimit(limit, 30));
}

export async function getNewsByFundingStage(stage: string, limit?: number): Promise<BlogPost[]> {
  const posts = await getAllBlogPostsWithOptions();
  const normalized = stage.trim().toLowerCase().replace(/-/g, " ");

  return posts
    .filter((post) => {
      const text = `${post.title} ${post.content} ${post.excerpt}`.toLowerCase();
      return text.includes(normalized);
    })
    .slice(0, normalizeLimit(limit, 30));
}

export async function getEntityNews(
  type: NewsEntityType,
  slug: string,
  limit?: number,
): Promise<{ entityLabel: string; items: BlogPost[] }> {
  const normalizedSlug = slug.trim().toLowerCase();
  const max = normalizeLimit(limit, 30);
  const posts = await getAllBlogPostsWithOptions();

  if (type === "topic") {
    const items = posts
      .filter((post) => (post.topicSlug || "").toLowerCase() === normalizedSlug)
      .slice(0, max);
    return {
      entityLabel: normalizedSlug.replace(/-/g, " "),
      items,
    };
  }

  const founders = await getFounderDirectory();

  if (type === "company") {
    const company = founders.find((item) => item.companySlug === normalizedSlug);
    const entityLabel = company?.companyName ?? normalizedSlug.replace(/-/g, " ");
    const items = posts
      .filter((post) => {
        const text = `${post.title} ${post.excerpt} ${post.content}`;
        return matchText(text, entityLabel);
      })
      .slice(0, max);

    return { entityLabel, items };
  }

  const founder = founders.find((item) => item.slug === normalizedSlug);
  const entityLabel = founder?.founderName ?? normalizedSlug.replace(/-/g, " ");
  const items = posts
    .filter((post) => {
      const text = `${post.title} ${post.excerpt} ${post.content}`;
      return matchText(text, entityLabel);
    })
    .slice(0, max);

  return { entityLabel, items };
}

export async function getNewsCitationsBySlug(slug: string) {
  const post = await getBlogPostBySlug(slug, { includeDrafts: true });
  if (!post) {
    return null;
  }

  return {
    slug: post.slug,
    title: post.title,
    citations: post.citations ?? [],
    sourceUrls: post.sourceUrls ?? [],
  };
}

export function assessPublishReadiness(post: BlogPost) {
  const citations = post.citations ?? [];
  const contentWordCount = post.wordCount ?? countWords(post.content);
  const imageUrl = post.thumbnail?.trim() || "";
  const hasDiscoverImage =
    imageUrl.length > 0 &&
    !imageUrl.endsWith(".svg") &&
    !imageUrl.includes("/images/covers/");

  const checks = {
    hasTitle: post.title.trim().length >= 4,
    minWords: contentWordCount >= 400,
    hasFeaturedImage: hasDiscoverImage,
    discoverReady: Boolean(post.discoverReady),
    factChecked: ["reviewed", "verified", "approved"].includes(
      (post.factCheckStatus || "").toLowerCase(),
    ),
    hasCitations: citations.length > 0,
  };

  const passed = Object.values(checks).every(Boolean);

  return {
    passed,
    checks,
    wordCount: contentWordCount,
    citationCount: citations.length,
  };
}
