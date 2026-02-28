import type { Metadata } from "next";
import Link from "next/link";
import { permanentRedirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { CompanyLogo } from "@/components/ui/company-logo";
import type { FounderDirectoryItem } from "@/lib/founders/types";
import {
  getStartupDirectoryDataset,
  mapSourceDirectoryQueryToPath,
} from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

type StartupsPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

type StartupItem = FounderDirectoryItem;

type QueryLink = {
  label: string;
  href: string;
};

const PAGE_SIZE = 12;

const MAIN_QUERY_LINKS: QueryLink[] = [
  { label: "Top AI Startups", href: "/startups/industry/artificial-intelligence" },
  { label: "Top FinTech Startups", href: "/startups/industry/fintech" },
  { label: "Top Cybersecurity Startups", href: "/startups/industry/cybersecurity" },
  { label: "Startups in New York", href: "/startups/location/new-york" },
  { label: "Startups in SF Bay Area", href: "/startups/location/san-francisco-bay-area" },
  { label: "Series A Startups", href: "/startups/funding-round/series-a" },
  { label: "Series B Startups", href: "/startups/funding-round/series-b" },
  { label: "Y Combinator Startups", href: "/startups/investor/y-combinator" },
  { label: "Startup Jobs in New York", href: "/startups/jobs/location/new-york" },
  { label: "Software Engineer Salary Data", href: "/startups/salary-equity/role/software-engineer" },
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function toSearchParams(input: Record<string, string | string[] | undefined> | undefined) {
  const params = new URLSearchParams();

  Object.entries(input || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry?.trim()) {
          params.append(key, entry.trim());
        }
      });
      return;
    }

    if (typeof value === "string" && value.trim()) {
      params.append(key, value.trim());
    }
  });

  return params;
}

function parsePage(pageParam: string | null): number {
  const parsed = Number(pageParam ?? "1");
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }
  return Math.floor(parsed);
}

function parseFundingAmount(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }
  const match = value.match(/\$?([\d,.]+)\s*([BMK])?/i);
  if (!match) {
    return 0;
  }

  const raw = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(raw)) {
    return 0;
  }

  const unit = (match[2] || "").toUpperCase();
  if (unit === "B") return raw * 1_000_000_000;
  if (unit === "M") return raw * 1_000_000;
  if (unit === "K") return raw * 1_000;
  return raw;
}

function startupFundingScore(startup: StartupItem): number {
  if (typeof startup.fundingTotalUsd === "number" && startup.fundingTotalUsd > 0) {
    return startup.fundingTotalUsd;
  }
  if (typeof startup.lastRound?.amountUsd === "number" && startup.lastRound.amountUsd > 0) {
    return startup.lastRound.amountUsd;
  }
  if (startup.lastRound?.amount) {
    return parseFundingAmount(startup.lastRound.amount);
  }
  if (startup.fundingInfo) {
    return parseFundingAmount(startup.fundingInfo);
  }
  return 0;
}

function getStageRank(stage: string | null | undefined): number {
  const value = String(stage || "").toLowerCase();
  if (value.includes("pre-seed")) return 1;
  if (value.includes("seed")) return 2;
  if (value.includes("series a")) return 3;
  if (value.includes("series b")) return 4;
  if (value.includes("series c")) return 5;
  if (value.includes("series d")) return 6;
  if (value.includes("series e")) return 7;
  if (value.includes("series f")) return 8;
  if (value.includes("growth")) return 9;
  if (value.includes("strategic")) return 10;
  if (value.includes("ipo") || value.includes("public")) return 11;
  return 0;
}

function extractFundingLabel(startup: StartupItem): string {
  if (startup.fundingTotalDisplay?.trim()) {
    return startup.fundingTotalDisplay;
  }
  if (startup.lastRound?.amount?.trim()) {
    return startup.lastRound.amount;
  }
  if (startup.fundingInfo?.trim()) {
    return startup.fundingInfo;
  }
  return "Undisclosed";
}

function normalizeText(value: string | null | undefined): string {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function startupMatchesLocation(startup: StartupItem, selectedLocation: string): boolean {
  const selected = selectedLocation.replace(/-/g, " ").toLowerCase();
  const locationText = `${startup.headquarters || ""} ${startup.country || ""}`.toLowerCase();
  return locationText.includes(selected);
}

function startupMatchesInvestor(startup: StartupItem, investorSlug: string): boolean {
  const investors = new Set<string>();
  startup.allRounds?.forEach((round) => {
    round.investors.forEach((investor) => investors.add(slugify(investor)));
  });

  if (startup.fundingInfo) {
    startup.fundingInfo
      .split(/[,/|]/)
      .map((token) => token.trim())
      .filter(Boolean)
      .slice(0, 10)
      .forEach((token) => investors.add(slugify(token)));
  }

  return investors.has(investorSlug);
}

function buildPageHref(params: URLSearchParams, page: number): string {
  const next = new URLSearchParams(params);
  if (page <= 1) {
    next.delete("page");
  } else {
    next.set("page", String(page));
  }
  const query = next.toString();
  return query ? `/startups?${query}` : "/startups";
}

function renderExternalHref(rawHref: string | null | undefined): string | null {
  if (!rawHref) {
    return null;
  }

  try {
    const url = new URL(rawHref);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function StartupCard({ startup }: { startup: StartupItem }) {
  const externalWebsite = renderExternalHref(startup.websiteUrl);
  const externalLinkedIn = renderExternalHref(startup.linkedinUrl);
  const location = startup.headquarters || startup.country || "Unknown";
  const fundingLabel = extractFundingLabel(startup);

  return (
    <article className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-[40px] transition-colors hover:border-white/30">
      <div className="flex items-start gap-3">
        <CompanyLogo
          companyName={startup.companyName}
          imageUrl={startup.avatarUrl}
          websiteUrl={startup.websiteUrl}
          className="h-16 w-16 rounded-full border border-white/15"
          imageClassName="object-contain p-1"
        />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/company/${startup.companySlug}`} className="text-lg font-semibold text-white hover:text-indigo-200">
              {startup.companyName}
            </Link>
            {startup.isFeatured ? (
              <span className="rounded-full border border-indigo-400/40 bg-indigo-500/10 px-2 py-0.5 text-[11px] text-indigo-200">
                Featured
              </span>
            ) : null}
            {startup.isHiring ? (
              <span className="rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-0.5 text-[11px] text-emerald-200">
                Hiring
              </span>
            ) : null}
          </div>
          <p className="mt-0.5 text-xs uppercase tracking-[0.14em] text-zinc-500">{startup.founderName}</p>
        </div>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-zinc-300">{startup.productSummary}</p>

      <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-zinc-300">{startup.industry}</span>
        <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-zinc-300">{startup.stage}</span>
        {startup.employeeCount ? (
          <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1 text-zinc-300">{startup.employeeCount}</span>
        ) : null}
      </div>

      <div className="mt-4 space-y-1 text-sm text-zinc-400">
        <p>
          <span className="text-zinc-500">HQ:</span> {location}
        </p>
        {startup.foundedYear ? (
          <p>
            <span className="text-zinc-500">Founded:</span> {startup.foundedYear}
          </p>
        ) : null}
        <p className="line-clamp-1">
          <span className="text-zinc-500">Funding:</span> {fundingLabel}
        </p>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Link
          href={`/company/${startup.companySlug}`}
          className="rounded-md border border-white/20 bg-black/35 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-white/35 hover:text-white"
        >
          View Profile
        </Link>

        {externalWebsite ? (
          <a
            href={externalWebsite}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="rounded-md border border-indigo-400/40 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
          >
            Company Site
          </a>
        ) : null}

        {externalLinkedIn ? (
          <a
            href={externalLinkedIn}
            target="_blank"
            rel="nofollow noopener noreferrer"
            className="rounded-md border border-white/20 bg-black/35 px-3 py-1.5 text-xs text-zinc-200 transition-colors hover:border-white/35 hover:text-white"
          >
            Team / LinkedIn
          </a>
        ) : null}
      </div>
    </article>
  );
}

export async function generateMetadata({ searchParams }: StartupsPageProps): Promise<Metadata> {
  const baseUrl = getSiteBaseUrl();
  const params = toSearchParams(searchParams);
  const mapped = mapSourceDirectoryQueryToPath(params);

  return {
    title: "100Xfounder Startup Directory | Companies, Filters, External Links",
    description:
      "Browse startup company boxes with filters by industry, location, funding stage, and investor. Explore external company links and founder profiles on 100Xfounder.",
    alternates: {
      canonical: mapped ? `${baseUrl}${mapped}` : `${baseUrl}/startups`,
    },
  };
}

export default async function StartupsPage({ searchParams }: StartupsPageProps) {
  const params = toSearchParams(searchParams);
  const mapped = mapSourceDirectoryQueryToPath(params);

  if (mapped) {
    permanentRedirect(mapped);
  }

  const q = params.get("q") || "";
  const industry = params.get("industry") || "";
  const location = params.get("location") || "";
  const stage = params.get("stage") || "";
  const investor = params.get("investor") || "";
  const sort = params.get("sort") || "rank";
  const normalizedQuery = normalizeText(q);
  const { overview, founders } = await getStartupDirectoryDataset();
  const startups = founders.slice(0, 3000);

  const filtered = startups.filter((startup) => {
    if (q) {
      const haystack = normalizeText(
        [
          startup.companyName,
          startup.founderName,
          startup.productSummary,
          startup.industry,
          startup.headquarters,
          startup.fundingInfo,
        ].join(" "),
      );
      if (!haystack.includes(normalizedQuery)) {
        return false;
      }
    }

    if (industry && slugify(startup.industry) !== industry) {
      return false;
    }

    if (location && !startupMatchesLocation(startup, location)) {
      return false;
    }

    if (stage && slugify(startup.stage) !== stage) {
      return false;
    }

    if (investor && !startupMatchesInvestor(startup, investor)) {
      return false;
    }

    return true;
  });

  const ranked = [...filtered].sort((a, b) => {
    if (sort === "name") {
      return a.companyName.localeCompare(b.companyName);
    }

    if (sort === "new") {
      const yearDiff = (b.foundedYear || 0) - (a.foundedYear || 0);
      if (yearDiff !== 0) {
        return yearDiff;
      }
      return b.companyName.localeCompare(a.companyName);
    }

    if (sort === "funding") {
      const fundingDiff = startupFundingScore(b) - startupFundingScore(a);
      if (fundingDiff !== 0) {
        return fundingDiff;
      }
      return getStageRank(b.stage) - getStageRank(a.stage);
    }

    const featuredDiff = Number(b.isFeatured) - Number(a.isFeatured);
    if (featuredDiff !== 0) {
      return featuredDiff;
    }
    const hiringDiff = Number(b.isHiring) - Number(a.isHiring);
    if (hiringDiff !== 0) {
      return hiringDiff;
    }
    const fundingDiff = startupFundingScore(b) - startupFundingScore(a);
    if (fundingDiff !== 0) {
      return fundingDiff;
    }
    return a.companyName.localeCompare(b.companyName);
  });

  const totalResults = ranked.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / PAGE_SIZE));
  const page = Math.min(parsePage(params.get("page")), totalPages);
  const start = (page - 1) * PAGE_SIZE;
  const pageItems = ranked.slice(start, start + PAGE_SIZE);

  const prevHref = page > 1 ? buildPageHref(params, page - 1) : null;
  const nextHref = page < totalPages ? buildPageHref(params, page + 1) : null;

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.18em] text-zinc-500">100Xfounder Startup Directory</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Discover Startup Companies with Live Filters
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Browse startup company boxes with external links and filter by industry, location, funding stage, and investor clusters.
          </p>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {overview.totalStartups} startups indexed
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {totalResults.toLocaleString("en-US")} matches
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Updated {new Date(overview.updatedAt).toLocaleDateString("en-US")}
            </span>
          </div>
        </header>

        <section className="mt-4 rounded-2xl border border-indigo-400/30 bg-indigo-500/5 p-4">
          <p className="text-xs uppercase tracking-[0.18em] text-indigo-300">Main Queries</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {MAIN_QUERY_LINKS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-100 transition-colors hover:bg-indigo-500/20"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-6 grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="rounded-2xl border border-white/15 bg-white/[0.03] p-4 backdrop-blur-[40px] lg:sticky lg:top-20">
            <h2 className="text-xs uppercase tracking-[0.18em] text-zinc-400">Filter Startups</h2>

            <form method="get" className="mt-4 space-y-3">
              <div>
                <label htmlFor="q" className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Search
                </label>
                <input
                  id="q"
                  name="q"
                  defaultValue={q}
                  placeholder="Company, founder, market"
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-500 focus:border-indigo-400/60"
                />
              </div>

              <div>
                <label htmlFor="industry" className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Industry
                </label>
                <select
                  id="industry"
                  name="industry"
                  defaultValue={industry}
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/60"
                >
                  <option value="">All industries</option>
                  {overview.industries.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="location" className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Location
                </label>
                <select
                  id="location"
                  name="location"
                  defaultValue={location}
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/60"
                >
                  <option value="">All locations</option>
                  {overview.locations.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="stage" className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Funding stage
                </label>
                <select
                  id="stage"
                  name="stage"
                  defaultValue={stage}
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/60"
                >
                  <option value="">All stages</option>
                  {overview.fundingRounds.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="investor" className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Investor
                </label>
                <select
                  id="investor"
                  name="investor"
                  defaultValue={investor}
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/60"
                >
                  <option value="">All investors</option>
                  {overview.investors.slice(0, 120).map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label} ({item.count})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="sort" className="text-xs uppercase tracking-[0.14em] text-zinc-500">
                  Sort
                </label>
                <select
                  id="sort"
                  name="sort"
                  defaultValue={sort}
                  className="mt-1 h-10 w-full rounded-lg border border-white/15 bg-black/40 px-3 text-sm text-zinc-100 outline-none transition-colors focus:border-indigo-400/60"
                >
                  <option value="rank">Featured + high signal</option>
                  <option value="funding">Highest funding</option>
                  <option value="new">Newest founded</option>
                  <option value="name">A-Z</option>
                </select>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  className="inline-flex h-10 flex-1 items-center justify-center rounded-md border border-indigo-400/45 bg-indigo-500/15 px-3 text-sm text-indigo-200 transition-colors hover:bg-indigo-500/25"
                >
                  Apply Filters
                </button>
                <Link
                  href="/startups"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 bg-black/30 px-3 text-sm text-zinc-200 transition-colors hover:border-white/35 hover:text-white"
                >
                  Reset
                </Link>
              </div>
            </form>
          </aside>

          <div>
            {pageItems.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {pageItems.map((startup) => (
                  <StartupCard key={`${startup.id}-${startup.companySlug}`} startup={startup} />
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-8 text-sm text-zinc-400 backdrop-blur-[40px]">
                No startups matched your current filters.
              </div>
            )}

            <div className="mt-6 flex items-center justify-between rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-xs text-zinc-400">
              <p>
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                {prevHref ? (
                  <Link
                    href={prevHref}
                    className="rounded-md border border-white/20 bg-black/30 px-3 py-1.5 text-zinc-200 transition-colors hover:border-white/35 hover:text-white"
                  >
                    Previous
                  </Link>
                ) : null}
                {nextHref ? (
                  <Link
                    href={nextHref}
                    className="rounded-md border border-white/20 bg-black/30 px-3 py-1.5 text-zinc-200 transition-colors hover:border-white/35 hover:text-white"
                  >
                    Next
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}
