import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import { readAdminBlogPosts, writeAdminBlogPosts } from "@/lib/admin/blog-content-store";

const updateBlogSchema = z.object({
  title: z.string().min(4).optional(),
  excerpt: z.string().min(10).optional(),
  category: z.string().min(2).optional(),
  readingTime: z.string().min(3).optional(),
  thumbnail: z.string().min(1).optional(),
  author: z.string().min(2).optional(),
  content: z.string().min(20).optional(),
  status: z.enum(["DRAFT", "PUBLISHED"]).optional(),
  seoTitle: z.string().min(4).optional(),
  seoDescription: z.string().min(10).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
});

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
    const posts = await readAdminBlogPosts();
    const index = posts.findIndex((post) => post.slug === context.params.slug);

    if (index < 0) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    const existing = posts[index];
    const nextStatus = parsed.data.status ?? existing.status ?? "PUBLISHED";

    posts[index] = {
      ...existing,
      ...parsed.data,
      status: nextStatus,
      publishedAt:
        nextStatus === "PUBLISHED"
          ? existing.publishedAt === "2099-01-01"
            ? new Date().toISOString().slice(0, 10)
            : existing.publishedAt
          : "2099-01-01",
      seoTitle: parsed.data.seoTitle ?? existing.seoTitle ?? existing.title,
      seoDescription:
        parsed.data.seoDescription ?? existing.seoDescription ?? existing.excerpt,
    };

    await writeAdminBlogPosts(posts);
    return NextResponse.json({ success: true, post: posts[index] });
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
    const posts = await readAdminBlogPosts();
    const nextPosts = posts.filter((post) => post.slug !== context.params.slug);

    if (nextPosts.length === posts.length) {
      return NextResponse.json(
        { success: false, error: "Blog post not found." },
        { status: 404 },
      );
    }

    await writeAdminBlogPosts(nextPosts);
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
