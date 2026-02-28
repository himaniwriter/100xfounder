import type { HtmlSitemapLink } from "@/lib/sitemap";

function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

type SitemapIndexItem = {
  loc: string;
  lastmod?: Date | string;
};

export function buildSitemapIndexXml(items: SitemapIndexItem[]): string {
  const body = items
    .map((item) => {
      const lastmod = item.lastmod
        ? `<lastmod>${new Date(item.lastmod).toISOString()}</lastmod>`
        : "";
      return `  <sitemap><loc>${xmlEscape(item.loc)}</loc>${lastmod}</sitemap>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</sitemapindex>`;
}

export function buildUrlSetXml(baseUrl: string, links: HtmlSitemapLink[]): string {
  const unique = Array.from(new Map(links.map((item) => [item.href, item])).values());

  const body = unique
    .map((item) => {
      const loc = `${baseUrl}${item.href}`;
      const lastMod = item.lastModified.toISOString();
      return `  <url><loc>${xmlEscape(loc)}</loc><lastmod>${lastMod}</lastmod></url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`;
}
