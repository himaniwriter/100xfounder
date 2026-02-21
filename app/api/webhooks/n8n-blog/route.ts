import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildExcerpt, countWords, slugify } from "@/lib/blog/post-utils";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";
import { ensureBlogPostsSchema } from "@/lib/db-bootstrap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookPayloadSchema = z.object({
  title: z.string().trim().min(4).max(220),
  subtitle: z.string().trim().max(220).optional(),
  content: z.string().trim().min(1),
  author: z.string().trim().min(2).max(120).optional(),
  feature_image: z.string().trim().url(),
  image_credit: z.string().trim().max(240).optional(),
  article_type: z.string().trim().min(2).max(64).optional(),
  topic_slug: z.string().trim().min(2).max(120).optional(),
  canonical_url: z.string().trim().url().optional(),
  source_urls: z.array(z.string().trim().url()).max(30).optional(),
  fact_check_status: z.string().trim().min(2).max(64).optional(),
  discover_ready: z.boolean().optional(),
  social_image_url: z.string().trim().url().optional(),
  published_at: z.string().datetime().optional(),
  citations: z
    .array(
      z.object({
        source_name: z.string().trim().min(2).max(160),
        source_url: z.string().trim().url(),
        source_title: z.string().trim().min(2).max(220),
        quoted_claim: z.string().trim().max(1000).optional(),
      }),
    )
    .max(30)
    .optional(),
  seo_metadata: z
    .object({
      title: z.string().trim().min(4).max(220).optional(),
      description: z.string().trim().min(10).max(320).optional(),
    })
    .optional(),
});

function methodNotAllowed() {
  return NextResponse.json(
    { success: false, error: "Method not allowed. Use POST." },
    { status: 405, headers: { Allow: "POST" } },
  );
}

function safeCompareSecret(provided: string, expected: string): boolean {
  const left = Buffer.from(provided);
  const right = Buffer.from(expected);
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

function isAuthorizedRequest(request: Request): boolean {
  const configuredSecret = process.env.N8N_BLOG_SECRET?.trim() || "";
  const requestSecret = request.headers.get("x-secret-key")?.trim() || "";

  if (!configuredSecret || !requestSecret) {
    return false;
  }

  return safeCompareSecret(requestSecret, configuredSecret);
}

async function buildUniqueSlugFromTitle(title: string): Promise<string> {
  const baseSlug = slugify(title) || "untitled-post";
  let candidate = baseSlug;
  let suffix = 1;

  while (true) {
    const existing = await prisma.post.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    candidate = `${baseSlug}-${suffix}`;
    suffix += 1;
  }
}

function mapSavedPost(post: {
  id: string;
  title: string;
  subtitle: string | null;
  content: string;
  slug: string;
  articleType: string;
  topicSlug: string | null;
  featureImage: string;
  imageCredit: string | null;
  author: string;
  canonicalUrl: string | null;
  sourceUrlsJson: unknown;
  factCheckStatus: string;
  discoverReady: boolean;
  socialImageUrl: string | null;
  seoTitle: string;
  seoDescription: string;
  wordCount: number;
  status: "DRAFT" | "PUBLISHED";
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: post.id,
    title: post.title,
    subtitle: post.subtitle,
    content: post.content,
    slug: post.slug,
    article_type: post.articleType,
    topic_slug: post.topicSlug,
    feature_image: post.featureImage,
    image_credit: post.imageCredit,
    author: post.author,
    canonical_url: post.canonicalUrl,
    source_urls: Array.isArray(post.sourceUrlsJson) ? post.sourceUrlsJson : [],
    fact_check_status: post.factCheckStatus,
    discover_ready: post.discoverReady,
    social_image_url: post.socialImageUrl,
    seo_title: post.seoTitle,
    seo_description: post.seoDescription,
    word_count: post.wordCount,
    status: post.status === "DRAFT" ? "draft" : "published",
    published_at: post.publishedAt?.toISOString() ?? null,
    created_at: post.createdAt.toISOString(),
    updated_at: post.updatedAt.toISOString(),
  };
}

export async function GET() {
  return methodNotAllowed();
}

export async function PUT() {
  return methodNotAllowed();
}

export async function PATCH() {
  return methodNotAllowed();
}

export async function DELETE() {
  return methodNotAllowed();
}

export async function POST(request: Request) {
  if (!isAuthorizedRequest(request)) {
    return NextResponse.json(
      { success: false, error: "Unauthorized." },
      { status: 401 },
    );
  }

  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      {
        success: false,
        error: "Database is not configured. Add DATABASE_URL in .env.local, then restart the server.",
      },
      { status: 500 },
    );
  }

  const json = await request.json().catch(() => null);
  const parsed = webhookPayloadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        success: false,
        error: "Invalid webhook payload.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const content = parsed.data.content.trim();
  const wordCount = countWords(content);
  if (wordCount < 400) {
    return NextResponse.json(
      {
        success: false,
        error: "need atleast 400 words",
        wordCount,
      },
      { status: 400 },
    );
  }

  const title = parsed.data.title.trim();
  await ensureBlogPostsSchema();
  const slug = await buildUniqueSlugFromTitle(title);
  const seoTitle = parsed.data.seo_metadata?.title?.trim() || title;
  const seoDescription =
    parsed.data.seo_metadata?.description?.trim() || buildExcerpt(content);

  try {
    const post = await prisma.$transaction(async (tx) => {
      const created = await tx.post.create({
        data: {
          title,
          subtitle: parsed.data.subtitle?.trim() || null,
          content,
          slug,
          articleType: parsed.data.article_type?.trim() || "analysis",
          topicSlug: parsed.data.topic_slug?.trim() || null,
          featureImage: parsed.data.feature_image,
          imageCredit: parsed.data.image_credit?.trim() || null,
          author: parsed.data.author?.trim() || "100Xfounder Research",
          canonicalUrl: parsed.data.canonical_url?.trim() || null,
          sourceUrlsJson: parsed.data.source_urls ?? [],
          factCheckStatus: parsed.data.fact_check_status?.trim() || "pending_review",
          discoverReady: parsed.data.discover_ready ?? false,
          socialImageUrl: parsed.data.social_image_url?.trim() || null,
          seoTitle,
          seoDescription,
          wordCount,
          status: "DRAFT",
          publishedAt: parsed.data.published_at ? new Date(parsed.data.published_at) : null,
        },
      });

      if (parsed.data.citations?.length) {
        await tx.postCitation.createMany({
          data: parsed.data.citations.map((item) => ({
            postId: created.id,
            sourceName: item.source_name,
            sourceUrl: item.source_url,
            sourceTitle: item.source_title,
            quotedClaim: item.quoted_claim?.trim() || null,
          })),
        });
      }

      await tx.postUpdate.create({
        data: {
          postId: created.id,
          changeType: "webhook_draft_created",
          note: "Draft imported from n8n webhook",
        },
      });

      return tx.post.findUniqueOrThrow({
        where: { id: created.id },
      });
    });

    return NextResponse.json({ post: mapSavedPost(post) }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: toPublicDatabaseError(error, "Failed to save webhook blog post."),
      },
      { status: 500 },
    );
  }
}
