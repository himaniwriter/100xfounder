import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  readAdminBlogPostBySlug,
  updateAdminBlogPost,
} from "@/lib/admin/blog-content-store";
import { assessPublishReadiness } from "@/lib/news/service";
import { revalidateNewsroomPaths } from "@/lib/blog/revalidate";

const publishSchema = z.object({
  slug: z.string().min(2),
  publishAt: z.string().datetime().optional(),
  note: z.string().max(2000).optional(),
  republish: z.boolean().optional(),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  const body = await request.json().catch(() => null);
  const parsed = publishSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid publish payload." },
      { status: 400 },
    );
  }

  const slug = parsed.data.slug.trim();

  try {
    const post = await readAdminBlogPostBySlug(slug);
    if (!post) {
      return NextResponse.json(
        { success: false, error: "Post not found." },
        { status: 404 },
      );
    }

    const readiness = assessPublishReadiness(post);
    if (!readiness.passed) {
      return NextResponse.json(
        {
          success: false,
          error: "Post is not publish-ready.",
          readiness,
        },
        { status: 400 },
      );
    }

    const shouldRepublish = parsed.data.republish ?? false;
    const nextPublishedAt = parsed.data.publishAt
      ? new Date(parsed.data.publishAt).toISOString()
      : shouldRepublish
        ? new Date().toISOString()
        : post.publishedAt;

    const updated = await updateAdminBlogPost(slug, {
      status: "PUBLISHED",
      publishedAt: nextPublishedAt,
      postUpdate: {
        changeType: shouldRepublish ? "republished" : "published",
        note: parsed.data.note?.trim() || "Published via admin newsroom workflow",
        changedBy: access.session.email,
      },
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Failed to publish post." },
        { status: 500 },
      );
    }
    revalidateNewsroomPaths(updated.slug);

    return NextResponse.json({
      success: true,
      post: updated,
      readiness,
      feedsRefreshed: true,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to publish post.",
      },
      { status: 500 },
    );
  }
}
