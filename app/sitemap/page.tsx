import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import {
  getCategorizedSitemapLinks,
  getHtmlSitemapData,
  getSiteBaseUrl,
} from "@/lib/sitemap";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Sitemap | 100Xfounder",
  description:
    "Browse all major pages, country clusters, founder profiles, company pages, and blog articles on 100Xfounder.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/sitemap`,
  },
};

type SectionProps = {
  title: string;
  links: Array<{ href: string; label: string }>;
  helperText?: string;
};

function SitemapSection({ title, links, helperText }: SectionProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-white">{title}</h2>
          {helperText ? <p className="mt-1 text-xs text-zinc-500">{helperText}</p> : null}
        </div>
        <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-xs text-zinc-300">
          {links.length}
        </span>
      </div>
      <ul className="grid gap-2 sm:grid-cols-2">
        {links.map((link) => (
          <li key={`${title}-${link.href}`}>
            <Link
              href={link.href}
              className="line-clamp-1 rounded-md border border-transparent px-2 py-1.5 text-sm text-zinc-300 transition-colors hover:border-white/15 hover:bg-white/[0.03] hover:text-white"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function limitLinks(
  links: Array<{ href: string; label: string }>,
  limit: number,
) {
  return links.slice(0, Math.max(1, limit));
}

export default async function HtmlSitemapPage() {
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
  } = await getHtmlSitemapData();
  const categorized = await getCategorizedSitemapLinks();

  const xmlSitemapLinks = [
    { href: "/sitemap.xml", label: "Sitemap Index" },
    { href: "/sitemap-pages.xml", label: "Pages XML" },
    { href: "/sitemap-categories.xml", label: "Categories XML" },
    { href: "/sitemap-posts.xml", label: "Posts XML" },
    { href: "/sitemap-news.xml", label: "News Hubs XML" },
    { href: "/sitemap-directory.xml", label: "Directory XML" },
    { href: "/news-sitemap.xml", label: "Google News XML" },
    { href: "/ai-sitemap.xml", label: "AI Sitemap XML" },
    { href: "/ai-sitemap-news.xml", label: "AI News Sitemap XML" },
  ];

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Sitemap</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Crawl-friendly navigation grouped by pages, categories, posts, and news so search
            engines can discover URLs faster.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Base URL: {baseUrl}
            </span>
            {xmlSitemapLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-indigo-300 transition-colors hover:bg-indigo-500/20"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

        <div className="grid gap-5">
          <SitemapSection
            title="Pages"
            links={categorized.pages}
            helperText="Primary indexable pages and key navigation URLs."
          />
          <SitemapSection
            title="Categories"
            links={categorized.categories}
            helperText="Industry, location, startup, and market hub URLs."
          />
          <SitemapSection
            title="Posts"
            links={limitLinks(categorized.posts, 1200)}
            helperText="Published blog and newsroom posts."
          />
          <SitemapSection
            title="News"
            links={categorized.news}
            helperText="Topic hubs, funding hubs, and country/company news hubs."
          />
          <SitemapSection
            title="Directory"
            links={limitLinks(categorized.directory, 1200)}
            helperText="Founder and company profile URLs."
          />

          <SitemapSection title="Core Pages (Extended)" links={staticLinks} />
          <SitemapSection title="Industry Pages" links={industryLinks} />
          <SitemapSection title="Stage Pages" links={stageLinks} />
          <SitemapSection title="Country Tier Pages" links={tierLinks} />
          <SitemapSection title="Country Pages" links={countryLinks} />
          <SitemapSection title="Country News Hubs" links={countryNewsLinks} />
          <SitemapSection title="Country + Industry Pages" links={countryIndustryLinks} />
          <SitemapSection title="Startup Category Pages" links={startupCategoryLinks} />
          <SitemapSection title="News Topic Hubs" links={topicLinks} />
          <SitemapSection title="Funding Round Hubs" links={fundingRoundLinks} />
          <SitemapSection title="News Articles" links={blogLinks} />
          <SitemapSection title="Company Profiles" links={companyLinks} />
          <SitemapSection title="Company News Hubs" links={companyNewsLinks} />
          <SitemapSection title="Founder Profiles" links={founderLinks} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
