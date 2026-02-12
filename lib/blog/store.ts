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
  return getAllBlogPostsWithOptions();
}

export function normalizeBlogPost(post: BlogPost): BlogPost {
  return {
    ...post,
    status: post.status ?? "PUBLISHED",
    seoTitle: post.seoTitle ?? post.title,
    seoDescription: post.seoDescription ?? post.excerpt,
  };
}

export function getAllBlogPostsWithOptions(
  options: { includeDrafts?: boolean } = {},
): BlogPost[] {
  const includeDrafts = options.includeDrafts ?? false;

  return [...(rawPosts as BlogPost[])]
    .map(normalizeBlogPost)
    .filter((post) => includeDrafts || post.status === "PUBLISHED")
    .sort((a, b) => parseDateValue(b.publishedAt) - parseDateValue(a.publishedAt));
}

export function getBlogPostBySlug(
  slug: string,
  options: { includeDrafts?: boolean } = {},
): BlogPost | null {
  return getAllBlogPostsWithOptions(options).find((post) => post.slug === slug) ?? null;
}

export function getBlogHomeSections() {
  const posts = getAllBlogPostsWithOptions();
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
  if (/<\/?[a-z][\s\S]*>/i.test(content)) {
    const headingMatches = Array.from(
      content.matchAll(/<h([23])[^>]*>(.*?)<\/h\1>/gi),
    );

    return headingMatches
      .map((match) => {
        const level = Number(match[1]) as 2 | 3;
        const text = match[2].replace(/<[^>]+>/g, "").trim();
        if (!text) {
          return null;
        }

        return {
          id: slugify(text),
          text,
          level,
        } satisfies BlogHeading;
      })
      .filter((item): item is BlogHeading => Boolean(item));
  }

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
