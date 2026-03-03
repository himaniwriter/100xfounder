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

type SalaryRolePageProps = {
  params: { roleSlug: string };
  searchParams?: { page?: string };
};

export async function generateStaticParams(): Promise<Array<{ roleSlug: string }>> {
  const overview = await getSalaryEquityOverview();
  const generated = overview.byRole
    .filter((item) => item.count >= SALARY_INDEX_THRESHOLD)
    .slice(0, SALARY_STATIC_PARAMS_CAP)
    .map((item) => item.slug);

  if (!generated.includes("software-engineer")) {
    generated.push("software-engineer");
  }

  return generated.slice(0, SALARY_STATIC_PARAMS_CAP).map((roleSlug) => ({ roleSlug }));
}

function parsePage(raw: string | undefined): number {
  if (!raw) return 1;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
}

export async function generateMetadata({
  params,
  searchParams,
}: SalaryRolePageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getSalaryFacetContext("role", params.roleSlug, pageNumber);

  if (!context) {
    return {
      title: "Salary Role Page Not Found | 100Xfounder",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonical = `${baseUrl}/startups/salary-equity/role/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;

  return {
    title: `${context.label} Startup Salary Benchmarks | 100Xfounder`,
    description: `Compensation and equity benchmarks for ${context.label.toLowerCase()} roles in startups.`,
    alternates: { canonical },
    robots:
      !context.shouldIndex
        ? { index: false, follow: true }
        : undefined,
  };
}

export default async function SalaryRolePage({ params, searchParams }: SalaryRolePageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getSalaryFacetContext("role", params.roleSlug, pageNumber);

  if (!context) {
    notFound();
  }

  const overview = await getSalaryEquityOverview();
  const related = overview.byRole.filter((item) => item.slug !== context.slug).slice(0, 12);

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <SalaryFacetPage
        context={context}
        basePath={`/startups/salary-equity/role/${context.slug}`}
        related={related}
      />
      <Footer />
    </main>
  );
}
