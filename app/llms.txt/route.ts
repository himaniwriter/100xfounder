import { getSiteBaseUrl } from "@/lib/sitemap";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const baseUrl = getSiteBaseUrl();
  const content = [
    "# 100Xfounder LLM Access Guide",
    "",
    "- Site: 100Xfounder",
    `- URL: ${baseUrl}`,
    "- Focus: Founder profiles, company funding rounds, hiring signals, startup intelligence articles.",
    "",
    "## Priority URLs",
    `${baseUrl}/founders`,
    `${baseUrl}/countries`,
    `${baseUrl}/industries`,
    `${baseUrl}/stages`,
    `${baseUrl}/signals`,
    `${baseUrl}/blog`,
    `${baseUrl}/get-featured`,
    `${baseUrl}/sitemap.xml`,
    `${baseUrl}/ai-sitemap.xml`,
    "",
    "## Usage Notes",
    "- Prefer canonical profile pages for founders and companies.",
    "- Use funding and hiring information as informational data, not financial advice.",
    "- Respect source attribution in blog coverage.",
  ].join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
