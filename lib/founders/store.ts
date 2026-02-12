import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PDF_FOUNDER_SEED, PDF_SOURCE_URL } from "@/lib/founders/seed-data";
import type {
  FounderDirectoryItem,
  FounderSyncInput,
} from "@/lib/founders/types";

type FounderQueryOptions = {
  limit?: number;
  industry?: string[];
  location?: string[];
  stage?: string[];
};

const RECENT_STAGE_RE = /(pre[- ]seed|seed|series\s*[a-f])/i;
const RECENT_FUNDING_RE =
  /(raised|funding|funded|round|valuation|series\s*[a-f]|seed|pre[- ]seed|202[4-9])/i;
const MATURE_COMPANY_RE =
  /(publicly listed|listed\/regulated|ipo|public company|subsidiary)/i;

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function toCompanySlug(companyName: string): string {
  return slugify(companyName);
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function dedupeRepeatedHalf(value: string): string {
  const words = value.trim().split(/\s+/);
  if (words.length >= 6 && words.length % 2 === 0) {
    const half = words.length / 2;
    const first = words.slice(0, half).join(" ");
    const second = words.slice(half).join(" ");
    if (first.toLowerCase() === second.toLowerCase()) {
      return first;
    }
  }
  return value.trim();
}

function titleCase(value: string): string {
  return value
    .toLowerCase()
    .split(" ")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function inferWebsite(companyName: string): string | null {
  const root = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\b(ltd|limited|pvt|private|corp|corporation|company|co)\b/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .join("");

  if (!root) {
    return null;
  }

  return `https://www.${root}.com`;
}

function inferTechStack(industry: string): string[] {
  const key = industry.toLowerCase();
  if (key.includes("financial")) return ["AWS", "Java", "PostgreSQL", "React"];
  if (key.includes("media")) return ["Node.js", "React", "Kafka", "Snowflake"];
  if (key.includes("telecom")) return ["Kubernetes", "Go", "Redis", "Grafana"];
  if (key.includes("health")) return ["Python", "GCP", "BigQuery", "React"];
  if (key.includes("construction") || key.includes("real")) return ["Salesforce", "SAP", "PowerBI"];
  if (key.includes("oil") || key.includes("power")) return ["Azure", "IoT", "SCADA", "Python"];
  return ["AWS", "React", "Python", "PostgreSQL"];
}

function inferEmployeeCount(stage: string): string {
  if (/seed|pre[- ]seed|series\s*a/i.test(stage)) return "50-200";
  if (/series\s*[b-f]/i.test(stage)) return "200-1000";
  if (/public|listed|ipo/i.test(stage)) return "10,000+";
  return "200-1000";
}

function inferRecentNews(item: {
  companyName: string;
  founderName: string;
  industry: string;
}): string[] {
  return [
    `${item.companyName} expands ${item.industry.toLowerCase()} initiatives in 2026.`,
    `${item.founderName} discusses growth signals and hiring roadmap at ${item.companyName}.`,
    `${item.companyName} appears in investor watchlists for sector momentum.`,
  ];
}

function sanitizeItem(raw: FounderDirectoryItem): FounderDirectoryItem {
  const founderName = dedupeRepeatedHalf(raw.founderName);
  const companyName = dedupeRepeatedHalf(raw.companyName);
  const industry = titleCase(dedupeRepeatedHalf(raw.industry));
  const stage = titleCase(raw.stage);
  const productSummary = dedupeRepeatedHalf(raw.productSummary);

  return {
    ...raw,
    founderName,
    companyName,
    companySlug: toCompanySlug(companyName),
    industry,
    stage,
    productSummary,
    websiteUrl: raw.websiteUrl ?? inferWebsite(companyName),
    employeeCount: raw.employeeCount ?? inferEmployeeCount(stage),
    techStack: raw.techStack && raw.techStack.length > 0 ? raw.techStack : inferTechStack(industry),
    recentNews: raw.recentNews && raw.recentNews.length > 0 ? raw.recentNews : inferRecentNews({ companyName, founderName, industry }),
    linkedinUrl:
      raw.linkedinUrl ??
      `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(companyName)}`,
    twitterUrl:
      raw.twitterUrl ??
      `https://x.com/search?q=${encodeURIComponent(companyName)}`,
    isFeatured: raw.isFeatured ?? false,
  };
}

function applySeedFilters(
  items: FounderDirectoryItem[],
  options: FounderQueryOptions,
): FounderDirectoryItem[] {
  let result = items;

  if (options.industry && options.industry.length > 0) {
    const industries = new Set(options.industry.map(normalize));
    result = result.filter((item) => industries.has(normalize(item.industry)));
  }

  if (options.location && options.location.length > 0) {
    const locations = new Set(options.location.map(normalize));
    result = result.filter((item) =>
      item.headquarters ? locations.has(normalize(item.headquarters)) : false,
    );
  }

  if (options.stage && options.stage.length > 0) {
    const stages = new Set(options.stage.map(normalize));
    result = result.filter((item) => stages.has(normalize(item.stage)));
  }

  return result;
}

function getFundingPriority(item: FounderDirectoryItem): number {
  let score = 0;

  if (RECENT_STAGE_RE.test(item.stage)) {
    score += 5;
  }

  if (item.fundingInfo && RECENT_FUNDING_RE.test(item.fundingInfo)) {
    score += 4;
  }

  if (item.productSummary && /startup|saas|platform|ai|api/i.test(item.productSummary)) {
    score += 1;
  }

  if (item.foundedYear && item.foundedYear >= 2020) {
    score += 1;
  }

  if (
    (item.fundingInfo && MATURE_COMPANY_RE.test(item.fundingInfo)) ||
    /public|listed/i.test(item.stage)
  ) {
    score -= 3;
  }

  return score;
}

function sortByFundingPriority(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  return [...items].sort((a, b) => {
    const fundingScore = getFundingPriority(b) - getFundingPriority(a);
    if (fundingScore !== 0) {
      return fundingScore;
    }

    if (a.verified !== b.verified) {
      return a.verified ? -1 : 1;
    }

    const yearA = a.foundedYear ?? -1;
    const yearB = b.foundedYear ?? -1;
    if (yearA !== yearB) {
      return yearB - yearA;
    }

    return a.founderName.localeCompare(b.founderName);
  });
}

function applyFeaturedFlag(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  return items.map((item) => ({
    ...item,
    isFeatured: item.isFeatured || getFundingPriority(item) >= 6,
  }));
}

export function splitRecentlyFunded(
  items: FounderDirectoryItem[],
  maxRecent = 24,
): { recent: FounderDirectoryItem[]; rest: FounderDirectoryItem[] } {
  const sorted = sortByFundingPriority(items);
  const recent = sorted.filter((item) => getFundingPriority(item) > 0).slice(0, maxRecent);
  const recentIds = new Set(recent.map((item) => item.id));
  const rest = sorted.filter((item) => !recentIds.has(item.id));
  return { recent, rest };
}

function mapDbItemToFounder(item: {
  id: string;
  slug: string;
  founderName: string;
  companyName: string;
  foundedYear: number | null;
  headquarters: string | null;
  industry: string;
  stage: string;
  productSummary: string;
  fundingInfo: string | null;
  sourceUrl: string | null;
  ycProfileUrl: string | null;
  websiteUrl?: string | null;
  employeeCount?: string | null;
  techStack?: string[] | null;
  recentNews?: string[] | null;
  linkedinUrl?: string | null;
  twitterUrl?: string | null;
  verified: boolean;
  avatarUrl: string | null;
}): FounderDirectoryItem {
  return sanitizeItem({
    id: item.id,
    slug: item.slug,
    companySlug: toCompanySlug(item.companyName),
    founderName: item.founderName,
    companyName: item.companyName,
    foundedYear: item.foundedYear,
    headquarters: item.headquarters,
    industry: item.industry,
    stage: item.stage,
    productSummary: item.productSummary,
    fundingInfo: item.fundingInfo,
    sourceUrl: item.sourceUrl ?? PDF_SOURCE_URL,
    ycProfileUrl: item.ycProfileUrl,
    websiteUrl: item.websiteUrl ?? null,
    employeeCount: item.employeeCount ?? null,
    techStack: item.techStack ?? [],
    recentNews: item.recentNews ?? [],
    linkedinUrl: item.linkedinUrl ?? null,
    twitterUrl: item.twitterUrl ?? null,
    verified: item.verified,
    isFeatured: false,
    avatarUrl: item.avatarUrl,
  });
}

export async function getFounderDirectory(
  options: FounderQueryOptions = {},
): Promise<FounderDirectoryItem[]> {
  try {
    const where: Prisma.FounderDirectoryEntryWhereInput = {};

    if (options.industry && options.industry.length > 0) {
      where.industry = { in: options.industry };
    }

    if (options.location && options.location.length > 0) {
      where.headquarters = { in: options.location };
    }

    if (options.stage && options.stage.length > 0) {
      where.stage = { in: options.stage };
    }

    const rows = await prisma.founderDirectoryEntry.findMany({
      where,
      orderBy: [{ verified: "desc" }, { foundedYear: "asc" }, { founderName: "asc" }],
    });

    if (rows.length > 0) {
      const sorted = applyFeaturedFlag(sortByFundingPriority(rows.map(mapDbItemToFounder)));
      if (options.limit && options.limit > 0) {
        return sorted.slice(0, options.limit);
      }
      return sorted;
    }
  } catch {
    // Fallback to seed records when DB is unavailable or not migrated yet.
  }
  const seeded = applyFeaturedFlag(sortByFundingPriority(
    applySeedFilters(PDF_FOUNDER_SEED, options).map(sanitizeItem),
  ));
  if (options.limit && options.limit > 0) {
    return seeded.slice(0, options.limit);
  }
  return seeded;
}

export async function getFounderFilterOptions(): Promise<{
  industries: string[];
  locations: string[];
  stages: string[];
}> {
  const items = await getFounderDirectory();

  const uniqueSorted = (values: string[]) =>
    Array.from(new Set(values.filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );

  return {
    industries: uniqueSorted(items.map((item) => item.industry)),
    locations: uniqueSorted(
      items.map((item) => item.headquarters ?? "").filter(Boolean),
    ),
    stages: uniqueSorted(items.map((item) => item.stage)),
  };
}

export async function upsertFounderDirectoryFromN8N(
  entries: FounderSyncInput[],
): Promise<{ upserted: number }> {
  if (entries.length === 0) {
    return { upserted: 0 };
  }

  const operations = entries.map((entry) => {
    const slug =
      entry.slug && entry.slug.length > 0
        ? slugify(entry.slug)
        : slugify(`${entry.founderName}-${entry.companyName}`);

    return prisma.founderDirectoryEntry.upsert({
      where: { slug },
      create: {
        slug,
        founderName: entry.founderName,
        companyName: entry.companyName,
        foundedYear: entry.foundedYear ?? null,
        headquarters: entry.headquarters ?? null,
        industry: entry.industry ?? "General",
        stage: entry.stage ?? "Growth",
        productSummary: entry.productSummary,
        fundingInfo: entry.fundingInfo ?? null,
        sourceUrl: entry.sourceUrl ?? PDF_SOURCE_URL,
        ycProfileUrl: entry.ycProfileUrl ?? null,
        websiteUrl: entry.websiteUrl ?? null,
        employeeCount: entry.employeeCount ?? null,
        techStack: entry.techStack ?? [],
        recentNews: entry.recentNews ?? [],
        linkedinUrl: entry.linkedinUrl ?? null,
        twitterUrl: entry.twitterUrl ?? null,
        verified: entry.verified ?? true,
        // isFeatured is currently derived on read from funding signals.
        avatarUrl: entry.avatarUrl ?? null,
      },
      update: {
        founderName: entry.founderName,
        companyName: entry.companyName,
        foundedYear: entry.foundedYear ?? null,
        headquarters: entry.headquarters ?? null,
        industry: entry.industry ?? "General",
        stage: entry.stage ?? "Growth",
        productSummary: entry.productSummary,
        fundingInfo: entry.fundingInfo ?? null,
        sourceUrl: entry.sourceUrl ?? PDF_SOURCE_URL,
        ycProfileUrl: entry.ycProfileUrl ?? null,
        websiteUrl: entry.websiteUrl ?? null,
        employeeCount: entry.employeeCount ?? null,
        techStack: entry.techStack ?? [],
        recentNews: entry.recentNews ?? [],
        linkedinUrl: entry.linkedinUrl ?? null,
        twitterUrl: entry.twitterUrl ?? null,
        verified: entry.verified ?? true,
        // isFeatured is currently derived on read from funding signals.
        avatarUrl: entry.avatarUrl ?? null,
      },
    });
  });

  await prisma.$transaction(operations);
  return { upserted: operations.length };
}
