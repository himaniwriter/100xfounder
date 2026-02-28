import type { MetadataRoute } from "next";
import { getAllBlogPosts } from "@/lib/blog/store";
import { countryTierLabel, countryToSlug } from "@/lib/founders/country-tier";
import { slugifySegment } from "@/lib/founders/hubs";
import { getCountryCoverage, getFounderDirectory } from "@/lib/founders/store";
import { getFundingRoundOptions, getTopicSummaries } from "@/lib/news/hubs";
import { getSalaryEquityOverview } from "@/lib/salary-equity/store";
import { isPathEligibleForSitemap } from "@/lib/seo/indexability";
import {
  getJobsOverview,
  getStartupTaxonomyOptions,
} from "@/lib/startups/catalog";

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

export type CategorizedSitemapLinks = {
  pages: HtmlSitemapLink[];
  categories: HtmlSitemapLink[];
  posts: HtmlSitemapLink[];
  news: HtmlSitemapLink[];
  directory: HtmlSitemapLink[];
};

const STATIC_ROUTES: StaticRoute[] = [
  { href: "/", label: "Home", changeFrequency: "daily", priority: 1 },
  { href: "/founders", label: "Founder Directory", changeFrequency: "daily", priority: 0.95 },
  { href: "/countries", label: "Countries", changeFrequency: "daily", priority: 0.92 },
  { href: "/startups", label: "Startup Explorer", changeFrequency: "weekly", priority: 0.85 },
  { href: "/startups/industry", label: "Startups by Industry", changeFrequency: "daily", priority: 0.86 },
  { href: "/startups/location", label: "Startups by Location", changeFrequency: "daily", priority: 0.86 },
  { href: "/startups/funding-round", label: "Startups by Funding Round", changeFrequency: "daily", priority: 0.86 },
  { href: "/startups/investor", label: "Startups by Investor", changeFrequency: "daily", priority: 0.84 },
  { href: "/startups/jobs", label: "Startup Jobs", changeFrequency: "hourly", priority: 0.84 },
  { href: "/startups/salary-equity", label: "Salary Equity Database", changeFrequency: "daily", priority: 0.8 },
  { href: "/signals", label: "Signals", changeFrequency: "hourly", priority: 0.9 },
  { href: "/pricing", label: "Pricing", changeFrequency: "weekly", priority: 0.8 },
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
  { href: "/sitemap", label: "Sitemap (HTML)", changeFrequency: "weekly", priority: 0.7 },
];

function normalizeBaseUrl(value: string): string {
  const withProtocol = /^https?:\/\//i.test(value) ? value : `https://${value}`;
  return withProtocol.replace(/\/+$/, "");
}

export function getSiteBaseUrl(): string {
  const canonicalProductionUrl = "https://100xfounder.com";
  return normalizeBaseUrl(canonicalProductionUrl);
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

function filterIndexableLinks(items: HtmlSitemapLink[]): HtmlSitemapLink[] {
  return items.filter((item) => isPathEligibleForSitemap(item.href));
}

function sortLinksByLabel(items: HtmlSitemapLink[]): HtmlSitemapLink[] {
  return [...items].sort((a, b) => a.label.localeCompare(b.label));
}

export async function getHtmlSitemapData(): Promise<HtmlSitemapData> {
  const baseUrl = getSiteBaseUrl();
  const now = new Date();
  const [
    founders,
    countryCoverage,
    blogPosts,
    topics,
    fundingRoundOptions,
    startupIndustryOptions,
    startupLocationOptions,
    startupRoundOptions,
    startupInvestorOptions,
    jobsOverview,
    salaryOverview,
  ] =
    await Promise.all([
      getFounderDirectory(),
      getCountryCoverage(),
      getAllBlogPosts(),
      getTopicSummaries(250),
      getFundingRoundOptions(80),
      getStartupTaxonomyOptions("industry"),
      getStartupTaxonomyOptions("location"),
      getStartupTaxonomyOptions("funding-round"),
      getStartupTaxonomyOptions("investor"),
      getJobsOverview(),
      getSalaryEquityOverview(),
    ]);

  const staticLinks = filterIndexableLinks(
    STATIC_ROUTES.map((route) => ({
      href: route.href,
      label: route.label,
      lastModified: now,
    })),
  );

  const blogLinks = filterIndexableLinks(uniqueByHref(
    blogPosts
      .map((post) => ({
        href: `/blog/${post.slug}`,
        label: post.title,
        lastModified: Number.isNaN(Date.parse(post.publishedAt))
          ? now
          : new Date(post.publishedAt),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const startupCategoryLinks = filterIndexableLinks(
    uniqueByHref(
      [
        ...startupIndustryOptions
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/industry/${item.slug}`,
            label: `${item.label} startups`,
            lastModified: now,
          })),
        ...startupLocationOptions
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/location/${item.slug}`,
            label: `${item.label} startups`,
            lastModified: now,
          })),
        ...startupRoundOptions
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/funding-round/${item.slug}`,
            label: `${item.label} startups`,
            lastModified: now,
          })),
        ...startupInvestorOptions
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/investor/${item.slug}`,
            label: `${item.label}-backed startups`,
            lastModified: now,
          })),
        ...jobsOverview.byLocation
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/jobs/location/${item.slug}`,
            label: `Startup jobs in ${item.label}`,
            lastModified: now,
          })),
        ...jobsOverview.byRole
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/jobs/role/${item.slug}`,
            label: `${item.label} startup jobs`,
            lastModified: now,
          })),
        ...jobsOverview.byTitle
          .filter((item) => item.count >= 0)
          .slice(0, 300)
          .map((item) => ({
            href: `/startups/jobs/title/${item.slug}`,
            label: `${item.label} startup jobs`,
            lastModified: now,
          })),
        ...jobsOverview.byMarket
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/jobs/market/${item.slug}`,
            label: `${item.label} startup jobs`,
            lastModified: now,
          })),
        ...salaryOverview.byLocation
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/salary-equity/location/${item.slug}`,
            label: `${item.label} salary benchmarks`,
            lastModified: now,
          })),
        ...salaryOverview.byRole
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/salary-equity/role/${item.slug}`,
            label: `${item.label} salary benchmarks`,
            lastModified: now,
          })),
        ...salaryOverview.byStage
          .filter((item) => item.count >= 0)
          .map((item) => ({
            href: `/startups/salary-equity/stage/${item.slug}`,
            label: `${item.label} salary benchmarks`,
            lastModified: now,
          })),
      ].sort((a, b) => a.label.localeCompare(b.label)),
    ),
  );

  const countryLinks = filterIndexableLinks(uniqueByHref(
    countryCoverage
      .map((item) => ({
        href: `/countries/${item.countrySlug}`,
        label: `${item.country} startups`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const countryNewsLinks = filterIndexableLinks(uniqueByHref(
    countryCoverage
      .map((item) => ({
        href: `/countries/${item.countrySlug}/news`,
        label: `${item.country} startup news`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const tierLinks = filterIndexableLinks(uniqueByHref(
    Array.from(new Set(countryCoverage.map((item) => item.tier)))
      .map((tier) => ({
        href: `/countries/tier/${tier.toLowerCase()}`,
        label: `${countryTierLabel(tier)} countries`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const industryLinks = filterIndexableLinks(uniqueByHref(
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
  ));

  const stageLinks = filterIndexableLinks(uniqueByHref(
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
  ));

  const countryIndustryLinks = filterIndexableLinks(uniqueByHref(
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
  ));

  const companyLinks = filterIndexableLinks(uniqueByHref(
    founders
      .map((item) => ({
        href: `/company/${item.companySlug}`,
        label: item.companyName,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const companyNewsLinks = filterIndexableLinks(uniqueByHref(
    founders
      .map((item) => ({
        href: `/companies/${item.companySlug}/news`,
        label: `${item.companyName} news`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const topicLinks = filterIndexableLinks(uniqueByHref(
    topics
      .map((topic) => ({
        href: `/topics/${topic.slug}`,
        label: `${topic.label} topic news`,
        lastModified: new Date(topic.lastPublishedAt),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const fundingRoundLinks = filterIndexableLinks(uniqueByHref(
    fundingRoundOptions
      .map((item) => ({
        href: `/funding-rounds/${item.slug}`,
        label: `${item.label} funding news`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

  const founderLinks = filterIndexableLinks(uniqueByHref(
    founders
      .map((item) => ({
        href: `/founders/${item.slug}`,
        label: `${item.founderName} (${item.companyName})`,
        lastModified: now,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ));

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

export async function getCategorizedSitemapLinks(): Promise<CategorizedSitemapLinks> {
  const data = await getHtmlSitemapData();

  const pages = sortLinksByLabel(uniqueByHref(data.staticLinks));

  const categories = sortLinksByLabel(
    filterIndexableLinks(
      uniqueByHref([
        ...data.startupCategoryLinks,
        ...data.countryLinks,
        ...data.tierLinks,
        ...data.industryLinks,
        ...data.stageLinks,
        ...data.countryIndustryLinks,
      ]),
    ),
  );

  const posts = sortLinksByLabel(uniqueByHref(data.blogLinks));

  const news = sortLinksByLabel(
    filterIndexableLinks(
      uniqueByHref([
        ...data.topicLinks,
        ...data.fundingRoundLinks,
        ...data.countryNewsLinks,
        ...data.companyNewsLinks,
      ]),
    ),
  );

  const directory = sortLinksByLabel(
    filterIndexableLinks(uniqueByHref([...data.companyLinks, ...data.founderLinks])),
  );

  return {
    pages,
    categories,
    posts,
    news,
    directory,
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
  ].filter((entry) => {
    const path = entry.url.replace(baseUrl, "") || "/";
    return isPathEligibleForSitemap(path);
  });
}
