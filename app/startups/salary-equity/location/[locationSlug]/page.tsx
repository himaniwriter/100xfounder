import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { SalaryFacetPage } from "@/app/startups/_components/salary-listing";
import {
  getSalaryEquityOverview,
  getSalaryFacetContext,
} from "@/lib/salary-equity/store";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 3600;

type SalaryLocationPageProps = {
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
}: SalaryLocationPageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getSalaryFacetContext("location", params.locationSlug, pageNumber);

  if (!context) {
    return {
      title: "Salary Location Page Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/salary-equity/location/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `${context.label} Startup Salaries | 100Xfounder`,
    description: `Startup salary and equity benchmarks for ${context.label}.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function SalaryLocationPage({
  params,
  searchParams,
}: SalaryLocationPageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getSalaryFacetContext("location", params.locationSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getSalaryEquityOverview();
  const related = overview.byLocation.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <SalaryFacetPage
        context={context}
        basePath={`/startups/salary-equity/location/${context.slug}`}
        related={related}
      />
      <Footer />
    </main>
  );
}
