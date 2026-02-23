import { getPublishedNews } from "@/lib/news/service";
import { getFundingRoundOptions, getTopicSummaries } from "@/lib/news/hubs";
import { getCountryCoverage, getFounderDirectory } from "@/lib/founders/store";
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
  const [posts, topics, fundingRounds, countryCoverage, founders] = await Promise.all([
    getPublishedNews(1500),
    getTopicSummaries(80),
    getFundingRoundOptions(40),
    getCountryCoverage(),
    getFounderDirectory({ perCountryLimit: 500 }),
  ]);

  const hubs = [
    "/blog",
    "/feature-now",
    "/get-featured",
    "/interview-questionnaire",
    "/guest-post-marketplace",
    "/guest-post-order",
    "/topics",
    "/funding-rounds",
    "/authors",
    "/editorial-policy",
    "/corrections-policy",
    "/methodology",
    "/about-newsroom",
    "/contact-newsroom",
  ];

  const topicHubs = topics.map((item) => `/topics/${item.slug}`);
  const stageHubs = fundingRounds.map((item) => `/funding-rounds/${item.slug}`);
  const countryHubs = countryCoverage.map((item) => `/countries/${item.countrySlug}/news`);
  const companyHubs = Array.from(
    new Set(founders.map((item) => `/companies/${item.companySlug}/news`)),
  ).slice(0, 1200);

  const urls = [
    ...hubs.map((href) => ({ href, updatedAt: new Date().toISOString() })),
    ...topicHubs.map((href) => ({ href, updatedAt: new Date().toISOString() })),
    ...stageHubs.map((href) => ({ href, updatedAt: new Date().toISOString() })),
    ...countryHubs.map((href) => ({ href, updatedAt: new Date().toISOString() })),
    ...companyHubs.map((href) => ({ href, updatedAt: new Date().toISOString() })),
    ...posts.map((post) => ({
      href: `/blog/${post.slug}`,
      updatedAt: post.updatedAt ?? post.publishedAt,
    })),
  ];

  const body = urls
    .map((item) => {
      const loc = `${baseUrl}${item.href}`;
      return `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${new Date(item.updatedAt).toISOString()}</lastmod></url>`;
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
