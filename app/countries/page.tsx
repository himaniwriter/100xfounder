import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { countryTierLabel } from "@/lib/founders/country-tier";
import { getCountryCoverage } from "@/lib/founders/store";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const metadata: Metadata = {
  title: "Top Startups by Country Tier | 100Xfounder",
  description:
    "Explore top funded companies by country across Tier 1, Tier 2, and Tier 3 startup markets. Up to 500 companies per country with founders, funding rounds, and hiring signals.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/countries`,
  },
};

export default async function CountriesPage() {
  const coverage = await getCountryCoverage();
  const tiers = ["TIER_1", "TIER_2", "TIER_3"] as const;

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">
            Global Founder Intelligence
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Top Companies by Country and Tier
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Discover country-wise startup ecosystems with founder profiles, funding history,
            latest rounds, and hiring signals. Each country listing is capped to the top
            500 companies for high-intent research.
          </p>
          <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              {coverage.length} countries indexed
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Tier-based SEO clusters
            </span>
            <span className="rounded-full border border-white/15 bg-black/30 px-2.5 py-1">
              Founder + funding + hiring in one place
            </span>
          </div>
        </header>

        <div className="mt-8 space-y-8">
          {tiers.map((tier) => {
            const countries = coverage.filter((item) => item.tier === tier);

            return (
              <section key={tier} className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">{countryTierLabel(tier)}</h2>
                    <p className="mt-1 text-sm text-zinc-400">
                      {countries.length} countries in this tier.
                    </p>
                  </div>
                  <Link
                    href={`/countries/tier/${tier.toLowerCase()}`}
                    className="rounded-lg border border-indigo-400/35 bg-indigo-500/10 px-3 py-1.5 text-xs text-indigo-200 transition-colors hover:bg-indigo-500/20"
                  >
                    Open {countryTierLabel(tier)} hub
                  </Link>
                </div>

                {countries.length === 0 ? (
                  <p className="text-sm text-zinc-500">No countries indexed yet.</p>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {countries.map((item) => (
                      <Link
                        key={item.countrySlug}
                        href={`/countries/${item.countrySlug}`}
                        className="rounded-xl border border-white/15 bg-black/25 p-4 transition-colors hover:border-white/30"
                      >
                        <p className="text-base font-medium text-white">{item.country}</p>
                        <p className="mt-1 text-xs text-zinc-400">
                          {item.companyCount} companies • {item.founderCount} founder profiles
                        </p>
                        <p className="mt-3 text-xs text-zinc-300">
                          Funding coverage: {item.fundedCompanies} companies
                        </p>
                        <p className="mt-1 text-xs text-zinc-300">
                          Hiring coverage: {item.hiringCompanies} companies
                        </p>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      </section>

      <Footer />
    </main>
  );
}
