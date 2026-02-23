import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getSiteBaseUrl } from "@/lib/sitemap";

type LegacyFounderPageProps = {
  params: {
    slug: string;
  };
  searchParams?: Record<string, string | string[] | undefined>;
};

export async function generateMetadata({
  params,
}: LegacyFounderPageProps): Promise<Metadata> {
  const baseUrl = getSiteBaseUrl();
  return {
    title: "Founder Profile Redirect | 100Xfounder",
    alternates: {
      canonical: `${baseUrl}/founders/${params.slug}`,
    },
    robots: {
      index: false,
      follow: true,
    },
  };
}

export default function LegacyFounderPage({
  params,
  searchParams,
}: LegacyFounderPageProps) {
  const query = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry?.trim()) {
          query.append(key, entry.trim());
        }
      });
      return;
    }

    if (typeof value === "string" && value.trim()) {
      query.append(key, value.trim());
    }
  });

  const queryString = query.toString();
  const destination = `/founders/${params.slug}${queryString ? `?${queryString}` : ""}`;
  permanentRedirect(destination);
}
