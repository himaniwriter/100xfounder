import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { getHtmlSitemapData } from "@/lib/sitemap";

export const metadata: Metadata = {
  title: "Sitemap | 100Xfounder",
  description:
    "Browse all major pages, country clusters, founder profiles, company pages, and blog articles on 100Xfounder.",
};

type SectionProps = {
  title: string;
  links: Array<{ href: string; label: string }>;
};

function SitemapSection({ title, links }: SectionProps) {
  return (
    <section className="rounded-2xl border border-white/15 bg-white/[0.03] p-5 backdrop-blur-[40px]">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-white">{title}</h2>
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

export default async function HtmlSitemapPage() {
  const {
    baseUrl,
    staticLinks,
    blogLinks,
    startupCategoryLinks,
    countryLinks,
    tierLinks,
    industryLinks,
    stageLinks,
    countryIndustryLinks,
    companyLinks,
    founderLinks,
  } =
    await getHtmlSitemapData();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h1 className="text-3xl font-semibold tracking-tight text-white">Sitemap</h1>
          <p className="mt-2 max-w-3xl text-sm text-zinc-400">
            Crawl-friendly navigation for all key pages on 100Xfounder.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Base URL: {baseUrl}
            </span>
            <a
              href="/sitemap.xml"
              className="rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-indigo-300 transition-colors hover:bg-indigo-500/20"
            >
              Open XML Sitemap
            </a>
            <a
              href="/ai-sitemap.xml"
              className="rounded-full border border-indigo-400/35 bg-indigo-500/10 px-2.5 py-1 text-indigo-300 transition-colors hover:bg-indigo-500/20"
            >
              Open AI Sitemap
            </a>
          </div>
        </div>

        <div className="grid gap-5">
          <SitemapSection title="Core Pages" links={staticLinks} />
          <SitemapSection title="Industry Pages" links={industryLinks} />
          <SitemapSection title="Stage Pages" links={stageLinks} />
          <SitemapSection title="Country Tier Pages" links={tierLinks} />
          <SitemapSection title="Country Pages" links={countryLinks} />
          <SitemapSection title="Country + Industry Pages" links={countryIndustryLinks} />
          <SitemapSection title="Startup Category Pages" links={startupCategoryLinks} />
          <SitemapSection title="Blog Articles" links={blogLinks} />
          <SitemapSection title="Company Profiles" links={companyLinks} />
          <SitemapSection title="Founder Profiles" links={founderLinks} />
        </div>
      </section>

      <Footer />
    </main>
  );
}
