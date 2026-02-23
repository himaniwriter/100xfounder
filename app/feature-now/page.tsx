import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";
import { getSiteBaseUrl } from "@/lib/sitemap";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Feature Now | 100Xfounder",
  description: "Get featured on 100Xfounder with a verified founder profile and editorial review.",
  alternates: {
    canonical: `${getSiteBaseUrl()}/get-featured`,
  },
  robots: {
    index: false,
    follow: true,
  },
};

type FeatureNowPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export default function FeatureNowPage({ searchParams }: FeatureNowPageProps) {
  const params = new URLSearchParams();
  Object.entries(searchParams ?? {}).forEach(([key, value]) => {
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

  if (!params.has("source")) {
    params.set("source", "feature_now");
  }

  const queryString = params.toString();
  permanentRedirect(queryString ? `/get-featured?${queryString}` : "/get-featured");
}
