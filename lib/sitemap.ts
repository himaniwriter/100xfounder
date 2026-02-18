import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog/store";
import { countryTierLabel } from "@/lib/founders/country-tier";
import { getCountryCoverage, getFounderDirectory } from "@/lib/founders/store";
import { STARTUP_DISCOVERY_PAGES } from "@/lib/startups/discovery-pages";

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
  startupCategoryLinks: HtmlSitemapLink[];
  countryLinks: HtmlSitemapLink[];
  tierLinks: HtmlSitemapLink[];
  companyLinks: HtmlSitemapLink[];
  founderLinks: HtmlSitemapLink[];
};

const STATIC_ROUTES: StaticRoute[] = [
  { href: "/", label: "Home", changeFrequency: "daily", priority: 1 },
  { href: "/founders", label: "Founder Directory", changeFrequency: "daily", priority: 0.95 },
  { href: "/countries", label: "Countries", changeFrequency: "daily", priority: 0.92 },
  { href: "/startups", label: "Startup Explorer", changeFrequency: "weekly", priority: 0.85 },
  { href: "/signals", label: "Signals", changeFrequency: "hourly", priority: 0.9 },
  { href: "/pricing", label: "Pricing", changeFrequency: "weekly", priority: 0.8 },
  { href: "/get-featured", label: "Get Featured", changeFrequency: "weekly", priority: 0.82 },
  { href: "/blog", label: "Blog", changeFrequency: "daily", priority: 0.85 },
  { href: "/jobs", label: "Startup Jobs", changeFrequency: "weekly", priority: 0.7 },
  { href: "/salary-equity", label: "Salary & Equity Guide", changeFrequency: "weekly", priority: 0.68 },
  { href: "/negotiation-coaching", label: "Negotiation Coaching", changeFrequency: "weekly", priority: 0.66 },
  { href: "/fulfillment-policy", label: "Fulfillment Policy", changeFrequency: "monthly", priority: 0.5 },
  { href: "/add-startup-or-job", label: "Add Startup or Job", changeFrequency: "weekly", priority: 0.72 },
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
  const countryCoverage = await getCountryCoverage();
  const blogPosts = await getAllBlogPosts();

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

  const startupCategoryLinks = uniqueByHref(
    STARTUP_DISCOVERY_PAGES.map((item) => ({
      href: `/startups/${item.slug}`,
      label: item.title,
      lastModified: now,
    })).sort((a, b) => a.label.localeCompare(b.label)),
  );

  const countryLinks = uniqueByHref(
    countryCoverage
      .map((item) => ({
        href: `/countries/${item.countrySlug}`,
        label: `${item.country} startups`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const tierLinks = uniqueByHref(
    Array.from(new Set(countryCoverage.map((item) => item.tier)))
      .map((tier) => ({
        href: `/countries/tier/${tier.toLowerCase()}`,
        label: `${countryTierLabel(tier)} countries`,
        lastModified: now,
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
    startupCategoryLinks,
    countryLinks,
    tierLinks,
    companyLinks,
    founderLinks,
  };
}

export async function getXmlSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const {
    baseUrl,
    staticLinks,
    blogLinks,
    startupCategoryLinks,
    countryLinks,
    tierLinks,
    companyLinks,
    founderLinks,
  } =
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

  const startupCategoryEntries: MetadataRoute.Sitemap = startupCategoryLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.84,
  }));

  const countryEntries: MetadataRoute.Sitemap = countryLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.83,
  }));

  const tierEntries: MetadataRoute.Sitemap = tierLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.82,
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

  return [
    ...staticEntries,
    ...blogEntries,
    ...startupCategoryEntries,
    ...countryEntries,
    ...tierEntries,
    ...companyEntries,
    ...founderEntries,
  ];
}
