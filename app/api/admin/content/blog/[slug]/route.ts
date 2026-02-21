import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  deleteAdminBlogPost,
  readAdminBlogPostBySlug,
  updateAdminBlogPost,
} from "@/lib/admin/blog-content-store";

const updateBlogSchema = z.object({
  title: z.string().min(4).optional(),
  subtitle: z.string().max(220).optional(),
  excerpt: z.string().min(10).optional(),
  category: z.string().min(2).optional(),
  readingTime: z.string().min(3).optional(),
  thumbnail: z.string().min(1).optional(),
  imageCredit: z.string().max(240).optional(),
  author: z.string().min(2).optional(),
  authorId: z.string().uuid().optional(),
  content: z.string().min(20).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  articleType: z.string().min(2).max(64).optional(),
  topicSlug: z.string().min(2).max(120).optional(),
  canonicalUrl: z.string().url().optional(),
  sourceUrls: z.array(z.string().url()).max(30).optional(),
  factCheckStatus: z.string().min(2).max(64).optional(),
  correctionNote: z.string().max(2000).optional(),
  discoverReady: z.boolean().optional(),
  socialImageUrl: z.string().url().optional(),
  publishedAt: z.string().datetime().optional(),
  citations: z
    .array(
      z.object({
        sourceName: z.string().min(2).max(160),
        sourceUrl: z.string().url(),
        sourceTitle: z.string().min(2).max(220),
        quotedClaim: z.string().max(1000).optional(),
      }),
    )
    .max(30)
    .optional(),
  postUpdate: z
    .object({
      changeType: z.string().min(2).max(64),
      note: z.string().max(2000).optional(),
      changedBy: z.string().max(160).optional(),
    })
    .optional(),
  seoTitle: z.string().min(4).optional(),
  seoDescription: z.string().min(10).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
});

export async function GET(
  request: NextRequest,
  context: { params: { slug: string } },
) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const post = await readAdminBlogPostBySlug(context.params.slug);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load blog post.",
      },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { slug: string } },
) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = updateBlogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid blog update payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const post = await updateAdminBlogPost(context.params.slug, parsed.data);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, post });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to update blog post.",
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { slug: string } },
) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const deleted = await deleteAdminBlogPost(context.params.slug);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to delete blog post.",
      },
      { status: 500 },
    );
  }
}
