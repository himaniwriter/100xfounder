import rawPosts from "@/lib/blog/blog-data.json";
import { unstable_cache } from "next/cache";
import { isDatabaseConfigured } from "@/lib/db-config";
import { buildExcerpt, toReadingTime } from "@/lib/blog/post-utils";
import type {
  BlogHeading,
  BlogPost,
  BlogPostCitation,
  BlogPostUpdate,
} from "@/lib/blog/types";
import { ensureBlogPostsSchema } from "@/lib/db-bootstrap";
import { prisma } from "@/lib/prisma";

function parseDateValue(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeCitations(citations: BlogPostCitation[] | undefined): BlogPostCitation[] {
  return (citations ?? [])
    .filter(
      (item) =>
        item &&
        item.sourceName?.trim() &&
        item.sourceTitle?.trim() &&
        item.sourceUrl?.trim(),
    )
    .map((item) => ({
      id: item.id,
      sourceName: item.sourceName.trim(),
      sourceTitle: item.sourceTitle.trim(),
      sourceUrl: item.sourceUrl.trim(),
      quotedClaim: item.quotedClaim?.trim() || null,
      createdAt: item.createdAt,
    }));
}

function normalizeUpdates(updates: BlogPostUpdate[] | undefined): BlogPostUpdate[] {
  return (updates ?? [])
    .filter((item) => item?.changeType?.trim())
    .map((item) => ({
      id: item.id,
      changeType: item.changeType.trim(),
      note: item.note?.trim() || null,
      changedBy: item.changedBy?.trim() || null,
      createdAt: item.createdAt,
    }));
}

function normalizeSourceUrls(post: BlogPost): string[] {
  const fromArray = Array.isArray(post.sourceUrls)
    ? post.sourceUrls.map((item) => item.trim()).filter(Boolean)
    : [];
  const fromSingle = post.sourceUrl?.trim() ? [post.sourceUrl.trim()] : [];

  return Array.from(new Set([...fromArray, ...fromSingle]));
}

function resolvePublishedAt(post: BlogPost): string {
  const published = post.publishedAt?.trim();
  if (published) {
    return published;
  }

  if (post.createdAt?.trim()) {
    return post.createdAt;
  }

  return new Date().toISOString();
}

export function normalizeBlogPost(post: BlogPost): BlogPost {
  const resolvedPublishedAt = resolvePublishedAt(post);
  const resolvedCreatedAt = post.createdAt ?? resolvedPublishedAt;
  const resolvedUpdatedAt = post.updatedAt ?? resolvedCreatedAt;
  const sourceUrls = normalizeSourceUrls(post);

  return {
    ...post,
    slug: slugify(post.slug || post.title),
    subtitle: post.subtitle?.trim() || undefined,
    articleType: post.articleType?.trim() || "analysis",
    topicSlug: post.topicSlug?.trim() || slugify(post.category || "news"),
    authorId: post.authorId ?? null,
    canonicalUrl: post.canonicalUrl?.trim() || undefined,
    sourceUrls,
    factCheckStatus: post.factCheckStatus?.trim() || "pending_review",
    correctionNote: post.correctionNote?.trim() || undefined,
    discoverReady: post.discoverReady ?? false,
    socialImageUrl: post.socialImageUrl?.trim() || undefined,
    publishedAt: resolvedPublishedAt,
    createdAt: resolvedCreatedAt,
    updatedAt: resolvedUpdatedAt,
    status: post.status ?? "PUBLISHED",
    sourceUrl: sourceUrls[0],
    sourceName: post.sourceName ?? "100Xfounder Desk",
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
    citations: normalizeCitations(post.citations),
    updates: normalizeUpdates(post.updates),
  };
}

function mapDatabasePostToBlogPost(post: {
  slug: string;
  title: string;
  subtitle: string | null;
  content: string;
  articleType: string;
  topicSlug: string | null;
  featureImage: string;
  imageCredit: string | null;
  author: string;
  authorId: string | null;
  canonicalUrl: string | null;
  sourceUrlsJson: unknown;
  factCheckStatus: string;
  correctionNote: string | null;
  discoverReady: boolean;
  socialImageUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  wordCount: number;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  citations: Array<{
    id: string;
    sourceName: string;
    sourceUrl: string;
    sourceTitle: string;
    quotedClaim: string | null;
    createdAt: Date;
  }>;
  updates: Array<{
    id: string;
    changeType: string;
    note: string | null;
    changedBy: string | null;
    createdAt: Date;
  }>;
}): BlogPost {
  const resolvedWordCount = post.wordCount > 0 ? post.wordCount : 0;
  const sourceUrls = Array.isArray(post.sourceUrlsJson)
    ? post.sourceUrlsJson
        .map((item) => (typeof item === "string" ? item.trim() : ""))
        .filter(Boolean)
    : [];

  return normalizeBlogPost({
    slug: post.slug,
    title: post.title,
    subtitle: post.subtitle ?? undefined,
    excerpt: buildExcerpt(post.content, post.seoDescription),
    category: "Founder Intelligence",
    readingTime: toReadingTime(resolvedWordCount),
    thumbnail: post.featureImage,
    imageCredit: post.imageCredit ?? undefined,
    wordCount: resolvedWordCount,
    articleType: post.articleType,
    topicSlug: post.topicSlug ?? undefined,
    authorId: post.authorId,
    canonicalUrl: post.canonicalUrl ?? undefined,
    sourceUrls,
    factCheckStatus: post.factCheckStatus,
    correctionNote: post.correctionNote ?? undefined,
    discoverReady: post.discoverReady,
    socialImageUrl: post.socialImageUrl ?? undefined,
    publishedAt: (post.publishedAt ?? post.createdAt).toISOString(),
    createdAt: post.createdAt.toISOString(),
    updatedAt: post.updatedAt.toISOString(),
    isFeatured: false,
    isTrending: false,
    author: post.author || "100Xfounder Research",
    content: post.content,
    status: post.status,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
    citations: post.citations.map((item) => ({
      id: item.id,
      sourceName: item.sourceName,
      sourceTitle: item.sourceTitle,
      sourceUrl: item.sourceUrl,
      quotedClaim: item.quotedClaim,
      createdAt: item.createdAt.toISOString(),
    })),
    updates: post.updates.map((item) => ({
      id: item.id,
      changeType: item.changeType,
      note: item.note,
      changedBy: item.changedBy,
      createdAt: item.createdAt.toISOString(),
    })),
  });
}

async function readBlogPostsFromDatabase(): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await ensureBlogPostsSchema();
    const posts = await prisma.post.findMany({
      include: {
        citations: { orderBy: { createdAt: "asc" } },
        updates: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
    });

    return posts.map((post) =>
      mapDatabasePostToBlogPost({
        ...post,
        status: post.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
      }),
    );
  } catch {
    return [];
  }
}

function readBlogPostsFromFile(): BlogPost[] {
  return [...(rawPosts as BlogPost[])].map(normalizeBlogPost);
}

async function readMergedBlogPosts(): Promise<BlogPost[]> {
  const filePosts = readBlogPostsFromFile();
  const databasePosts = await readBlogPostsFromDatabase();
  const mergedBySlug = new Map<string, BlogPost>();

  filePosts.forEach((post) => {
    mergedBySlug.set(post.slug, post);
  });

  databasePosts.forEach((post) => {
    mergedBySlug.set(post.slug, post);
  });

  return [...mergedBySlug.values()].sort(
    (a, b) => parseDateValue(b.publishedAt) - parseDateValue(a.publishedAt),
  );
}

const getCachedPublishedBlogPosts = unstable_cache(
  async () => {
    const posts = await readMergedBlogPosts();
    return posts.filter((post) => post.status === "PUBLISHED");
  },
  ["blog-posts-published-v1"],
  {
    revalidate: 180,
    tags: ["blog-posts-published"],
  },
);

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return getAllBlogPostsWithOptions();
}

export async function getAllBlogPostsWithOptions(
  options: { includeDrafts?: boolean } = {},
): Promise<BlogPost[]> {
  const includeDrafts = options.includeDrafts ?? false;
  if (!includeDrafts) {
    return getCachedPublishedBlogPosts();
  }

  return readMergedBlogPosts();
}

export async function getBlogPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): Promise<BlogPost | null> {
  const posts = await getAllBlogPostsWithOptions(options);
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function getBlogHomeSections() {
  const posts = await getAllBlogPostsWithOptions();
  const featured = posts.find((post) => post.isFeatured) ?? posts[0] ?? null;

  const trending = posts
    .filter((post) => post.isTrending && post.slug !== featured?.slug)
    .slice(0, 3);

  const recent = posts
    .filter(
      (post) =>
        post.slug !== featured?.slug &&
        !trending.some((item) => item.slug === post.slug),
    )
    .slice(0, 9);

  return { posts, featured, trending, recent };
}

export async function getNewsTopicSummaries() {
  const posts = await getAllBlogPostsWithOptions();
  const counts = new Map<string, { slug: string; label: string; count: number }>();

  posts.forEach((post) => {
    const slug = post.topicSlug || slugify(post.category || "news");
    const label = post.category || "News";
    const current = counts.get(slug);
    if (current) {
      current.count += 1;
      return;
    }
    counts.set(slug, { slug, label, count: 1 });
  });

  return Array.from(counts.values()).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function extractHeadings(content: string): BlogHeading[] {
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    const headingMatches = Array.from(
      content.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi),
    );

    return headingMatches
      .map((match) => {
        const level = Number(match[1]) as 2 | 3;
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (!text) {
          return null;
        }

        return {
          id: slugify(text),
          text,
          level,
        } satisfies BlogHeading;
      })
      .filter((item): item is BlogHeading => Boolean(item));
  }

  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## ") || line.startsWith("### "))
    .map((line): BlogHeading => {
      const level = line.startsWith("### ") ? 3 : 2;
      const text = line.replace(/^###?\s+/, "").trim();
      return {
        id: slugify(text),
        text,
        level,
      };
    });
}
