import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { countryTierLabel } from "@/lib/founders/country-tier";
import { getCountryCoverage } from "@/lib/founders/store";
import { getSiteBaseUrl } from "@/lib/sitemap";

const SUPPORTED_TIERS = ["TIER_1", "TIER_2", "TIER_3"] as const;

type SupportedTier = (typeof SUPPORTED_TIERS)[number];

type TierPageProps = {
  params: {
    tier: string;
  };
};

function parseTier(value: string): SupportedTier | null {
  const normalized = value.trim().toUpperCase();
  if (SUPPORTED_TIERS.includes(normalized as SupportedTier)) {
    return normalized as SupportedTier;
  }

  const fromDash = normalized.replace(/-/g, "_");
  if (SUPPORTED_TIERS.includes(fromDash as SupportedTier)) {
    return fromDash as SupportedTier;
  }

  return null;
}

export async function generateMetadata({ params }: TierPageProps): Promise<Metadata> {
  const tier = parseTier(params.tier);
  const baseUrl = getSiteBaseUrl();
  if (!tier) {
    return {
      title: "Tier Page Not Found | 100Xfounder",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    title: `${countryTierLabel(tier)} Countries | Top Startups | 100Xfounder`,
    description: `Explore ${countryTierLabel(tier)} countries with top startup coverage, founder profiles, funding rounds, and hiring data.`,
    alternates: {
      canonical: `${baseUrl}/countries/tier/${tier.toLowerCase()}`,
    },
  };
}

export default async function TierPage({ params }: TierPageProps) {
  const tier = parseTier(params.tier);
  if (!tier) {
    notFound();
  }

  const coverage = await getCountryCoverage();
  const countries = coverage.filter((item) => item.tier === tier);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />

      <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="rounded-2xl border border-white/15 bg-white/[0.03] p-6 backdrop-blur-[40px]">
          <p className="text-xs uppercase tracking-[0.15em] text-zinc-500">Country Cluster</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            {countryTierLabel(tier)} Countries
          </h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-zinc-300">
            Country-level startup intelligence grouped by market tier. Each country page includes
            founder details, funding totals, all rounds, last round updates, and active hiring roles.
          </p>
          <div className="mt-4 rounded-full border border-white/15 bg-black/30 px-3 py-1 text-xs text-zinc-400 inline-flex">
            {countries.length} countries available
          </div>
        </header>

        <section className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {countries.map((country) => (
            <Link
              key={country.countrySlug}
              href={`/countries/${country.countrySlug}`}
              className="rounded-xl border border-white/15 bg-white/[0.03] p-4 transition-colors hover:border-white/30"
            >
              <p className="text-base font-medium text-white">{country.country}</p>
              <p className="mt-2 text-xs text-zinc-300">
                {country.companyCount} companies • {country.founderCount} founder profiles
              </p>
              <p className="mt-1 text-xs text-zinc-400">
                Funding: {country.fundedCompanies} • Hiring: {country.hiringCompanies}
              </p>
            </Link>
          ))}
        </section>

        <section className="mt-8 rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            How to use {countryTierLabel(tier)} market pages
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Tier-level routing helps you compare countries with broadly similar ecosystem maturity.
            Instead of evaluating markets in isolation, you can benchmark company density, hiring intensity,
            and funding activity across peers in the same tier group.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            For deeper analysis, open each country profile and pair it with
            <Link href="/countries" className="text-indigo-300 hover:text-indigo-200">
              {" country index pages"}
            </Link>
            , 
            <Link href="/founders" className="text-indigo-300 hover:text-indigo-200">
              {" founder directory"}
            </Link>
            , 
            <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
              {" funding round hubs"}
            </Link>
            , and
            <Link href="/startups/location" className="text-indigo-300 hover:text-indigo-200">
              {" startup location routes"}
            </Link>
            .
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            A practical workflow is to shortlist countries from this tier, open each country profile, and then
            compare sector concentration through country-industry pages. This quickly shows where startup density is
            broad versus where growth is concentrated in a narrow set of categories.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/countries"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Country Index
            </Link>
            <Link
              href="/countries/tier/tier_1"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Tier 1
            </Link>
            <Link
              href="/countries/tier/tier_2"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Tier 2
            </Link>
            <Link
              href="/countries/tier/tier_3"
              className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-xs text-zinc-300 hover:border-white/30 hover:text-white"
            >
              Tier 3
            </Link>
          </div>
        </section>
      </section>

      <Footer />
    </main>
  );
}
