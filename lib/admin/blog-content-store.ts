import { promises as fs } from "node:fs";
import path from "node:path";
import type { PostStatus } from "@prisma/client";
import type { BlogPost } from "@/lib/blog/types";
import {
  buildExcerpt,
  countWords,
  slugify,
  toReadingTime,
} from "@/lib/blog/post-utils";
import { normalizeBlogPost } from "@/lib/blog/store";
import { isDatabaseConfigured } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

const BLOG_DATA_PATH = path.join(process.cwd(), "lib/blog/blog-data.json");

export type BlogStatus = "DRAFT" | "PUBLISHED";

export type AdminBlogMutationInput = {
  slug: string;
  title?: string;
  excerpt?: string;
  category?: string;
  readingTime?: string;
  thumbnail?: string;
  imageCredit?: string | null;
  author?: string;
  content?: string;
  status?: BlogStatus;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
};

function parseDateValue(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function toDbStatus(status: BlogStatus): PostStatus {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function fromDbStatus(status: PostStatus): BlogStatus {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
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
  status: PostStatus;
  createdAt: Date;
}): BlogPost {
  return normalizeBlogPost({
    slug: post.slug,
    title: post.title,
    excerpt: buildExcerpt(post.content, post.seoDescription),
    category: "Founder Intelligence",
    readingTime: toReadingTime(post.wordCount),
    thumbnail: post.featureImage,
    imageCredit: post.imageCredit ?? undefined,
    wordCount: post.wordCount,
    publishedAt: post.createdAt.toISOString(),
    isFeatured: false,
    isTrending: false,
    author: "100Xfounder Research",
    content: post.content,
    status: fromDbStatus(post.status),
    seoTitle: post.seoTitle,
    seoDescription: post.seoDescription,
  });
}

async function readFilePosts(): Promise<BlogPost[]> {
  try {
    const raw = await fs.readFile(BLOG_DATA_PATH, "utf-8");
    const parsed = JSON.parse(raw) as BlogPost[];
    return parsed.map((post) =>
      normalizeBlogPost({
        ...post,
        slug: slugify(post.slug || post.title),
      }),
    );
  } catch {
    return [];
  }
}

async function writeFilePosts(posts: BlogPost[]): Promise<void> {
  const sorted = [...posts].sort(
    (a, b) => parseDateValue(b.publishedAt) - parseDateValue(a.publishedAt),
  );
  await fs.writeFile(BLOG_DATA_PATH, JSON.stringify(sorted, null, 2), "utf-8");
}

async function readDatabasePosts(): Promise<BlogPost[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    const posts = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
    });
    return posts.map((post) => mapDatabasePostToBlogPost(post));
  } catch {
    return [];
  }
}

function normalizeCreateInput(input: AdminBlogMutationInput): BlogPost {
  const title = input.title?.trim() || "Untitled Post";
  const content = input.content?.trim() || "";
  const excerpt = input.excerpt?.trim() || buildExcerpt(content);
  const status = input.status ?? "DRAFT";
  const publishedAt =
    status === "PUBLISHED" ? new Date().toISOString() : "2099-01-01";

  return normalizeBlogPost({
    slug: input.slug,
    title,
    excerpt,
    category: input.category?.trim() || "Founder Intelligence",
    readingTime:
      input.readingTime?.trim() ||
      toReadingTime(countWords(content)),
    thumbnail:
      input.thumbnail?.trim() || "/images/covers/startup-brief.svg",
    imageCredit: input.imageCredit?.trim() || undefined,
    wordCount: countWords(content),
    publishedAt,
    isFeatured: input.isFeatured ?? false,
    isTrending: input.isTrending ?? false,
    author: input.author?.trim() || "100Xfounder Research",
    content,
    status,
    seoTitle: input.seoTitle?.trim() || title,
    seoDescription: input.seoDescription?.trim() || excerpt,
  });
}

export async function readAdminBlogPosts(): Promise<BlogPost[]> {
  const [dbPosts, filePosts] = await Promise.all([
    readDatabasePosts(),
    readFilePosts(),
  ]);
  const mergedBySlug = new Map<string, BlogPost>();

  filePosts.forEach((post) => {
    mergedBySlug.set(post.slug, post);
  });

  dbPosts.forEach((post) => {
    mergedBySlug.set(post.slug, post);
  });

  return [...mergedBySlug.values()].sort(
    (a, b) => parseDateValue(b.publishedAt) - parseDateValue(a.publishedAt),
  );
}

export async function buildUniqueBlogSlug(base: string): Promise<string> {
  const posts = await readAdminBlogPosts();
  const existing = new Set(posts.map((post) => post.slug));
  const normalizedBase = slugify(base) || "untitled-post";

  let suffix = 0;
  while (true) {
    const candidate = suffix === 0 ? normalizedBase : `${normalizedBase}-${suffix}`;
    if (!existing.has(candidate)) {
      return candidate;
    }
    suffix += 1;
  }
}

export async function createAdminBlogPost(
  input: AdminBlogMutationInput,
): Promise<BlogPost> {
  const normalized = normalizeCreateInput(input);

  if (isDatabaseConfigured()) {
    const created = await prisma.post.create({
      data: {
        slug: normalized.slug,
        title: normalized.title,
        content: normalized.content,
        featureImage: normalized.thumbnail,
        imageCredit: normalized.imageCredit ?? null,
        seoTitle: normalized.seoTitle ?? normalized.title,
        seoDescription: normalized.seoDescription ?? normalized.excerpt,
        wordCount: normalized.wordCount ?? countWords(normalized.content),
        status: toDbStatus(normalized.status ?? "DRAFT"),
      },
    });

    return mapDatabasePostToBlogPost(created);
  }

  const filePosts = await readFilePosts();
  filePosts.unshift(normalized);
  await writeFilePosts(filePosts);
  return normalized;
}

export async function updateAdminBlogPost(
  slug: string,
  patch: Omit<AdminBlogMutationInput, "slug">,
): Promise<BlogPost | null> {
  if (isDatabaseConfigured()) {
    const existing = await prisma.post.findUnique({ where: { slug } });
    if (existing) {
      const nextTitle = patch.title?.trim() || existing.title;
      const nextContent = patch.content?.trim() || existing.content;
      const nextSeoDescription =
        patch.seoDescription?.trim() ||
        existing.seoDescription ||
        buildExcerpt(nextContent);

      const updated = await prisma.post.update({
        where: { slug },
        data: {
          title: patch.title?.trim(),
          content: patch.content?.trim(),
          featureImage: patch.thumbnail?.trim(),
          imageCredit:
            typeof patch.imageCredit === "string"
              ? patch.imageCredit.trim() || null
              : undefined,
          seoTitle: patch.seoTitle?.trim() || nextTitle,
          seoDescription: nextSeoDescription,
          wordCount: countWords(nextContent),
          status: patch.status ? toDbStatus(patch.status) : undefined,
        },
      });

      return mapDatabasePostToBlogPost(updated);
    }
  }

  const filePosts = await readFilePosts();
  const index = filePosts.findIndex((post) => post.slug === slug);
  if (index < 0) {
    return null;
  }

  const existing = filePosts[index];
  const nextStatus = patch.status ?? existing.status ?? "PUBLISHED";
  const nextContent = patch.content?.trim() ?? existing.content;
  const nextExcerpt =
    patch.excerpt?.trim() ??
    existing.excerpt ??
    buildExcerpt(nextContent, patch.seoDescription);

  filePosts[index] = normalizeBlogPost({
    ...existing,
    ...patch,
    content: nextContent,
    excerpt: nextExcerpt,
    thumbnail: patch.thumbnail?.trim() ?? existing.thumbnail,
    imageCredit:
      typeof patch.imageCredit === "string"
        ? patch.imageCredit.trim() || undefined
        : existing.imageCredit,
    status: nextStatus,
    wordCount: countWords(nextContent),
    readingTime:
      patch.readingTime?.trim() ||
      existing.readingTime ||
      toReadingTime(countWords(nextContent)),
    publishedAt:
      nextStatus === "PUBLISHED"
        ? existing.publishedAt === "2099-01-01"
          ? new Date().toISOString()
          : existing.publishedAt
        : "2099-01-01",
    seoTitle: patch.seoTitle?.trim() || existing.seoTitle || existing.title,
    seoDescription:
      patch.seoDescription?.trim() ||
      existing.seoDescription ||
      nextExcerpt,
  });

  await writeFilePosts(filePosts);
  return filePosts[index];
}

export async function deleteAdminBlogPost(slug: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    const deleted = await prisma.post.deleteMany({
      where: { slug },
    });
    if (deleted.count > 0) {
      return true;
    }
  }

  const filePosts = await readFilePosts();
  const nextPosts = filePosts.filter((post) => post.slug !== slug);
  if (nextPosts.length === filePosts.length) {
    return false;
  }

  await writeFilePosts(nextPosts);
  return true;
}
