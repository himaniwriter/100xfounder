import Link from "next/link";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { PillarCrosslinks } from "@/components/seo/pillar-crosslinks";
import { FounderCard } from "@/components/founder-card";
import { FilterSidebar } from "@/components/founders/filter-sidebar";
import {
  countryToSlug,
} from "@/lib/founders/country-tier";
import {
  getFounderDirectory,
  getFounderDirectoryLastUpdatedAt,
  getFounderFilterOptions,
  splitRecentlyFunded,
} from "@/lib/founders/store";
import type { CountryTier, FounderDirectoryItem } from "@/lib/founders/types";
import { resolveQueryIndexability } from "@/lib/seo/indexability";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

function readParam(value: string | string[] | undefined): string[] {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value.map((item) => item.trim()).filter(Boolean);
  }

  if (!value.includes(",")) {
    return [value.trim()].filter(Boolean);
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function setListParam(params: URLSearchParams, key: string, values: string[]) {
  params.delete(key);
  values.forEach((value) => params.append(key, value));
}

function isHiringNow(item: FounderDirectoryItem): boolean {
  if (typeof item.isHiring === "boolean") {
    return item.isHiring;
  }
  return /hiring|expanding team|open roles|building team|talent/i.test(
    `${item.productSummary} ${item.fundingInfo ?? ""}`,
  );
}

type DirectoryTab = "all" | "trending" | "hiring" | "yc";

function resolveTab(value: string | string[] | undefined): DirectoryTab {
  const tab = Array.isArray(value) ? value[0] : value;
  if (tab === "trending" || tab === "hiring" || tab === "yc") {
    return tab;
  }
  return "all";
}

type FoundersPageProps = {
  searchParams?: {
    industry?: string | string[];
    location?: string | string[];
    stage?: string | string[];
    country?: string | string[];
    tier?: string | string[];
    tab?: string | string[];
  };
};

function readTierParam(value: string | string[] | undefined): CountryTier[] {
  return readParam(value)
    .map((item) => item.trim().toUpperCase())
    .filter((item): item is CountryTier =>
      item === "TIER_1" || item === "TIER_2" || item === "TIER_3",
    );
}

export async function generateMetadata({ searchParams }: FoundersPageProps): Promise<Metadata> {
  const industries = readParam(searchParams?.industry);
  const locations = readParam(searchParams?.location);
  const stages = readParam(searchParams?.stage);
  const countries = readParam(searchParams?.country);
  const tiers = readTierParam(searchParams?.tier);
  const tab = resolveTab(searchParams?.tab);
  const decision = resolveQueryIndexability("/founders", {
    industry: industries,
    location: locations,
    stage: stages,
    country: countries,
    tier: tiers,
    tab: tab === "all" ? [] : [tab],
  });
  const baseUrl = getSiteBaseUrl();

  return {
    title: "Founder Directory | 100Xfounder",
    description:
      "Explore verified founder profiles with funding rounds, hiring roles, and company intelligence.",
    alternates: {
      canonical: `${baseUrl}${decision.canonicalPath}`,
    },
    robots: decision.robots,
  };
}

export default async function FoundersPage({ searchParams }: FoundersPageProps) {
  const selectedIndustries = readParam(searchParams?.industry);
  const selectedLocations = readParam(searchParams?.location);
  const selectedStages = readParam(searchParams?.stage);
  const selectedCountries = readParam(searchParams?.country);
  const selectedTiers = readTierParam(searchParams?.tier);
  const activeTab = resolveTab(searchParams?.tab);

  const [founders, filterOptions, lastUpdatedAt] = await Promise.all([
    getFounderDirectory({
      industry: selectedIndustries,
      location: selectedLocations,
      stage: selectedStages,
      country: selectedCountries,
      tier: selectedTiers,
      perCountryLimit: 500,
    }),
    getFounderFilterOptions(),
    getFounderDirectoryLastUpdatedAt(),
  ]);
  const lastUpdatedOn = new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(lastUpdatedAt);
  const baseUrl = getSiteBaseUrl();
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${baseUrl}/founders#webpage`,
        url: `${baseUrl}/founders`,
        name: "Founder directory",
        description:
          "Founder profiles with company context, funding rounds, and hiring signals.",
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Founders", item: `${baseUrl}/founders` },
        ],
      },
    ],
  };
  const { recent } = splitRecentlyFunded(founders, 18);
  const shouldUseSpotlight = recent.length > 0 && recent.length < 3;
  const spotlightRecent =
    activeTab === "all" && shouldUseSpotlight ? recent.slice(0, 1) : recent;
  const allRecentIdSet = new Set(recent.map((item) => item.id));
  const recentIdSet = new Set(spotlightRecent.map((item) => item.id));
  const topFounder = founders[0];
  const ycFounders = founders.filter((item) => Boolean(item.ycProfileUrl));
  const hiringNowFounders = founders.filter(isHiringNow);
  const discoverCountrySlug =
    countryToSlug(
      founders.find((item) => (item.country ?? "Unknown") !== "Unknown")?.country ?? "India",
    ) || "india";
  const discoverNowLinks = [
    { label: "Newsroom", href: "/blog" },
    { label: "Topics", href: "/topics" },
    { label: "Funding News", href: "/funding-rounds" },
    { label: "Country News", href: `/countries/${discoverCountrySlug}/news` },
  ];

  const tabHref = (tab: DirectoryTab) => {
    const params = new URLSearchParams();
    if (tab !== "all") {
      params.set("tab", tab);
    }
    setListParam(params, "industry", selectedIndustries);
    setListParam(params, "location", selectedLocations);
    setListParam(params, "stage", selectedStages);
    setListParam(params, "country", selectedCountries);
    setListParam(params, "tier", selectedTiers);
    const queryString = params.toString();
    return queryString ? `/founders?${queryString}` : "/founders";
  };

  const tabItems: Array<{
    id: DirectoryTab;
    label: string;
    count: number;
  }> = [
    { id: "all", label: "All Founders", count: founders.length },
    { id: "trending", label: "Trending", count: recent.length },
    { id: "hiring", label: "Hiring Now", count: hiringNowFounders.length },
    { id: "yc", label: "YC Alumni", count: ycFounders.length },
  ];

  const directoryItems =
    activeTab === "all"
      ? founders.filter((item) => !recentIdSet.has(item.id))
      : activeTab === "trending"
        ? spotlightRecent
        : activeTab === "hiring"
          ? hiringNowFounders
          : ycFounders;

  const showRecentSection = activeTab === "all";
  const sectionTitle =
    activeTab === "all"
      ? "Directory Results"
      : activeTab === "trending"
        ? "Trending Founders"
        : activeTab === "hiring"
          ? "Hiring Now"
          : "YC Alumni";

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[#050505] text-[#EDEDED]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="mesh-orb mesh-orb-indigo absolute -left-28 -top-28 h-[24rem] w-[24rem] rounded-full blur-3xl" />
        <div className="mesh-orb mesh-orb-purple mesh-orb-delay absolute -right-28 -top-20 h-[26rem] w-[26rem] rounded-full blur-3xl" />
      </div>

      <div className="relative z-10">
        <Navbar />

        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Founder Directory
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Global company intelligence with up to 500 companies per country,
                mapped by Tier 1, Tier 2, and Tier 3 markets.
              </p>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-sm text-zinc-500">{founders.length} profiles indexed</p>
              <p className="mt-1 text-xs text-zinc-500">Updated on {lastUpdatedOn}</p>
              <Link
                href="/get-featured"
                className="mt-3 inline-flex items-center rounded-md border border-indigo-400/45 bg-indigo-500/15 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/25"
              >
                Get Featured
              </Link>
              <div className="mt-3 flex flex-wrap gap-1.5 sm:justify-end">
                {discoverNowLinks.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="rounded-full border border-white/15 bg-white/[0.03] px-2.5 py-1 text-[11px] text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
              <PillarCrosslinks
                context={{
                  country: topFounder?.country,
                  industry: topFounder?.industry,
                  stage: topFounder?.stage,
                }}
                includeGlobal
                maxLinks={8}
                title="Pillar Hubs"
                description="Jump to country, industry, stage, startup taxonomy, and newsroom hubs connected to founder discovery."
                className="mb-6 lg:col-span-2"
              />
              <FilterSidebar
                options={filterOptions}
                selectedIndustries={selectedIndustries}
                selectedLocations={selectedLocations}
                selectedStages={selectedStages}
                selectedCountries={selectedCountries}
                selectedTiers={selectedTiers}
              />

            <section className="min-w-0">
              <div className="mb-6 overflow-x-auto">
                <div className="inline-flex min-w-full gap-2 rounded-2xl border border-white/15 bg-white/[0.03] p-2 backdrop-blur-[40px]">
                  {tabItems.map((tab) => (
                    <Link
                      key={tab.id}
                      href={tabHref(tab.id)}
                      className={
                        activeTab === tab.id
                        ? "inline-flex items-center gap-2 rounded-xl border border-indigo-400/50 bg-indigo-500/15 px-3 py-2 text-sm text-indigo-200 shadow-[0_0_14px_rgba(99,102,241,0.3)]"
                        : "inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/30 hover:text-white"
                      }
                    >
                      {tab.label}
                      <span className="rounded-full border border-white/10 bg-black/40 px-2 py-0.5 text-xs text-zinc-400">
                        {tab.count}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {showRecentSection && recent.length > 0 ? (
                <>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-200">
                      Recently Funded
                    </h2>
                  <span className="text-xs text-zinc-500">
                    {shouldUseSpotlight ? "Spotlight" : `${spotlightRecent.length} records`}
                  </span>
                </div>

                {shouldUseSpotlight ? (
                  <FounderCard founder={spotlightRecent[0]} isTrending featured />
                ) : (
                  <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] sm:[grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                    {spotlightRecent.map((founder) => (
                      <FounderCard key={founder.id} founder={founder} isTrending />
                    ))}
                  </div>
                  )}
                </>
              ) : null}

              <div className={showRecentSection && recent.length > 0 ? "mt-8" : ""}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-200">
                    {sectionTitle}
                  </h2>
                  <span className="text-xs text-zinc-500">{directoryItems.length} records</span>
                </div>

                {directoryItems.length > 0 ? (
                  directoryItems.length === 1 ? (
                    <FounderCard
                      founder={directoryItems[0]}
                      featured
                      isTrending={recentIdSet.has(directoryItems[0].id)}
                    />
                  ) : (
                    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))] sm:[grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                      {directoryItems.map((founder) => (
                      <FounderCard
                        key={founder.id}
                        founder={founder}
                        isTrending={allRecentIdSet.has(founder.id)}
                      />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 text-center backdrop-blur-[40px]">
                    <p className="text-sm text-zinc-400">
                      No profiles match the selected filters.
                    </p>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>

        <Footer />
      </div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
      />
    </main>
  );
}
