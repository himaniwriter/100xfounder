import rawPosts from "@/lib/blog/blog-data.json";
import { isDatabaseConfigured } from "@/lib/db-config";
import { buildExcerpt, toReadingTime } from "@/lib/blog/post-utils";
import type { BlogHeading, BlogPost } from "@/lib/blog/types";
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

export function normalizeBlogPost(post: BlogPost): BlogPost {
  return {
    ...post,
    status: post.status ?? "PUBLISHED",
    sourceName: post.sourceName ?? "100Xfounder Desk",
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
  };
}

function mapDatabasePostToBlogPost(post: {
  slug: string;
  title: string;
  content: string;
  featureImage: string;
  imageCredit: string | null;
  seoTitle: string;
  seoDescription: string;
  wordCount: number;
  status: "DRAFT" | "PUBLISHED";
  createdAt: Date;
}): BlogPost {
  const resolvedWordCount = post.wordCount > 0 ? post.wordCount : 0;

  return normalizeBlogPost({
    slug: post.slug,
    title: post.title,
    excerpt: buildExcerpt(post.content, post.seoDescription),
    category: "Founder Intelligence",
    readingTime: toReadingTime(resolvedWordCount),
    thumbnail: post.featureImage,
    imageCredit: post.imageCredit ?? undefined,
    wordCount: resolvedWordCount,
    publishedAt: post.createdAt.toISOString(),
    isFeatured: false,
    isTrending: false,
    author: "100Xfounder Research",
    content: post.content,
    status: post.status,
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  });
}

async function readBlogPostsFromDatabase(): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
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

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  return getAllBlogPostsWithOptions();
}

export async function getAllBlogPostsWithOptions(
  options: { includeDrafts?: boolean } = {},
): Promise<BlogPost[]> {
  const includeDrafts = options.includeDrafts ?? false;
  const filePosts = readBlogPostsFromFile();
  const databasePosts = await readBlogPostsFromDatabase();
  const mergedBySlug = new Map<string, BlogPost>();

  filePosts.forEach((post) => {
    mergedBySlug.set(post.slug, post);
  });

  databasePosts.forEach((post) => {
    mergedBySlug.set(post.slug, post);
  });

  return [...mergedBySlug.values()]
    .filter((post) => includeDrafts || post.status === "PUBLISHED")
    .sort((a, b) => parseDateValue(b.publishedAt) - parseDateValue(a.publishedAt));
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
