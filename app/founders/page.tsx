import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { FounderCard } from "@/components/founder-card";
import { FilterSidebar } from "@/components/founders/filter-sidebar";
import {
  getFounderDirectory,
  getFounderFilterOptions,
  splitRecentlyFunded,
} from "@/lib/founders/store";
import type { FounderDirectoryItem } from "@/lib/founders/types";

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
    tab?: string | string[];
  };
};

export default async function FoundersPage({ searchParams }: FoundersPageProps) {
  const selectedIndustries = readParam(searchParams?.industry);
  const selectedLocations = readParam(searchParams?.location);
  const selectedStages = readParam(searchParams?.stage);
  const activeTab = resolveTab(searchParams?.tab);

  const [founders, filterOptions] = await Promise.all([
    getFounderDirectory({
      industry: selectedIndustries,
      location: selectedLocations,
      stage: selectedStages,
    }),
    getFounderFilterOptions(),
  ]);
  const { recent } = splitRecentlyFunded(founders, 18);
  const recentIdSet = new Set(recent.map((item) => item.id));
  const ycFounders = founders.filter((item) => Boolean(item.ycProfileUrl));
  const hiringNowFounders = founders.filter(isHiringNow);

  const tabHref = (tab: DirectoryTab) => {
    const params = new URLSearchParams();
    if (tab !== "all") {
      params.set("tab", tab);
    }
    setListParam(params, "industry", selectedIndustries);
    setListParam(params, "location", selectedLocations);
    setListParam(params, "stage", selectedStages);
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
        ? recent
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
          <div className="mb-8 flex items-end justify-between">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight text-white">
                Founder Directory
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">
                Curated founder intelligence with verified signals, funding momentum,
                and conversion-ready outreach actions.
              </p>
            </div>
            <p className="text-sm text-zinc-500">{founders.length} profiles indexed</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
            <FilterSidebar
              options={filterOptions}
              selectedIndustries={selectedIndustries}
              selectedLocations={selectedLocations}
              selectedStages={selectedStages}
            />

            <section>
              <div className="mb-6 overflow-x-auto">
                <div className="inline-flex min-w-full gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-2 backdrop-blur-[20px]">
                  {tabItems.map((tab) => (
                    <Link
                      key={tab.id}
                      href={tabHref(tab.id)}
                      className={
                        activeTab === tab.id
                          ? "inline-flex items-center gap-2 rounded-xl border border-indigo-400/50 bg-indigo-500/15 px-3 py-2 text-sm text-indigo-200 shadow-[0_0_14px_rgba(99,102,241,0.3)]"
                          : "inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-white/20 hover:text-white"
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
                    <span className="text-xs text-zinc-500">{recent.length} records</span>
                  </div>

                  {recent.length === 1 ? (
                    <FounderCard founder={recent[0]} isTrending featured />
                  ) : (
                    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                      {recent.map((founder) => (
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
                    <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(300px,1fr))]">
                      {directoryItems.map((founder) => (
                        <FounderCard
                          key={founder.id}
                          founder={founder}
                          isTrending={recentIdSet.has(founder.id)}
                        />
                      ))}
                    </div>
                  )
                ) : (
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center backdrop-blur-[20px]">
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
    </main>
  );
}
