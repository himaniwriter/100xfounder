import { getPublishedNews } from "@/lib/news/service";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const posts = (await getPublishedNews(1000)).filter((post) => {
    const age = Date.now() - Date.parse(post.publishedAt);
    return age <= 1000 * 60 * 60 * 24 * 7;
  });

  const body = posts
    .map((post) => {
      const loc = `${baseUrl}/blog/${post.slug}`;
      const publicationDate = new Date(post.publishedAt).toISOString();
      return `  <url>\n    <loc>${xmlEscape(loc)}</loc>\n    <news:news>\n      <news:publication>\n        <news:name>100Xfounder Newsroom</news:name>\n        <news:language>en</news:language>\n      </news:publication>\n      <news:publication_date>${publicationDate}</news:publication_date>\n      <news:title>${xmlEscape(post.title)}</news:title>\n    </news:news>\n  </url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset\n  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"\n>\n${body}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
