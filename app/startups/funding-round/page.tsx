import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StartupTaxonomyIndex } from "@/app/startups/_components/startup-taxonomy-index";
import { getStartupTaxonomyOptions } from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Top Startups by Funding Round | 100Xfounder",
  description:
    "Browse startup cohorts by funding round, from Pre-Seed and Seed to Series E and beyond.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/startups/funding-round`,
  },
};

export default async function StartupFundingRoundIndexPage() {
  const options = await getStartupTaxonomyOptions("funding-round");

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupTaxonomyIndex
        heading="Top Startups by Funding Round"
        description="Round-based startup pages for investors, operators, and sales teams tracking stage-wise market momentum."
        options={options}
        hrefPrefix="/startups/funding-round"
      />
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Funding-round startup lists with context
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            These pages group startups by capital stage so comparison is more meaningful for investors, operators,
            and sales teams. When companies are benchmarked against peers in the same round, signals like hiring pace,
            product expansion, and market focus become easier to interpret.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Combine this directory with
            <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
              {" funding newsroom coverage"}
            </Link>
            , 
            <Link href="/stages" className="text-indigo-300 hover:text-indigo-200">
              {" stage hubs"}
            </Link>
            , and
            <Link href="/startups" className="text-indigo-300 hover:text-indigo-200">
              {" startup master index"}
            </Link>
            {" for full market context."}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
