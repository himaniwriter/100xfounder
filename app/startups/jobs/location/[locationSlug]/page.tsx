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

type JobsLocationPageProps = {
  params: { locationSlug: string };
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
}: JobsLocationPageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("location", params.locationSlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Jobs Location Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/jobs/location/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `Startup Jobs in ${context.label} | 100Xfounder`,
    description: `Explore startup jobs in ${context.label} across engineering, GTM, product, and leadership roles.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function JobsLocationPage({
  params,
  searchParams,
}: JobsLocationPageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("location", params.locationSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getJobsOverview();
  const related = overview.byLocation.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <JobsFacetPage context={context} basePath={`/startups/jobs/location/${context.slug}`} related={related} />
      <Footer />
    </main>
  );
}
