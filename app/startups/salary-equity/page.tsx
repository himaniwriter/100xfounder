import type { Metadata } from "next";
import Link from "next/link";
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
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Salary and equity benchmarks for startup operators
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Compensation analysis is strongest when salary and equity are evaluated together. This hub organizes
            benchmark data by role, location, and stage so founders and hiring teams can calibrate offers with
            more confidence while candidates can compare opportunities in similar startup environments.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            Cross-reference these ranges with
            <Link href="/startups/jobs" className="text-indigo-300 hover:text-indigo-200">
              {" startup jobs"}
            </Link>
            , 
            <Link href="/startups/funding-round" className="text-indigo-300 hover:text-indigo-200">
              {" funding-round cohorts"}
            </Link>
            , and
            <Link href="/founders" className="text-indigo-300 hover:text-indigo-200">
              {" founder/company profiles"}
            </Link>
            {" for a more complete hiring strategy view."}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
