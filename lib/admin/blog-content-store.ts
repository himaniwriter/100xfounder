import { promises as fs } from "node:fs";
import path from "node:path";
import type { BlogPost, BlogPostCitation, BlogPostUpdate } from "@/lib/blog/types";
import {
  buildExcerpt,
  countWords,
  slugify,
  toReadingTime,
} from "@/lib/blog/post-utils";
import { normalizeBlogPost } from "@/lib/blog/store";
import { isDatabaseConfigured } from "@/lib/db-config";
import { ensureBlogPostsSchema } from "@/lib/db-bootstrap";
import { prisma } from "@/lib/prisma";

const BLOG_DATA_PATH = path.join(process.cwd(), "lib/blog/blog-data.json");

export type BlogStatus = "DRAFT" | "PUBLISHED";

export type AdminBlogMutationInput = {
  slug: string;
  title?: string;
  subtitle?: string;
  excerpt?: string;
  category?: string;
  readingTime?: string;
  thumbnail?: string;
  imageCredit?: string | null;
  author?: string;
  authorId?: string | null;
  content?: string;
  status?: BlogStatus;
  seoTitle?: string;
  seoDescription?: string;
  isFeatured?: boolean;
  isTrending?: boolean;
  articleType?: string;
  topicSlug?: string;
  canonicalUrl?: string;
  sourceUrls?: string[];
  factCheckStatus?: string;
  correctionNote?: string;
  discoverReady?: boolean;
  socialImageUrl?: string;
  publishedAt?: string | null;
  citations?: BlogPostCitation[];
  postUpdate?: {
    changeType: string;
    note?: string;
    changedBy?: string;
  };
};

function parseDateValue(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function toDbStatus(status: BlogStatus): "DRAFT" | "PUBLISHED" {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function fromDbStatus(status: "DRAFT" | "PUBLISHED"): BlogStatus {
  return status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";
}

function toIso(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
}

function normalizeSourceUrls(value: string[] | undefined): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return Array.from(new Set(value.map((item) => item.trim()).filter(Boolean)));
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
      sourceName: item.sourceName.trim(),
      sourceTitle: item.sourceTitle.trim(),
      sourceUrl: item.sourceUrl.trim(),
      quotedClaim: item.quotedClaim?.trim() || null,
      createdAt: item.createdAt,
    }));
}

function mapDatabasePostToBlogPost(post: {
  id: string;
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
    readingTime: toReadingTime(post.wordCount),
    thumbnail: post.featureImage,
    imageCredit: post.imageCredit ?? undefined,
    wordCount: post.wordCount,
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
    status: fromDbStatus(post.status),
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
    await ensureBlogPostsSchema();
    const posts = await prisma.post.findMany({
      include: {
        citations: { orderBy: { createdAt: "asc" } },
        updates: { orderBy: { createdAt: "desc" } },
      },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
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
  const nowIso = new Date().toISOString();
  const sourceUrls = normalizeSourceUrls(input.sourceUrls);
  const publishedAtIso = toIso(input.publishedAt ?? undefined);
  const publishedAt =
    status === "PUBLISHED"
      ? publishedAtIso || nowIso
      : publishedAtIso || "2099-01-01";

  return normalizeBlogPost({
    slug: input.slug,
    title,
    subtitle: input.subtitle?.trim() || undefined,
    excerpt,
    category: input.category?.trim() || "Founder Intelligence",
    readingTime:
      input.readingTime?.trim() ||
      toReadingTime(countWords(content)),
    thumbnail:
      input.thumbnail?.trim() || "/images/covers/startup-brief.svg",
    imageCredit: input.imageCredit?.trim() || undefined,
    wordCount: countWords(content),
    articleType: input.articleType?.trim() || "analysis",
    topicSlug: input.topicSlug?.trim() || slugify(input.category?.trim() || "news"),
    authorId: input.authorId?.trim() || null,
    canonicalUrl: input.canonicalUrl?.trim() || undefined,
    sourceUrls,
    factCheckStatus: input.factCheckStatus?.trim() || "pending_review",
    correctionNote: input.correctionNote?.trim() || undefined,
    discoverReady: input.discoverReady ?? false,
    socialImageUrl: input.socialImageUrl?.trim() || undefined,
    publishedAt,
    createdAt: nowIso,
    updatedAt: nowIso,
    isFeatured: input.isFeatured ?? false,
    isTrending: input.isTrending ?? false,
    author: input.author?.trim() || "100Xfounder Research",
    content,
    status,
    seoTitle: input.seoTitle?.trim() || title,
    seoDescription: input.seoDescription?.trim() || excerpt,
    citations: normalizeCitations(input.citations),
    updates: input.postUpdate
      ? [
          {
            changeType: input.postUpdate.changeType.trim(),
            note: input.postUpdate.note?.trim(),
            changedBy: input.postUpdate.changedBy?.trim(),
            createdAt: nowIso,
          },
        ]
      : [],
  });
}

async function readDatabasePostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      citations: { orderBy: { createdAt: "asc" } },
      updates: { orderBy: { createdAt: "desc" } },
    },
  });

  return post;
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
    await ensureBlogPostsSchema();

    const created = await prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          slug: normalized.slug,
          title: normalized.title,
          subtitle: normalized.subtitle,
          content: normalized.content,
          articleType: normalized.articleType || "analysis",
          topicSlug: normalized.topicSlug || null,
          featureImage: normalized.thumbnail,
          imageCredit: normalized.imageCredit ?? null,
          author: normalized.author,
          authorId: normalized.authorId || null,
          canonicalUrl: normalized.canonicalUrl || null,
          sourceUrlsJson: normalized.sourceUrls ?? [],
          factCheckStatus: normalized.factCheckStatus || "pending_review",
          correctionNote: normalized.correctionNote ?? null,
          discoverReady: normalized.discoverReady ?? false,
          socialImageUrl: normalized.socialImageUrl ?? null,
          seoTitle: normalized.seoTitle ?? normalized.title,
          seoDescription: normalized.seoDescription ?? normalized.excerpt,
          wordCount: normalized.wordCount ?? countWords(normalized.content),
          status: toDbStatus(normalized.status ?? "DRAFT"),
          publishedAt:
            normalized.status === "PUBLISHED"
              ? new Date(normalized.publishedAt)
              : null,
        },
      });

      const citations = normalizeCitations(normalized.citations);
      if (citations.length > 0) {
        await tx.postCitation.createMany({
          data: citations.map((citation) => ({
            postId: post.id,
            sourceName: citation.sourceName,
            sourceUrl: citation.sourceUrl,
            sourceTitle: citation.sourceTitle,
            quotedClaim: citation.quotedClaim ?? null,
          })),
        });
      }

      await tx.postUpdate.create({
        data: {
          postId: post.id,
          changeType: normalized.status === "PUBLISHED" ? "published" : "created",
          note: normalized.status === "PUBLISHED" ? "Initial publish" : "Draft created",
        },
      });

      return tx.post.findUniqueOrThrow({
        where: { id: post.id },
        include: {
          citations: { orderBy: { createdAt: "asc" } },
          updates: { orderBy: { createdAt: "desc" } },
        },
      });
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
    await ensureBlogPostsSchema();
    const existing = await readDatabasePostBySlug(slug);
    if (existing) {
      const nextTitle = patch.title?.trim() || existing.title;
      const nextContent = patch.content?.trim() || existing.content;
      const nextSeoDescription =
        patch.seoDescription?.trim() ||
        existing.seoDescription ||
        buildExcerpt(nextContent);
      const nextStatus = patch.status ? toDbStatus(patch.status) : existing.status;
      const requestedPublishedAt = toIso(patch.publishedAt ?? undefined);
      const nextPublishedAt =
        nextStatus === "PUBLISHED"
          ? requestedPublishedAt
            ? new Date(requestedPublishedAt)
            : existing.publishedAt ?? new Date()
          : null;

      const updated = await prisma.$transaction(async (tx) => {
        const post = await tx.post.update({
          where: { slug },
          data: {
            title: patch.title?.trim(),
            subtitle:
              typeof patch.subtitle === "string"
                ? patch.subtitle.trim() || null
                : undefined,
            content: patch.content?.trim(),
            articleType:
              typeof patch.articleType === "string"
                ? patch.articleType.trim() || "analysis"
                : undefined,
            topicSlug:
              typeof patch.topicSlug === "string"
                ? patch.topicSlug.trim() || null
                : undefined,
            featureImage: patch.thumbnail?.trim(),
            imageCredit:
              typeof patch.imageCredit === "string"
                ? patch.imageCredit.trim() || null
                : undefined,
            author:
              typeof patch.author === "string"
                ? patch.author.trim() || "100Xfounder Research"
                : undefined,
            authorId:
              typeof patch.authorId === "string"
                ? patch.authorId.trim() || null
                : undefined,
            canonicalUrl:
              typeof patch.canonicalUrl === "string"
                ? patch.canonicalUrl.trim() || null
                : undefined,
            sourceUrlsJson: Array.isArray(patch.sourceUrls)
              ? normalizeSourceUrls(patch.sourceUrls)
              : undefined,
            factCheckStatus:
              typeof patch.factCheckStatus === "string"
                ? patch.factCheckStatus.trim() || "pending_review"
                : undefined,
            correctionNote:
              typeof patch.correctionNote === "string"
                ? patch.correctionNote.trim() || null
                : undefined,
            discoverReady:
              typeof patch.discoverReady === "boolean"
                ? patch.discoverReady
                : undefined,
            socialImageUrl:
              typeof patch.socialImageUrl === "string"
                ? patch.socialImageUrl.trim() || null
                : undefined,
            seoTitle: patch.seoTitle?.trim() || nextTitle,
            seoDescription: nextSeoDescription,
            wordCount: countWords(nextContent),
            status: nextStatus,
            publishedAt: nextPublishedAt,
          },
        });

        if (Array.isArray(patch.citations)) {
          await tx.postCitation.deleteMany({ where: { postId: post.id } });
          const citations = normalizeCitations(patch.citations);
          if (citations.length > 0) {
            await tx.postCitation.createMany({
              data: citations.map((citation) => ({
                postId: post.id,
                sourceName: citation.sourceName,
                sourceUrl: citation.sourceUrl,
                sourceTitle: citation.sourceTitle,
                quotedClaim: citation.quotedClaim ?? null,
              })),
            });
          }
        }

        if (patch.postUpdate?.changeType?.trim()) {
          await tx.postUpdate.create({
            data: {
              postId: post.id,
              changeType: patch.postUpdate.changeType.trim(),
              note: patch.postUpdate.note?.trim() || null,
              changedBy: patch.postUpdate.changedBy?.trim() || null,
            },
          });
        }

        return tx.post.findUniqueOrThrow({
          where: { id: post.id },
          include: {
            citations: { orderBy: { createdAt: "asc" } },
            updates: { orderBy: { createdAt: "desc" } },
          },
        });
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
  const nextSourceUrls =
    Array.isArray(patch.sourceUrls)
      ? normalizeSourceUrls(patch.sourceUrls)
      : existing.sourceUrls ?? [];

  filePosts[index] = normalizeBlogPost({
    ...existing,
    ...patch,
    content: nextContent,
    excerpt: nextExcerpt,
    subtitle: patch.subtitle?.trim() ?? existing.subtitle,
    articleType: patch.articleType?.trim() ?? existing.articleType,
    topicSlug: patch.topicSlug?.trim() ?? existing.topicSlug,
    thumbnail: patch.thumbnail?.trim() ?? existing.thumbnail,
    imageCredit:
      typeof patch.imageCredit === "string"
        ? patch.imageCredit.trim() || undefined
        : existing.imageCredit,
    author:
      typeof patch.author === "string"
        ? patch.author.trim() || "100Xfounder Research"
        : existing.author,
    authorId:
      typeof patch.authorId === "string"
        ? patch.authorId.trim() || null
        : existing.authorId,
    canonicalUrl:
      typeof patch.canonicalUrl === "string"
        ? patch.canonicalUrl.trim() || undefined
        : existing.canonicalUrl,
    sourceUrls: nextSourceUrls,
    sourceUrl: nextSourceUrls[0],
    factCheckStatus:
      typeof patch.factCheckStatus === "string"
        ? patch.factCheckStatus.trim() || "pending_review"
        : existing.factCheckStatus,
    correctionNote:
      typeof patch.correctionNote === "string"
        ? patch.correctionNote.trim() || undefined
        : existing.correctionNote,
    discoverReady:
      typeof patch.discoverReady === "boolean"
        ? patch.discoverReady
        : existing.discoverReady,
    socialImageUrl:
      typeof patch.socialImageUrl === "string"
        ? patch.socialImageUrl.trim() || undefined
        : existing.socialImageUrl,
    status: nextStatus,
    wordCount: countWords(nextContent),
    readingTime:
      patch.readingTime?.trim() ||
      existing.readingTime ||
      toReadingTime(countWords(nextContent)),
    publishedAt:
      nextStatus === "PUBLISHED"
        ? toIso(patch.publishedAt ?? undefined) ||
          existing.publishedAt ||
          new Date().toISOString()
        : "2099-01-01",
    updatedAt: new Date().toISOString(),
    seoTitle: patch.seoTitle?.trim() || existing.seoTitle || existing.title,
    seoDescription:
      patch.seoDescription?.trim() ||
      existing.seoDescription ||
      nextExcerpt,
    citations:
      Array.isArray(patch.citations) ? normalizeCitations(patch.citations) : existing.citations,
    updates: patch.postUpdate
      ? [
          {
            changeType: patch.postUpdate.changeType,
            note: patch.postUpdate.note,
            changedBy: patch.postUpdate.changedBy,
            createdAt: new Date().toISOString(),
          },
          ...(existing.updates ?? []),
        ]
      : existing.updates,
  });

  await writeFilePosts(filePosts);
  return filePosts[index];
}

export async function deleteAdminBlogPost(slug: string): Promise<boolean> {
  if (isDatabaseConfigured()) {
    await ensureBlogPostsSchema();
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

export async function readAdminBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await readAdminBlogPosts();
  return posts.find((post) => post.slug === slug) ?? null;
}

export async function createAdminPostUpdate(input: {
  slug: string;
  changeType: string;
  note?: string;
  changedBy?: string;
}): Promise<BlogPost | null> {
  const normalizedType = input.changeType.trim();
  if (!normalizedType) {
    return null;
  }

  return updateAdminBlogPost(input.slug, {
    postUpdate: {
      changeType: normalizedType,
      note: input.note,
      changedBy: input.changedBy,
    },
  });
}
