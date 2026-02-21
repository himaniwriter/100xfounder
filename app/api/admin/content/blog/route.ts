import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  buildUniqueBlogSlug,
  createAdminBlogPost,
  readAdminBlogPosts,
} from "@/lib/admin/blog-content-store";
import { slugify } from "@/lib/blog/post-utils";

const createBlogSchema = z.object({
  title: z.string().min(4),
  subtitle: z.string().max(220).optional(),
  slug: z.string().min(2).optional(),
  excerpt: z.string().min(10).optional(),
  category: z.string().min(2).optional(),
  readingTime: z.string().min(3).optional(),
  thumbnail: z.string().min(1).optional(),
  imageCredit: z.string().max(240).optional(),
  author: z.string().min(2).optional(),
  authorId: z.string().uuid().optional(),
  content: z.string().min(20),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
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
  seoTitle: z.string().min(4).optional(),
  seoDescription: z.string().min(10).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
});

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const statusFilter = request.nextUrl.searchParams.get("status");
    const posts = await readAdminBlogPosts();
    const filtered =
      statusFilter === "draft"
        ? posts.filter((post) => post.status === "DRAFT")
        : statusFilter === "published"
          ? posts.filter((post) => post.status === "PUBLISHED")
          : posts;

    return NextResponse.json({ success: true, posts: filtered });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to load blog posts.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = createBlogSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid blog payload.", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  try {
    const requestedSlug = slugify(parsed.data.slug ?? parsed.data.title);
    const slug = await buildUniqueBlogSlug(requestedSlug);
    const post = await createAdminBlogPost({
      ...parsed.data,
      slug,
      thumbnail: parsed.data.thumbnail ?? "/images/covers/startup-brief.svg",
      imageCredit: parsed.data.imageCredit,
    });

    return NextResponse.json({ success: true, post }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to create blog post.",
      },
      { status: 500 },
    );
  }
}
