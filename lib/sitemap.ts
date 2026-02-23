import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog/store";
import { countryTierLabel, countryToSlug } from "@/lib/founders/country-tier";
import { slugifySegment } from "@/lib/founders/hubs";
import { getCountryCoverage, getFounderDirectory } from "@/lib/founders/store";
import { getFundingRoundOptions, getTopicSummaries } from "@/lib/news/hubs";
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
  topicLinks: HtmlSitemapLink[];
  fundingRoundLinks: HtmlSitemapLink[];
  startupCategoryLinks: HtmlSitemapLink[];
  countryLinks: HtmlSitemapLink[];
  countryNewsLinks: HtmlSitemapLink[];
  tierLinks: HtmlSitemapLink[];
  industryLinks: HtmlSitemapLink[];
  stageLinks: HtmlSitemapLink[];
  countryIndustryLinks: HtmlSitemapLink[];
  companyLinks: HtmlSitemapLink[];
  companyNewsLinks: HtmlSitemapLink[];
  founderLinks: HtmlSitemapLink[];
};

const STATIC_ROUTES: StaticRoute[] = [
  { href: "/", label: "Home", changeFrequency: "daily", priority: 1 },
  { href: "/founders", label: "Founder Directory", changeFrequency: "daily", priority: 0.95 },
  { href: "/countries", label: "Countries", changeFrequency: "daily", priority: 0.92 },
  { href: "/startups", label: "Startup Explorer", changeFrequency: "weekly", priority: 0.85 },
  { href: "/signals", label: "Signals", changeFrequency: "hourly", priority: 0.9 },
  { href: "/search", label: "Search", changeFrequency: "weekly", priority: 0.75 },
  { href: "/pricing", label: "Pricing", changeFrequency: "weekly", priority: 0.8 },
  { href: "/feature-now", label: "Feature Now", changeFrequency: "weekly", priority: 0.82 },
  { href: "/get-featured", label: "Get Featured", changeFrequency: "weekly", priority: 0.82 },
  { href: "/interview-questionnaire", label: "Interview Questionnaire", changeFrequency: "weekly", priority: 0.78 },
  { href: "/guest-post-marketplace", label: "Guest Post Marketplace", changeFrequency: "weekly", priority: 0.76 },
  { href: "/guest-post-order", label: "Guest Post Order", changeFrequency: "weekly", priority: 0.75 },
  { href: "/industries", label: "Industries", changeFrequency: "daily", priority: 0.86 },
  { href: "/stages", label: "Stages", changeFrequency: "daily", priority: 0.86 },
  { href: "/blog", label: "Newsroom", changeFrequency: "daily", priority: 0.85 },
  { href: "/topics", label: "News Topics", changeFrequency: "daily", priority: 0.84 },
  { href: "/funding-rounds", label: "Funding Round News", changeFrequency: "daily", priority: 0.83 },
  { href: "/authors", label: "Authors", changeFrequency: "weekly", priority: 0.74 },
  { href: "/editorial-policy", label: "Editorial Policy", changeFrequency: "monthly", priority: 0.62 },
  { href: "/corrections-policy", label: "Corrections Policy", changeFrequency: "monthly", priority: 0.6 },
  { href: "/methodology", label: "Methodology", changeFrequency: "monthly", priority: 0.6 },
  { href: "/about-newsroom", label: "About Newsroom", changeFrequency: "monthly", priority: 0.64 },
  { href: "/contact-newsroom", label: "Contact Newsroom", changeFrequency: "monthly", priority: 0.64 },
  { href: "/llms.txt", label: "LLMS", changeFrequency: "weekly", priority: 0.4 },
  { href: "/ai-sitemap.xml", label: "AI Sitemap", changeFrequency: "daily", priority: 0.45 },
  { href: "/ai-sitemap-news.xml", label: "AI News Sitemap", changeFrequency: "daily", priority: 0.45 },
  { href: "/rss.xml", label: "RSS", changeFrequency: "hourly", priority: 0.55 },
  { href: "/atom.xml", label: "Atom", changeFrequency: "hourly", priority: 0.55 },
  { href: "/news-sitemap.xml", label: "News Sitemap", changeFrequency: "hourly", priority: 0.58 },
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
  const defaultProductionUrl = "https://100xfounder.com";
  const explicit = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL;
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  if (process.env.VERCEL_ENV === "production") {
    return defaultProductionUrl;
  }

  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return normalizeBaseUrl(`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
  }

  if (process.env.VERCEL_URL) {
    return normalizeBaseUrl(`https://${process.env.VERCEL_URL}`);
  }

  return defaultProductionUrl;
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
  const [founders, countryCoverage, blogPosts, topics, fundingRoundOptions] =
    await Promise.all([
      getFounderDirectory(),
      getCountryCoverage(),
      getAllBlogPosts(),
      getTopicSummaries(250),
      getFundingRoundOptions(80),
    ]);

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

  const countryNewsLinks = uniqueByHref(
    countryCoverage
      .map((item) => ({
        href: `/countries/${item.countrySlug}/news`,
        label: `${item.country} startup news`,
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

  const industryLinks = uniqueByHref(
    Array.from(
      new Map(
        founders.map((item) => [slugifySegment(item.industry), item.industry]),
      ).entries(),
    )
      .filter(([slug]) => slug.length > 0)
      .map(([slug, label]) => ({
        href: `/industries/${slug}`,
        label: `${label} startups`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const stageLinks = uniqueByHref(
    Array.from(
      new Map(founders.map((item) => [slugifySegment(item.stage), item.stage])).entries(),
    )
      .filter(([slug]) => slug.length > 0)
      .map(([slug, label]) => ({
        href: `/stages/${slug}`,
        label: `${label} startups`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const countryIndustryLinks = uniqueByHref(
    Array.from(
      new Map(
        founders
          .filter((item) => (item.country ?? "Unknown") !== "Unknown")
          .map((item) => {
            const countrySlug = countryToSlug(item.country ?? "");
            const industrySlug = slugifySegment(item.industry);
            return [
              `${countrySlug}:${industrySlug}`,
              {
                href: `/countries/${countrySlug}/industries/${industrySlug}`,
                label: `${item.industry} startups in ${item.country}`,
                lastModified: now,
              },
            ] as const;
          }),
      ).values(),
    )
      .filter((item) => item.href.includes("/countries/"))
      .slice(0, 3000)
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

  const companyNewsLinks = uniqueByHref(
    founders
      .map((item) => ({
        href: `/companies/${item.companySlug}/news`,
        label: `${item.companyName} news`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const topicLinks = uniqueByHref(
    topics
      .map((topic) => ({
        href: `/topics/${topic.slug}`,
        label: `${topic.label} topic news`,
        lastModified: new Date(topic.lastPublishedAt),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  );

  const fundingRoundLinks = uniqueByHref(
    fundingRoundOptions
      .map((item) => ({
        href: `/funding-rounds/${item.slug}`,
        label: `${item.label} funding news`,
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
    topicLinks,
    fundingRoundLinks,
    startupCategoryLinks,
    countryLinks,
    countryNewsLinks,
    tierLinks,
    industryLinks,
    stageLinks,
    countryIndustryLinks,
    companyLinks,
    companyNewsLinks,
    founderLinks,
  };
}

export async function getXmlSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const {
    baseUrl,
    staticLinks,
    blogLinks,
    topicLinks,
    fundingRoundLinks,
    startupCategoryLinks,
    countryLinks,
    countryNewsLinks,
    tierLinks,
    industryLinks,
    stageLinks,
    countryIndustryLinks,
    companyLinks,
    companyNewsLinks,
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

  const countryNewsEntries: MetadataRoute.Sitemap = countryNewsLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.82,
  }));

  const tierEntries: MetadataRoute.Sitemap = tierLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.82,
  }));

  const industryEntries: MetadataRoute.Sitemap = industryLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.84,
  }));

  const stageEntries: MetadataRoute.Sitemap = stageLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.83,
  }));

  const countryIndustryEntries: MetadataRoute.Sitemap = countryIndustryLinks.map((link) => ({
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

  const companyNewsEntries: MetadataRoute.Sitemap = companyNewsLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.79,
  }));

  const founderEntries: MetadataRoute.Sitemap = founderLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "weekly",
    priority: 0.74,
  }));

  const topicEntries: MetadataRoute.Sitemap = topicLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.82,
  }));

  const fundingRoundEntries: MetadataRoute.Sitemap = fundingRoundLinks.map((link) => ({
    url: `${baseUrl}${link.href}`,
    lastModified: link.lastModified,
    changeFrequency: "daily",
    priority: 0.81,
  }));

  return [
    ...staticEntries,
    ...blogEntries,
    ...startupCategoryEntries,
    ...countryEntries,
    ...countryNewsEntries,
    ...tierEntries,
    ...industryEntries,
    ...stageEntries,
    ...countryIndustryEntries,
    ...topicEntries,
    ...fundingRoundEntries,
    ...companyEntries,
    ...companyNewsEntries,
    ...founderEntries,
  ];
}
