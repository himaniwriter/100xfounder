import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { slugifySegment } from "@/lib/founders/hubs";
import { getSiteBaseUrl } from "@/lib/sitemap";

const LEGACY_STARTUP_REDIRECTS: Record<string, string> = {
  "ai-startups": "/startups/industry/artificial-intelligence",
  "biotech-startups": "/startups/industry/biotech",
  "cybersecurity-startups": "/startups/industry/cybersecurity",
  "e-commerce-startups": "/startups/industry/e-commerce",
  "edtech-startups": "/startups/industry/edtech",
  "fintech-startups": "/startups/industry/fintech",
  "healthcare-startups": "/startups/industry/healthcare",
  "marketplace-startups": "/startups/industry/marketplace",
  "saas-startups": "/startups/industry/saas",
  "sustainability-startups": "/startups/industry/sustainability",
  "early-stage-startups": "/startups/funding-round/seed",
  "growth-stage-startups": "/startups/funding-round/series-b",
  "mature-startups": "/startups/funding-round/series-d",
  "under-50-employees": "/startups/funding-round/seed",
  "under-100-employees": "/startups/funding-round/series-a",
  "under-500-employees": "/startups/funding-round/series-b",
  "founded-in-2021": "/startups/funding-round/series-a",
  "founded-in-2020": "/startups/funding-round/series-b",
  "remote-startups": "/startups/location/remote",
  "united-states-startups": "/startups/location/usa",
  "startups-in-new-york": "/startups/location/new-york",
  "startups-in-chicago": "/startups/location/chicago",
  "startups-in-boston": "/startups/location/boston",
  "startups-in-san-francisco": "/startups/location/san-francisco-bay-area",
  "startups-in-los-angeles": "/startups/location/los-angeles",
  "startups-in-seattle": "/startups/location/seattle",
  "startups-in-austin": "/startups/location/austin",
  "startups-in-miami": "/startups/location/miami",
  "startups-in-washington-dc": "/startups/location/washington",
  "startups-in-dallas": "/startups/location/dallas",
  "startups-in-philadelphia": "/startups/location/philadelphia",
  "startups-in-san-diego": "/startups/location/san-diego",
  "startups-in-houston": "/startups/location/houston",
  "startups-in-atlanta": "/startups/location/atlanta",
  "startups-in-denver": "/startups/location/denver",
  "startups-in-india": "/startups/location/india",
  "startups-in-london": "/startups/location/london",
  "startups-in-canada": "/startups/location/canada",
};

type LegacyStartupPageProps = {
  params: {
    slug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

function toSearchParams(input: Record<string, string | string[] | undefined> | undefined) {
  const params = new URLSearchParams();

  Object.entries(input || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry?.trim()) {
          params.append(key, entry.trim());
        }
      });
      return;
    }

    if (typeof value === "string" && value.trim()) {
      params.append(key, value.trim());
    }
  });

  return params;
}

function resolveLegacyTarget(slug: string): string {
  if (LEGACY_STARTUP_REDIRECTS[slug]) {
    return LEGACY_STARTUP_REDIRECTS[slug];
  }

  if (slug.startsWith("startups-in-")) {
    return `/startups/location/${slug.replace("startups-in-", "")}`;
  }

  if (slug.endsWith("-startups")) {
    const taxonomy = slug.replace(/-startups$/, "");
    return `/startups/industry/${slugifySegment(taxonomy)}`;
  }

  return "/startups";
}

export async function generateMetadata({ params }: LegacyStartupPageProps): Promise<Metadata> {
  const destination = resolveLegacyTarget(params.slug);
  const baseUrl = getSiteBaseUrl();

  return {
    title: "Startup Category Redirect | 100Xfounder",
    alternates: {
      canonical: `${baseUrl}${destination}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function LegacyStartupPage({ params, searchParams }: LegacyStartupPageProps) {
  const destination = resolveLegacyTarget(params.slug);
  const query = toSearchParams(searchParams).toString();
  permanentRedirect(query ? `${destination}?${query}` : destination);
}
