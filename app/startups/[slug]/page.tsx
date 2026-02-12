import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FounderCard } from "@/components/founder-card";
import { getFounderDirectory, splitRecentlyFunded } from "@/lib/founders/store";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";
import {
  STARTUP_DISCOVERY_PAGES,
  getStartupDiscoveryPage,
  getStartupDiscoverySlugs,
  type StartupDiscoveryPage,
} from "@/lib/startups/discovery-pages";

type StartupCategoryPageProps = {
  params: {
    slug: string;
  };
};

function normalize(value: string | null | undefined): string {
  if (!value) {
    return "";
  }

  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isEarlyStage(stage: string): boolean {
  return /pre[- ]seed|seed|series\s*a/.test(stage);
}

function isGrowthStage(stage: string): boolean {
  return /series\s*b|series\s*c|series\s*d|growth/.test(stage);
}

function isMatureStage(stage: string): boolean {
  return /series\s*e|series\s*f|series\s*g|public|ipo|acquired|late/.test(stage);
}

function parseEmployeeUpperBound(value: string | null): number | null {
  if (!value) {
    return null;
  }

  const cleaned = value.replace(/,/g, "").toLowerCase().trim();
  const range = cleaned.match(/(\d+)\s*-\s*(\d+)/);
  if (range) {
    return Number(range[2]);
  }

  const plus = cleaned.match(/(\d+)\s*\+/);
  if (plus) {
    return Number.POSITIVE_INFINITY;
  }

  const single = cleaned.match(/(\d+)/);
  if (single) {
    return Number(single[1]);
  }

  return null;
}

function matchesPageFilter(item: Awaited<ReturnType<typeof getFounderDirectory>>[number], page: StartupDiscoveryPage): boolean {
  const stageText = normalize(item.stage);
  const industryText = normalize(`${item.industry} ${item.productSummary} ${item.fundingInfo ?? ""}`);
  const locationText = normalize(item.headquarters);

  if (page.industryKeywords && page.industryKeywords.length > 0) {
    const matched = page.industryKeywords.some((keyword) =>
      industryText.includes(normalize(keyword)),
    );
    if (!matched) {
      return false;
    }
  }

  if (page.stageGroup === "early" && !isEarlyStage(stageText)) {
    return false;
  }

  if (page.stageGroup === "growth" && !isGrowthStage(stageText)) {
    return false;
  }

  if (page.stageGroup === "mature" && !isMatureStage(stageText)) {
    return false;
  }

  if (typeof page.maxEmployees === "number") {
    const upperBound = parseEmployeeUpperBound(item.employeeCount);
    if (upperBound === null || upperBound > page.maxEmployees) {
      return false;
    }
  }

  if (typeof page.foundedYear === "number" && item.foundedYear !== page.foundedYear) {
    return false;
  }

  if (page.locationKeywords && page.locationKeywords.length > 0) {
    const matched = page.locationKeywords.some((keyword) =>
      locationText.includes(normalize(keyword)),
    );
    if (!matched) {
      return false;
    }
  }

  return true;
}

function buildCategorySchema({
  baseUrl,
  page,
  matching,
}: {
  baseUrl: string;
  page: StartupDiscoveryPage;
  matching: Awaited<ReturnType<typeof getFounderDirectory>>;
}) {
  const pageUrl = `${baseUrl}/startups/${page.slug}`;
  const itemList = matching.slice(0, 24).map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: `${baseUrl}/company/${item.companySlug}`,
    name: item.companyName,
  }));

  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${page.title} | 100Xfounder`,
        description: page.description,
        isPartOf: {
          "@type": "WebSite",
          "@id": `${baseUrl}/#website`,
          name: "100Xfounder",
          url: baseUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Home",
            item: `${baseUrl}/`,
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Startups",
            item: `${baseUrl}/startups`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: page.title,
            item: pageUrl,
          },
        ],
      },
      {
        "@type": "ItemList",
        name: `${page.title} Company Directory`,
        numberOfItems: matching.length,
        itemListElement: itemList,
      },
    ],
  };
}

export async function generateStaticParams() {
  return getStartupDiscoverySlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: StartupCategoryPageProps): Promise<Metadata> {
  const page = getStartupDiscoveryPage(params.slug);
  if (!page) {
    return {
      title: "Startup Category Not Found | 100Xfounder",
    };
  }

  const canonical = `${getSiteBaseUrl()}/startups/${page.slug}`;
  return {
    title: `${page.title} | 100Xfounder`,
    description: page.description,
    alternates: { canonical },
    openGraph: {
      title: `${page.title} | 100Xfounder`,
      description: page.description,
      url: canonical,
      type: "website",
    },
  };
}

export default async function StartupCategoryPage({ params }: StartupCategoryPageProps) {
  const page = getStartupDiscoveryPage(params.slug);
  if (!page) {
    notFound();
  }

  const allFounders = await getFounderDirectory({ limit: 500 });
  const matching = allFounders.filter((item) => matchesPageFilter(item, page));
  const { recent } = splitRecentlyFunded(matching, 6);
  const relatedPages = STARTUP_DISCOVERY_PAGES
    .filter((item) => item.slug !== page.slug && item.focus === page.focus)
    .slice(0, 8);
  const baseUrl = getSiteBaseUrl();
  const schema = buildCategorySchema({
    baseUrl,
    page,
    matching,
  });

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.16em] text-zinc-500">Startup Directory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {page.title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">{page.description}</p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {matching.length} profiles matched
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Updated for 2026 search intent
            </span>
          </div>
        </header>

        {recent.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-300">
              Recently Funded in This Category
            </h2>
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
              {recent.map((founder) => (
                <FounderCard key={founder.id} founder={founder} isTrending />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-8">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-wide text-zinc-300">
            All Matching Startups
          </h2>
          {matching.length > 0 ? (
            <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
              {matching.map((founder) => (
                <FounderCard key={founder.id} founder={founder} isTrending={recent.some((item) => item.id === founder.id)} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 text-center backdrop-blur-[40px]">
              <p className="text-sm text-zinc-400">
                No startups matched this filter yet. We are continuously syncing new records from data partners.
              </p>
              <Link
                href="/founders"
                className="mt-4 inline-flex rounded-lg border border-white/15 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition-colors hover:border-white/30 hover:text-white"
              >
                Browse Full Founder Directory
              </Link>
            </div>
          )}
        </section>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-300">
            Related Pages
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {relatedPages.map((item) => (
              <Link
                key={item.slug}
                href={`/startups/${item.slug}`}
                className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>
      </section>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />

      <Footer />
    </main>
  );
}
