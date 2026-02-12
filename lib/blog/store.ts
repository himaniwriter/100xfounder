import rawPosts from "@/lib/blog/blog-data.json";
import type { BlogHeading, BlogPost } from "@/lib/blog/types";

function parseDateValue(value: string): number {
  const time = Date.parse(value);
  return Number.isNaN(time) ? 0 : time;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function getAllBlogPosts(): BlogPost[] {
  return [...(rawPosts as BlogPost[])].sort(
    (a, b) => parseDateValue(b.publishedAt) - parseDateValue(a.publishedAt),
  );
}

export function getBlogPostBySlug(slug: string): BlogPost | null {
  return getAllBlogPosts().find((post) => post.slug === slug) ?? null;
}

export function getBlogHomeSections() {
  const posts = getAllBlogPosts();
  const featured = posts.find((post) => post.isFeatured) ?? posts[0] ?? null;

  const trending = posts
    .filter((post) => post.isTrending && post.slug !== featured?.slug)
    .slice(0, 3);

  const recent = posts
    .filter(
      (post) =>
        post.slug !== featured?.slug &&
        !trending.some((item) => item.slug === post.slug),
    )
    .slice(0, 9);

  return { posts, featured, trending, recent };
}

export function extractHeadings(content: string): BlogHeading[] {
  return content
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("## ") || line.startsWith("### "))
    .map((line): BlogHeading => {
      const level = line.startsWith("### ") ? 3 : 2;
      const text = line.replace(/^###?\s+/, "").trim();
      return {
        id: slugify(text),
        text,
        level,
      };
    });
}
