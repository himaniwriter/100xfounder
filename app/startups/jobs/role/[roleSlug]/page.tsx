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

type JobsRolePageProps = {
  params: { roleSlug: string };
  searchParams?: { page?: string };
};

export async function generateStaticParams(): Promise<Array<{ roleSlug: string }>> {
  const overview = await getJobsOverview();
  return overview.byRole
    .filter((item) => item.count >= JOB_INDEX_THRESHOLD)
    .slice(0, STARTUP_STATIC_PARAMS_CAP)
    .map((item) => ({ roleSlug: item.slug }));
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: JobsRolePageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("role", params.roleSlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Jobs Role Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/jobs/role/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `${context.label} Startup Jobs | 100Xfounder`,
    description: `Browse ${context.label.toLowerCase()} startup jobs with direct application links and market context.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function JobsRolePage({ params, searchParams }: JobsRolePageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getJobsFacetContext("role", params.roleSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getJobsOverview();
  const related = overview.byRole.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <JobsFacetPage context={context} basePath={`/startups/jobs/role/${context.slug}`} related={related} />
      <Footer />
    </main>
  );
}
