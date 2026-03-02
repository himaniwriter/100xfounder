import type { Metadata } from "next";
import Link from "next/link";
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
      <section className="mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-white/15 bg-white/[0.03] p-6">
          <h2 className="text-xl font-semibold tracking-tight text-white">
            Startup jobs intelligence, not just listings
          </h2>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            This jobs page groups roles by location, function, and market segment so hiring demand can be read as a
            signal. Instead of browsing isolated openings, you can map which startup categories are actively building
            teams and which geographies are expanding headcount.
          </p>
          <p className="mt-3 text-sm leading-7 text-zinc-300">
            For deeper context, combine open roles with
            <Link href="/startups/salary-equity" className="text-indigo-300 hover:text-indigo-200">
              {" salary and equity benchmarks"}
            </Link>
            , 
            <Link href="/founders" className="text-indigo-300 hover:text-indigo-200">
              {" founder profiles"}
            </Link>
            , and
            <Link href="/signals" className="text-indigo-300 hover:text-indigo-200">
              {" market signals"}
            </Link>
            {" to evaluate hiring quality and company momentum together."}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
