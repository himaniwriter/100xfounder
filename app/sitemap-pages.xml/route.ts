import { getCategorizedSitemapLinks, getSiteBaseUrl } from "@/lib/sitemap";
import { buildUrlSetXml } from "@/lib/sitemap-xml";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const grouped = await getCategorizedSitemapLinks();
  const xml = buildUrlSetXml(baseUrl, grouped.pages);

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
