import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StartupTaxonomyIndex } from "@/app/startups/_components/startup-taxonomy-index";
import { getStartupTaxonomyOptions } from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Top Startups by Investor | 100Xfounder",
  description:
    "Explore startup listings grouped by investor support, including Y Combinator and top-tier VC-backed cohorts.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/startups/investor`,
  },
};

export default async function StartupInvestorIndexPage() {
  const options = await getStartupTaxonomyOptions("investor");

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupTaxonomyIndex
        heading="Top Startups by Investor"
        description="Investor-cluster startup pages built for high-intent discovery and market intelligence workflows."
        options={options}
        hrefPrefix="/startups/investor"
      />
      <Footer />
    </main>
  );
}
