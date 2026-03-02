import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StartupTaxonomyIndex } from "@/app/startups/_components/startup-taxonomy-index";
import { getStartupTaxonomyOptions } from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Top Startups by Location | 100Xfounder",
  description:
    "Explore startup hubs by city and country with clean path-based SEO pages and funding-first rankings.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/startups/location`,
  },
};

export default async function StartupLocationIndexPage() {
  const options = await getStartupTaxonomyOptions("location");

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupTaxonomyIndex
        heading="Top Startups by Location"
        description="Discover startup ecosystems in San Francisco, New York, Boston, Seattle, Austin, and other high-growth markets."
        options={options}
        hrefPrefix="/startups/location"
      />
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Location-based startup research guide
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Location pages help you compare startup ecosystems without mixing unrelated market conditions.
            A city with strong early-stage density behaves differently from a market dominated by late-stage scaleups.
            Grouping startups by location gives cleaner context for investment sourcing, hiring outreach, and GTM expansion.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Use this taxonomy with
            <Link href="/countries" className="text-indigo-300 hover:text-indigo-200">
              {" country routes"}
            </Link>
            , 
            <Link href="/startups/industry" className="text-indigo-300 hover:text-indigo-200">
              {" industry startup pages"}
            </Link>
            , and
            <Link href="/funding-rounds" className="text-indigo-300 hover:text-indigo-200">
              {" funding coverage"}
            </Link>
            {" to understand where capital, talent, and execution are moving together."}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
