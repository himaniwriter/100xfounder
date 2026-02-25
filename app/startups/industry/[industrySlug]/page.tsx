import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StartupTaxonomyDetail } from "@/app/startups/_components/startup-taxonomy-detail";
import {
  getStartupListContext,
  getStartupTaxonomyOptions,
} from "@/lib/startups/catalog";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

type StartupIndustryPageProps = {
  params: {
    industrySlug: string;
  };
  searchParams?: {
    page?: string;
  };
};

function parsePage(raw: string | undefined): number {
  if (!raw) {
    return 1;
  }

  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export async function generateMetadata({
  params,
  searchParams,
}: StartupIndustryPageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getStartupListContext("industry", params.industrySlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Industry Page Not Found | 100Xfounder",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonicalPath = `/startups/industry/${context.slug}`;
  const canonical = `${baseUrl}${canonicalPath}${context.page > 1 ? `?page=${context.page}` : ""}`;

  return {
    title: `${context.label} Startups | 100Xfounder`,
    description: context.description,
    alternates: {
      canonical,
    },
    robots:
      !context.shouldIndex || context.page > 1
        ? {
            index: false,
            follow: true,
          }
        : undefined,
  };
}

export default async function StartupIndustryPage({
  params,
  searchParams,
}: StartupIndustryPageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getStartupListContext("industry", params.industrySlug, pageNumber);

  if (!context) {
    notFound();
  }

  const options = await getStartupTaxonomyOptions("industry");
  const related = options.filter((item) => item.slug !== context.slug).slice(0, 12);

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/startups/industry/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.label} startups`,
        description: context.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Startups", item: `${baseUrl}/startups` },
          { "@type": "ListItem", position: 3, name: "Industry", item: `${baseUrl}/startups/industry` },
          { "@type": "ListItem", position: 4, name: context.label, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        name: `${context.label} startup companies`,
        numberOfItems: context.totalCount,
        itemListElement: context.items.map((item, index) => ({
          "@type": "ListItem",
          position: (context.page - 1) * 50 + index + 1,
          url: `${baseUrl}/company/${item.companySlug}`,
          name: item.companyName,
        })),
      },
    ],
  };

  return (
    <main className="min-h-screen bg-[#050505] text-[#EDEDED]">
      <Navbar />
      <StartupTaxonomyDetail
        context={context}
        basePath={`/startups/industry/${context.slug}`}
        related={related}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
