import { permanentRedirect } from "next/navigation";

type LegacySalaryDatabasePageProps = {
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

export default function LegacySalaryDatabasePage({
  searchParams,
}: LegacySalaryDatabasePageProps) {
  const params = toSearchParams(searchParams);
  const query = params.toString();

  permanentRedirect(query ? `/startups/salary-equity?${query}` : "/startups/salary-equity");
}
