import { getHtmlSitemapData } from "@/lib/sitemap";

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
  const {
    baseUrl,
    staticLinks,
    blogLinks,
    countryLinks,
    tierLinks,
    companyLinks,
    founderLinks,
    industryLinks,
    stageLinks,
    countryIndustryLinks,
  } = await getHtmlSitemapData();

  const links = [
    ...staticLinks,
    ...blogLinks,
    ...countryLinks,
    ...tierLinks,
    ...industryLinks,
    ...stageLinks,
    ...countryIndustryLinks,
    ...companyLinks.slice(0, 2000),
    ...founderLinks.slice(0, 2000),
  ];

  const unique = Array.from(
    new Map(links.map((item) => [item.href, item])).values(),
  );

  const body = unique
    .map((item) => {
      const loc = `${baseUrl}${item.href}`;
      const lastMod = item.lastModified.toISOString();
      return `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastMod}</lastmod></url>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
