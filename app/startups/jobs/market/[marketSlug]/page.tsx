import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { JobsFacetPage } from "@/app/startups/_components/jobs-listing";
import {
  getJobsFacetContext,
  getJobsOverview,
} from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

type JobsMarketPageProps = {
  params: { marketSlug: string };
  searchParams?: { page?: string };
};

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: JobsMarketPageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("market", params.marketSlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Jobs Market Page Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/jobs/market/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `${context.label} Startup Jobs | 100Xfounder`,
    description: `Open startup job opportunities in ${context.label} markets with high-intent role pages.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex || context.page > 1
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function JobsMarketPage({
  params,
  searchParams,
}: JobsMarketPageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("market", params.marketSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getJobsOverview();
  const related = overview.byMarket.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <JobsFacetPage context={context} basePath={`/startups/jobs/market/${context.slug}`} related={related} />
      <Footer />
    </main>
  );
}
