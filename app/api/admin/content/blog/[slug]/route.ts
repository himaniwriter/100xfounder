import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  deleteAdminBlogPost,
  updateAdminBlogPost,
} from "@/lib/admin/blog-content-store";

const updateBlogSchema = z.object({
  title: z.string().min(4).optional(),
  excerpt: z.string().min(10).optional(),
  category: z.string().min(2).optional(),
  readingTime: z.string().min(3).optional(),
  thumbnail: z.string().min(1).optional(),
  imageCredit: z.string().max(240).optional(),
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
