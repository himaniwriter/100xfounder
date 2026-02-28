import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { StartupTaxonomyDetail } from "@/app/startups/_components/startup-taxonomy-detail";
import {
  STARTUP_INDEX_THRESHOLD,
  STARTUP_STATIC_PARAMS_CAP,
  getStartupListContext,
  getStartupTaxonomyOptions,
} from "@/lib/startups/catalog";
import { serializeJsonLd } from "@/lib/security/sanitize";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const revalidate = 21600;

type StartupRoundPageProps = {
  params: {
    roundSlug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateStaticParams(): Promise<Array<{ roundSlug: string }>> {
  const options = await getStartupTaxonomyOptions("funding-round");
  return options
    .filter((item) => item.count >= STARTUP_INDEX_THRESHOLD)
    .slice(0, STARTUP_STATIC_PARAMS_CAP)
    .map((item) => ({ roundSlug: item.slug }));
}

function parsePage(raw: string | string[] | undefined): number {
  if (!raw) {
    return 1;
  }

  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) {
    return 1;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return 1;
  }

  return parsed;
}

export async function generateMetadata({
  params,
  searchParams,
}: StartupRoundPageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getStartupListContext("funding-round", params.roundSlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Funding Round Page Not Found | 100Xfounder",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonicalPath = `/startups/funding-round/${context.slug}`;
  const canonical = `${baseUrl}${canonicalPath}${context.page > 1 ? `?page=${context.page}` : ""}`;

  return {
    title: `${context.label} Startups | 100Xfounder`,
    description: context.description,
    alternates: {
      canonical,
    },
    robots:
      !context.shouldIndex
        ? {
            index: false,
            follow: true,
          }
        : undefined,
  };
}

export default async function StartupRoundPage({
  params,
  searchParams,
}: StartupRoundPageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getStartupListContext("funding-round", params.roundSlug, pageNumber);

  if (!context) {
    notFound();
  }

  if (params.roundSlug !== context.slug) {
    const query = new URLSearchParams();
    Object.entries(searchParams ?? {}).forEach(([key, value]) => {
      if (typeof value === "string") {
        query.set(key, value);
        return;
      }
      if (Array.isArray(value)) {
        value.forEach((item) => query.append(key, item));
      }
    });
    const qs = query.toString();
    redirect(`/startups/funding-round/${context.slug}${qs ? `?${qs}` : ""}`);
  }

  const options = await getStartupTaxonomyOptions("funding-round");
  const related = options.filter((item) => item.slug !== context.slug).slice(0, 12);

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/startups/funding-round/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `${context.label} startup companies`,
        description: context.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Startups", item: `${baseUrl}/startups` },
          { "@type": "ListItem", position: 3, name: "Funding Round", item: `${baseUrl}/startups/funding-round` },
          { "@type": "ListItem", position: 4, name: context.label, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        name: `${context.label} startup list`,
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
        basePath={`/startups/funding-round/${context.slug}`}
        related={related}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
