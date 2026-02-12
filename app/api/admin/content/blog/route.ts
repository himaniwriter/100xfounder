import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requireAdminApi } from "@/lib/auth/admin-guard";
import {
  buildUniqueBlogSlug,
  readAdminBlogPosts,
  writeAdminBlogPosts,
} from "@/lib/admin/blog-content-store";
import type { BlogPost } from "@/lib/blog/types";

const createBlogSchema = z.object({
  title: z.string().min(4),
  slug: z.string().min(2).optional(),
  excerpt: z.string().min(10),
  category: z.string().min(2),
  readingTime: z.string().min(3),
  thumbnail: z.string().min(1),
  author: z.string().min(2),
  content: z.string().min(20),
  status: z.enum(["DRAFT", "PUBLISHED"]).default("DRAFT"),
  seoTitle: z.string().min(4).optional(),
  seoDescription: z.string().min(10).optional(),
  isFeatured: z.boolean().optional(),
  isTrending: z.boolean().optional(),
});

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export async function GET(request: NextRequest) {
  const access = await requireAdminApi(request);
  if (access instanceof NextResponse) {
    return access;
  }

  try {
    const posts = await readAdminBlogPosts();
    return NextResponse.json({ success: true, posts });
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
    const posts = await readAdminBlogPosts();
    const requestedSlug = slugify(parsed.data.slug ?? parsed.data.title);
    const slug = await buildUniqueBlogSlug(requestedSlug);
    const now = new Date().toISOString().slice(0, 10);

    const nextPost: BlogPost = {
      slug,
      title: parsed.data.title,
      excerpt: parsed.data.excerpt,
      category: parsed.data.category,
      readingTime: parsed.data.readingTime,
      thumbnail: parsed.data.thumbnail,
      publishedAt: parsed.data.status === "PUBLISHED" ? now : "2099-01-01",
      isFeatured: parsed.data.isFeatured ?? false,
      isTrending: parsed.data.isTrending ?? false,
      author: parsed.data.author,
      content: parsed.data.content,
      status: parsed.data.status,
      seoTitle: parsed.data.seoTitle ?? parsed.data.title,
      seoDescription: parsed.data.seoDescription ?? parsed.data.excerpt,
    };

    posts.unshift(nextPost);
    await writeAdminBlogPosts(posts);

    return NextResponse.json({ success: true, post: nextPost }, { status: 201 });
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
