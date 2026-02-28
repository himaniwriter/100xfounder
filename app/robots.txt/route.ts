import { getSiteBaseUrl } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const body = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin",
    "Disallow: /api/admin",
    "Disallow: /dashboard",
    "Disallow: /login",
    "Disallow: /api/auth/",
    "Disallow: /api/webhooks/",
    "Max-image-preview: large",
    "",
    `Sitemap: ${baseUrl}/sitemap.xml`,
    `Sitemap: ${baseUrl}/sitemap-pages.xml`,
    `Sitemap: ${baseUrl}/sitemap-categories.xml`,
    `Sitemap: ${baseUrl}/sitemap-posts.xml`,
    `Sitemap: ${baseUrl}/sitemap-news.xml`,
    `Sitemap: ${baseUrl}/sitemap-directory.xml`,
    `Sitemap: ${baseUrl}/news-sitemap.xml`,
    `Sitemap: ${baseUrl}/ai-sitemap.xml`,
    `Sitemap: ${baseUrl}/ai-sitemap-news.xml`,
    `Sitemap: ${baseUrl}/rss.xml`,
    `Sitemap: ${baseUrl}/atom.xml`,
  ].join("\n");

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
