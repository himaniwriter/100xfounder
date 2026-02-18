import { countryToSlug } from "@/lib/founders/country-tier";
import { getFounderDirectory } from "@/lib/founders/store";
import type { FounderDirectoryItem } from "@/lib/founders/types";

export type HubOption = {
  slug: string;
  label: string;
  count: number;
};

export function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalize(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function uniqueByCompany(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  const byCompany = new Map<string, FounderDirectoryItem>();
  items.forEach((item) => {
    if (!byCompany.has(item.companySlug)) {
      byCompany.set(item.companySlug, item);
    }
  });
  return Array.from(byCompany.values());
}

export async function getIndustryOptions(): Promise<HubOption[]> {
  const founders = await getFounderDirectory({ perCountryLimit: 500 });
  const grouped = new Map<string, { label: string; companies: Set<string> }>();

  founders.forEach((item) => {
    const key = normalize(item.industry);
    if (!key) {
      return;
    }

    const current = grouped.get(key) ?? {
      label: item.industry,
      companies: new Set<string>(),
    };
    current.companies.add(item.companySlug);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      slug: slugifySegment(item.label),
      label: item.label,
      count: item.companies.size,
    }))
    .filter((item) => item.slug.length > 0)
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)));
}

export async function getStageOptions(): Promise<HubOption[]> {
  const founders = await getFounderDirectory({ perCountryLimit: 500 });
  const grouped = new Map<string, { label: string; companies: Set<string> }>();

  founders.forEach((item) => {
    const key = normalize(item.stage);
    if (!key) {
      return;
    }

    const current = grouped.get(key) ?? {
      label: item.stage,
      companies: new Set<string>(),
    };
    current.companies.add(item.companySlug);
    grouped.set(key, current);
  });

  return Array.from(grouped.values())
    .map((item) => ({
      slug: slugifySegment(item.label),
      label: item.label,
      count: item.companies.size,
    }))
    .filter((item) => item.slug.length > 0)
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)));
}

export async function getFoundersByIndustrySlug(industrySlug: string): Promise<{
  label: string;
  founders: FounderDirectoryItem[];
  companies: FounderDirectoryItem[];
} | null> {
  const options = await getIndustryOptions();
  const match = options.find((item) => item.slug === industrySlug);
  if (!match) {
    return null;
  }

  const founders = await getFounderDirectory({ industry: [match.label], perCountryLimit: 500 });
  return {
    label: match.label,
    founders,
    companies: uniqueByCompany(founders),
  };
}

export async function getFoundersByStageSlug(stageSlug: string): Promise<{
  label: string;
  founders: FounderDirectoryItem[];
  companies: FounderDirectoryItem[];
} | null> {
  const options = await getStageOptions();
  const match = options.find((item) => item.slug === stageSlug);
  if (!match) {
    return null;
  }

  const founders = await getFounderDirectory({ stage: [match.label], perCountryLimit: 500 });
  return {
    label: match.label,
    founders,
    companies: uniqueByCompany(founders),
  };
}

export async function getCountryIndustryContext(countrySlug: string, industrySlug: string): Promise<{
  country: string;
  industry: string;
  founders: FounderDirectoryItem[];
  companies: FounderDirectoryItem[];
} | null> {
  const founders = await getFounderDirectory({ perCountryLimit: 500 });

  const country = founders
    .map((item) => item.country ?? "")
    .find((item) => item && countryToSlug(item) === countrySlug);

  if (!country) {
    return null;
  }

  const countryFounders = founders.filter((item) => (item.country ?? "") === country);
  const industryMap = new Map<string, string>();
  countryFounders.forEach((item) => {
    const slug = slugifySegment(item.industry);
    if (!industryMap.has(slug)) {
      industryMap.set(slug, item.industry);
    }
  });

  const industry = industryMap.get(industrySlug);
  if (!industry) {
    return null;
  }

  const scoped = countryFounders.filter((item) => slugifySegment(item.industry) === industrySlug);

  return {
    country,
    industry,
    founders: scoped,
    companies: uniqueByCompany(scoped),
  };
}
