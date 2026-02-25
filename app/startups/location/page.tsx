import type { Metadata } from "next";
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
      <Footer />
    </main>
  );
}
