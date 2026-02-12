import { promises as fs } from "node:fs";
import path from "node:path";
import type { BlogPost } from "@/lib/blog/types";
import { normalizeBlogPost } from "@/lib/blog/store";

const BLOG_DATA_PATH = path.join(process.cwd(), "lib/blog/blog-data.json");

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeAdminPost(post: BlogPost): BlogPost {
  return normalizeBlogPost({
    ...post,
    slug: slugify(post.slug || post.title),
  });
}

export async function readAdminBlogPosts(): Promise<BlogPost[]> {
  const raw = await fs.readFile(BLOG_DATA_PATH, "utf-8");
  const parsed = JSON.parse(raw) as BlogPost[];
  return parsed.map(normalizeAdminPost);
}

export async function writeAdminBlogPosts(posts: BlogPost[]): Promise<void> {
  const sorted = [...posts].sort((a, b) => {
    const timeA = Date.parse(a.publishedAt || "");
    const timeB = Date.parse(b.publishedAt || "");
    return (Number.isNaN(timeB) ? 0 : timeB) - (Number.isNaN(timeA) ? 0 : timeA);
  });

  await fs.writeFile(BLOG_DATA_PATH, JSON.stringify(sorted, null, 2), "utf-8");
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
