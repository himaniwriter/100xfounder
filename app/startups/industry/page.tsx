import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StartupTaxonomyIndex } from "@/app/startups/_components/startup-taxonomy-index";
import { getStartupTaxonomyOptions } from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

export const metadata: Metadata = {
  title: "Top Startups by Industry | 100Xfounder",
  description:
    "Browse startups by industry across AI, FinTech, SaaS, Healthcare, Cybersecurity, and more.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/startups/industry`,
  },
};

export default async function StartupIndustryIndexPage() {
  const options = await getStartupTaxonomyOptions("industry");

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupTaxonomyIndex
        heading="Top Startups by Industry"
        description="Category pages inspired by high-intent startup search demand with company, founder, funding, and hiring context."
        options={options}
        hrefPrefix="/startups/industry"
      />
      <Footer />
    </main>
  );
}
