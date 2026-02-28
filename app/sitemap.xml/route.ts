import { getSiteBaseUrl } from "@/lib/sitemap";
import { buildSitemapIndexXml } from "@/lib/sitemap-xml";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();

  const xml = buildSitemapIndexXml([
    { loc: `${baseUrl}/sitemap-pages.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-categories.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-posts.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-news.xml`, lastmod: now },
    { loc: `${baseUrl}/sitemap-directory.xml`, lastmod: now },
    { loc: `${baseUrl}/news-sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/ai-sitemap.xml`, lastmod: now },
    { loc: `${baseUrl}/ai-sitemap-news.xml`, lastmod: now },
  ]);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
