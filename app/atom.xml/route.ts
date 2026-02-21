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
  const updated = posts[0]?.updatedAt ?? posts[0]?.publishedAt ?? new Date().toISOString();

  const entries = posts
    .map((post) => {
      const url = `${baseUrl}/blog/${post.slug}`;
      return `\n  <entry>\n    <title>${xmlEscape(post.title)}</title>\n    <id>${xmlEscape(url)}</id>\n    <link href="${xmlEscape(url)}"/>\n    <updated>${new Date(post.updatedAt ?? post.publishedAt).toISOString()}</updated>\n    <published>${new Date(post.publishedAt).toISOString()}</published>\n    <author><name>${xmlEscape(post.author)}</name></author>\n    <summary>${xmlEscape(post.seoDescription ?? post.excerpt)}</summary>\n    <content type="text">${xmlEscape(stripHtml(post.content))}</content>\n  </entry>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="utf-8"?>\n<feed xmlns="http://www.w3.org/2005/Atom">\n  <title>100Xfounder Newsroom</title>\n  <id>${xmlEscape(baseUrl)}/atom.xml</id>\n  <updated>${new Date(updated).toISOString()}</updated>\n  <link href="${xmlEscape(baseUrl)}/atom.xml" rel="self"/>\n  <link href="${xmlEscape(baseUrl)}"/>${entries}\n</feed>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/atom+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
