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

function stripHtml(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const posts = await getPublishedNews(100);

  const items = posts
    .map((post) => {
      const link = `${baseUrl}/blog/${post.slug}`;
      const pubDate = new Date(post.publishedAt).toUTCString();
      return `\n    <item>\n      <title>${xmlEscape(post.title)}</title>\n      <link>${xmlEscape(link)}</link>\n      <guid isPermaLink="true">${xmlEscape(link)}</guid>\n      <description>${xmlEscape(post.seoDescription ?? post.excerpt)}</description>\n      <pubDate>${pubDate}</pubDate>\n      <author>${xmlEscape(post.author)}</author>\n      <category>${xmlEscape(post.category)}</category>\n      <content:encoded><![CDATA[${stripHtml(post.content)}]]></content:encoded>\n    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/">\n  <channel>\n    <title>100Xfounder Newsroom</title>\n    <link>${xmlEscape(baseUrl)}</link>\n    <description>Startup news, funding intelligence, and founder coverage from India and the US.</description>\n    <language>en-us</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${items}\n  </channel>\n</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
