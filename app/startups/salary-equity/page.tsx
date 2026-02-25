import type { Metadata } from "next";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SalaryOverview } from "@/app/startups/_components/salary-listing";
import { getSalaryEquityOverview } from "@/lib/salary-equity/store";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Startup Salary and Equity Database | 100Xfounder",
  description:
    "Explore startup compensation benchmarks by role, location, and stage with SEO-friendly salary/equity pages.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/startups/salary-equity`,
  },
};

export default async function StartupSalaryEquityPage() {
  const overview = await getSalaryEquityOverview();

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <SalaryOverview
        totalCount={overview.totalCount}
        updatedAt={overview.updatedAt}
        byLocation={overview.byLocation}
        byRole={overview.byRole}
        byStage={overview.byStage}
      />
      <Footer />
    </main>
  );
}
