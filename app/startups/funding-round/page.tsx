import type { Metadata } from "next";
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
      <Footer />
    </main>
  );
}
