import { permanentRedirect } from "next/navigation";
import {
  mapSourceJobsQueryToPath,
} from "@/lib/startups/catalog";

type JobsLegacyPageProps = {
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

function preserveTracking(searchParams: URLSearchParams) {
  const output = new URLSearchParams();
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "source"].forEach(
    (key) => {
      const value = searchParams.get(key);
      if (value) {
        output.set(key, value);
      }
    },
  );
  const query = output.toString();
  return query ? `/startups/jobs?${query}` : "/startups/jobs";
}

export default function JobsLegacyPage({ searchParams }: JobsLegacyPageProps) {
  const params = toSearchParams(searchParams);
  const mapped = mapSourceJobsQueryToPath(params);

  if (mapped) {
    permanentRedirect(mapped);
  }

  permanentRedirect(preserveTracking(params));
}
