import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
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

type StartupLocationPageProps = {
  params: {
    locationSlug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

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
}: StartupLocationPageProps): Promise<Metadata> {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getStartupListContext("location", params.locationSlug, pageNumber);

  if (!context) {
    return {
      title: "Startup Location Page Not Found | 100Xfounder",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  const baseUrl = getSiteBaseUrl();
  const canonicalPath = `/startups/location/${context.slug}`;
  const canonical = `${baseUrl}${canonicalPath}${context.page > 1 ? `?page=${context.page}` : ""}`;

  return {
    title: `Startups in ${context.label} | 100Xfounder`,
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

export default async function StartupLocationPage({
  params,
  searchParams,
}: StartupLocationPageProps) {
  const pageNumber = parsePage(searchParams?.page);
  const context = await getStartupListContext("location", params.locationSlug, pageNumber);

  if (!context) {
    notFound();
  }

  if (params.locationSlug !== context.slug) {
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
    redirect(`/startups/location/${context.slug}${qs ? `?${qs}` : ""}`);
  }

  const options = await getStartupTaxonomyOptions("location");
  const related = options.filter((item) => item.slug !== context.slug).slice(0, 12);

  const baseUrl = getSiteBaseUrl();
  const pageUrl = `${baseUrl}/startups/location/${context.slug}${
    context.page > 1 ? `?page=${context.page}` : ""
  }`;
  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        "@id": `${pageUrl}#webpage`,
        url: pageUrl,
        name: `Top startups in ${context.label}`,
        description: context.description,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Startups", item: `${baseUrl}/startups` },
          { "@type": "ListItem", position: 3, name: "Location", item: `${baseUrl}/startups/location` },
          { "@type": "ListItem", position: 4, name: context.label, item: pageUrl },
        ],
      },
      {
        "@type": "ItemList",
        name: `Startup companies in ${context.label}`,
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
        basePath={`/startups/location/${context.slug}`}
        related={related}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }} />
      <Footer />
    </main>
  );
}
