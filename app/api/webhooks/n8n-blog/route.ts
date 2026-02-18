import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { buildExcerpt, countWords, slugify } from "@/lib/blog/post-utils";
import { isDatabaseConfigured, toPublicDatabaseError } from "@/lib/db-config";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const webhookPayloadSchema = z.object({
  title: z.string().trim().min(4).max(220),
  content: z.string().trim().min(1),
  feature_image: z.string().trim().url(),
  image_credit: z.string().trim().max(240).optional(),
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
  content: string;
  slug: string;
  featureImage: string;
  imageCredit: string | null;
  seoTitle: string;
  seoDescription: string;
  wordCount: number;
  status: "DRAFT" | "PUBLISHED";
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: post.id,
    title: post.title,
    content: post.content,
    slug: post.slug,
    feature_image: post.featureImage,
    image_credit: post.imageCredit,
    seo_title: post.seoTitle,
    seo_description: post.seoDescription,
    word_count: post.wordCount,
    status: post.status === "DRAFT" ? "draft" : "published",
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
  if (wordCount < 800 || wordCount > 1400) {
    return NextResponse.json(
      {
        success: false,
        error: "Content must be between 800 and 1400 words.",
        wordCount,
      },
      { status: 400 },
    );
  }

  const title = parsed.data.title.trim();
  const slug = await buildUniqueSlugFromTitle(title);
  const seoTitle = parsed.data.seo_metadata?.title?.trim() || title;
  const seoDescription =
    parsed.data.seo_metadata?.description?.trim() || buildExcerpt(content);

  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        slug,
        featureImage: parsed.data.feature_image,
        imageCredit: parsed.data.image_credit?.trim() || null,
        seoTitle,
        seoDescription,
        wordCount,
        status: "DRAFT",
      },
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
