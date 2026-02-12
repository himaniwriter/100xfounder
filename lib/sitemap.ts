import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog/store";
import { getFounderDirectory } from "@/lib/founders/store";

type ChangeFrequency = NonNullable<MetadataRoute.Sitemap[number]["changeFrequency"]>;

type StaticRoute = {
  href: string;
  label: string;
  changeFrequency: ChangeFrequency;
  priority: number;
};

export type HtmlSitemapLink = {
  href: string;
  label: string;
  lastModified: Date;
};

export type HtmlSitemapData = {
  baseUrl: string;
  staticLinks: HtmlSitemapLink[];
  blogLinks: HtmlSitemapLink[];
  companyLinks: HtmlSitemapLink[];
  founderLinks: HtmlSitemapLink[];
};

const STATIC_ROUTES: StaticRoute[] = [
  { href: "/", label: "Home", changeFrequency: "daily", priority: 1 },
  { href: "/founders", label: "Founder Directory", changeFrequency: "daily", priority: 0.95 },
  { href: "/startups", label: "Startup Explorer", changeFrequency: "weekly", priority: 0.85 },
  { href: "/signals", label: "Signals", changeFrequency: "hourly", priority: 0.9 },
  { href: "/pricing", label: "Pricing", changeFrequency: "weekly", priority: 0.8 },
  { href: "/blog", label: "Blog", changeFrequency: "daily", priority: 0.85 },
  { href: "/about", label: "About", changeFrequency: "monthly", priority: 0.6 },
  { href: "/contact", label: "Contact", changeFrequency: "monthly", priority: 0.6 },
  { href: "/help", label: "Help Center", changeFrequency: "monthly", priority: 0.5 },
  { href: "/changelog", label: "Changelog", changeFrequency: "weekly", priority: 0.55 },
  { href: "/privacy", label: "Privacy", changeFrequency: "yearly", priority: 0.4 },
  { href: "/terms", label: "Terms", changeFrequency: "yearly", priority: 0.4 },
  { href: "/cookies", label: "Cookies", changeFrequency: "yearly", priority: 0.35 },
  { href: "/sitemap", label: "Sitemap (HTML)", changeFrequency: "weekly", priority: 0.7 },
];

function normalizeBaseUrl(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(`https://${process.env.VERCEL_URL}`);
  }

  return "https://100xfounder.com";
}

function uniqueByHref(items: HtmlSitemapLink[]): HtmlSitemapLink[] {
  const seen = new Set<string>();
  const result: HtmlSitemapLink[] = [];

  items.forEach((item) => {
    if (seen.has(item.href)) {
      return;
    }
    seen.add(item.href);
    result.push(item);
  });

  return result;
}

export async function getHtmlSitemapData(): Promise<HtmlSitemapData> {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();
  const founders = await getFounderDirectory();
  const blogPosts = getAllBlogPosts();

  const staticLinks = STATIC_ROUTES.map((route) => ({
    href: route.href,
    label: route.label,
    lastModified: now,
  }));

  const blogLinks = uniqueByHref(
    blogPosts
      .map((post) => ({
        href: `/blog/${post.slug}`,
        label: post.title,
        lastModified: Number.isNaN(Date.parse(post.publishedAt))
          ? now
          : new Date(post.publishedAt),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const companyLinks = uniqueByHref(
    founders
      .map((item) => ({
        href: `/company/${item.companySlug}`,
        label: item.companyName,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const founderLinks = uniqueByHref(
    founders
      .map((item) => ({
        href: `/founders/${item.slug}`,
        label: `${item.founderName} (${item.companyName})`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  return {
    baseUrl,
    staticLinks,
    blogLinks,
    companyLinks,
    founderLinks,
  };
}

export async function getXmlSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const { baseUrl, staticLinks, blogLinks, companyLinks, founderLinks } =
    await getHtmlSitemapData();

  const staticRouteMeta = new Map(STATIC_ROUTES.map((route) => [route.href, route]));

  const staticEntries: MetadataRoute.Sitemap = staticLinks.map((link) => {
    const meta = staticRouteMeta.get(link.href);
    return {
      url: `${baseUrl}${link.href}`,
      lastModified: link.lastModified,
      changeFrequency: meta?.changeFrequency ?? "weekly",
      priority: meta?.priority ?? 0.5,
    };
  });

  const blogEntries: MetadataRoute.Sitemap = blogLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const companyEntries: MetadataRoute.Sitemap = companyLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "weekly",
    priority: 0.76,
  }));

  const founderEntries: MetadataRoute.Sitemap = founderLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "weekly",
    priority: 0.74,
  }));

  return [...staticEntries, ...blogEntries, ...companyEntries, ...founderEntries];
}
