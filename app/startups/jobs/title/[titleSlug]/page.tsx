import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { JobsFacetPage } from "@/app/startups/_components/jobs-listing";
import {
  JOB_INDEX_THRESHOLD,
  STARTUP_STATIC_PARAMS_CAP,
  getJobsFacetContext,
  getJobsOverview,
} from "@/lib/startups/catalog";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

type JobsTitlePageProps = {
  params: { titleSlug: string };
  searchParams?: { page?: string };
};

export async function generateStaticParams(): Promise<Array<{ titleSlug: string }>> {
  const overview = await getJobsOverview();
  return overview.byTitle
    .filter((item) => item.count >= JOB_INDEX_THRESHOLD)
    .slice(0, STARTUP_STATIC_PARAMS_CAP)
    .map((item) => ({ titleSlug: item.slug }));
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: JobsTitlePageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("title", params.titleSlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Job Title Page Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/jobs/title/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `${context.label} Startup Jobs | 100Xfounder`,
    description: `Live startup listings for the ${context.label} title cluster across top startup markets.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function JobsTitlePage({ params, searchParams }: JobsTitlePageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("title", params.titleSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getJobsOverview();
  const related = overview.byTitle.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <JobsFacetPage context={context} basePath={`/startups/jobs/title/${context.slug}`} related={related} />
      <Footer />
    </main>
  );
}
