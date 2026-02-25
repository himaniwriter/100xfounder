import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { JobsOverview } from "@/app/startups/_components/jobs-listing";
import { getJobsOverview } from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Startup Jobs Directory | 100Xfounder",
  description:
    "Discover startup jobs by location, role, market, and title with SEO-friendly taxonomy pages.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/startups/jobs`,
  },
};

export default async function StartupJobsPage() {
  const overview = await getJobsOverview();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <JobsOverview
        jobs={overview.jobs}
        byLocation={overview.byLocation}
        byRole={overview.byRole}
        byMarket={overview.byMarket}
        totalCount={overview.totalCount}
        updatedAt={overview.updatedAt}
      />
      <Footer />
    </main>
  );
}
