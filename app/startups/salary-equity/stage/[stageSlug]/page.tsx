import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SalaryFacetPage } from "@/app/startups/_components/salary-listing";
import {
  SALARY_INDEX_THRESHOLD,
  SALARY_STATIC_PARAMS_CAP,
  getSalaryEquityOverview,
  getSalaryFacetContext,
} from "@/lib/salary-equity/store";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

type SalaryStagePageProps = {
  params: { stageSlug: string };
  searchParams?: { page?: string };
};

export async function generateStaticParams(): Promise<Array<{ stageSlug: string }>> {
  const overview = await getSalaryEquityOverview();
  return overview.byStage
    .filter((item) => item.count >= SALARY_INDEX_THRESHOLD)
    .slice(0, SALARY_STATIC_PARAMS_CAP)
    .map((item) => ({ stageSlug: item.slug }));
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: SalaryStagePageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getSalaryFacetContext("stage", params.stageSlug, pageNumber);

  if (!context) {
    return {
      title: "Salary Stage Page Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/salary-equity/stage/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `${context.label} Startup Compensation | 100Xfounder`,
    description: `Salary and equity coverage for ${context.label} startup stages.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function SalaryStagePage({ params, searchParams }: SalaryStagePageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getSalaryFacetContext("stage", params.stageSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getSalaryEquityOverview();
  const related = overview.byStage.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <SalaryFacetPage
        context={context}
        basePath={`/startups/salary-equity/stage/${context.slug}`}
        related={related}
      />
      <Footer />
    </main>
  );
}
