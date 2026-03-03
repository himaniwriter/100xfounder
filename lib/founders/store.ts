import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isDatabaseConfigured } from "@/lib/db-config";
import { buildPrimaryLinkedInAvatar } from "@/lib/founders/linkedin";
import { mirrorRemoteImageUrlToSupabase } from "@/lib/media/storage";
import { PDF_FOUNDER_SEED, PDF_SOURCE_URL } from "@/lib/founders/seed-data";
import {
  classifyCountryTier,
  countryToSlug,
  extractCountryFromHeadquarters,
} from "@/lib/founders/country-tier";
import { buildFundingSummary, buildHiringSummary } from "@/lib/founders/insights";
import type {
  CountryTier,
  FounderDirectoryItem,
  FounderSyncInput,
} from "@/lib/founders/types";

type FounderQueryOptions = {
  limit?: number;
  industry?: string[];
  location?: string[];
  stage?: string[];
  country?: string[];
  tier?: CountryTier[];
  perCountryLimit?: number;
};

const RECENT_STAGE_RE = /(pre[- ]seed|seed|series\s*[a-f])/i;
const RECENT_FUNDING_RE =
  /(raised|funding|funded|round|valuation|series\s*[a-f]|seed|pre[- ]seed|202[4-9])/i;
const MATURE_COMPANY_RE =
  /(publicly listed|listed\/regulated|ipo|public company|subsidiary)/i;
const COMPANY_SUFFIXES = new Set([
  "co",
  "company",
  "corp",
  "corporation",
  "inc",
  "incorporated",
  "llc",
  "ltd",
  "limited",
  "plc",
  "pvt",
  "private",
  "technologies",
  "technology",
]);

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

function normalizeForMatch(value: string | null | undefined): string {
  if (!value) {
    return "";
  }
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalCompanyKey(value: string): string {
  const cleaned = normalizeForMatch(value);
  if (!cleaned) {
    return "";
  }
  const words = cleaned
    .split(" ")
    .filter((word) => word && !COMPANY_SUFFIXES.has(word));
  return words.join(" ") || cleaned;
}

function profileQualityScore(item: FounderDirectoryItem): number {
  let score = 0;
  if (item.verified) score += 5;
  if (item.isFeatured) score += 4;
  if (item.fundingInfo) score += 3;
  if (item.websiteUrl) score += 2;
  if (item.ycProfileUrl) score += 2;
  if (item.linkedinUrl) score += 1;
  if (item.twitterUrl) score += 1;
  score += Math.min(item.recentNews.length, 3);
  score += Math.min(item.techStack.length, 4);
  score += Math.min(Math.floor(item.productSummary.length / 80), 3);
  score += Math.max(getFundingPriority(item), 0);
  return score;
}

function choosePreferredProfile(
  current: FounderDirectoryItem,
  candidate: FounderDirectoryItem,
): FounderDirectoryItem {
  const scoreCurrent = profileQualityScore(current);
  const scoreCandidate = profileQualityScore(candidate);
  if (scoreCandidate !== scoreCurrent) {
    return scoreCandidate > scoreCurrent ? candidate : current;
  }

  const yearCurrent = current.foundedYear ?? -1;
  const yearCandidate = candidate.foundedYear ?? -1;
  if (yearCandidate !== yearCurrent) {
    return yearCandidate > yearCurrent ? candidate : current;
  }

  return candidate.founderName.localeCompare(current.founderName) < 0
    ? candidate
    : current;
}

function dedupeCompanyProfiles(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  const byCompanyKey = new Map<string, FounderDirectoryItem>();

  items.forEach((item) => {
    const key = canonicalCompanyKey(item.companyName);
    if (!key) {
      return;
    }

    const current = byCompanyKey.get(key);
    if (!current) {
      byCompanyKey.set(key, item);
      return;
    }

    byCompanyKey.set(key, choosePreferredProfile(current, item));
  });

  return Array.from(byCompanyKey.values());
}

function exactDetailSignature(item: FounderDirectoryItem): string {
  const summary = normalizeForMatch(item.productSummary);
  const stage = normalizeForMatch(item.stage);
  const location = normalizeForMatch(item.headquarters ?? "");
  const funding = normalizeForMatch(item.fundingInfo ?? "");
  if (!summary || summary.length < 30) {
    return "";
  }
  return `${summary}::${stage}::${location}::${funding}`;
}

function dedupeExactDetailProfiles(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  const bySignature = new Map<string, FounderDirectoryItem>();
  const result: FounderDirectoryItem[] = [];

  items.forEach((item) => {
    const signature = exactDetailSignature(item);
    if (!signature) {
      result.push(item);
      return;
    }

    const current = bySignature.get(signature);
    if (!current) {
      bySignature.set(signature, item);
      result.push(item);
      return;
    }

    const preferred = choosePreferredProfile(current, item);
    if (preferred.id !== current.id) {
      bySignature.set(signature, preferred);
      const index = result.findIndex((candidate) => candidate.id === current.id);
      if (index >= 0) {
        result[index] = preferred;
      }
    }
  });

  return result;
}

function syncEntryQualityScore(entry: FounderSyncInput): number {
  let score = 0;
  if (entry.verified) score += 5;
  if (entry.fundingInfo) score += 3;
  if (entry.websiteUrl) score += 2;
  if (entry.ycProfileUrl) score += 2;
  if (entry.linkedinUrl) score += 1;
  if (entry.twitterUrl) score += 1;
  score += Math.min(entry.recentNews?.length ?? 0, 3);
  score += Math.min(entry.techStack?.length ?? 0, 4);
  score += Math.min(Math.floor(entry.productSummary.length / 80), 3);
  return score;
}

function choosePreferredSyncEntry(
  current: FounderSyncInput,
  candidate: FounderSyncInput,
): FounderSyncInput {
  const scoreCurrent = syncEntryQualityScore(current);
  const scoreCandidate = syncEntryQualityScore(candidate);
  if (scoreCandidate !== scoreCurrent) {
    return scoreCandidate > scoreCurrent ? candidate : current;
  }

  const yearCurrent = current.foundedYear ?? -1;
  const yearCandidate = candidate.foundedYear ?? -1;
  if (yearCandidate !== yearCurrent) {
    return yearCandidate > yearCurrent ? candidate : current;
  }

  return candidate.founderName.localeCompare(current.founderName) < 0
    ? candidate
    : current;
}

function dedupeSyncEntriesByCompany(entries: FounderSyncInput[]): FounderSyncInput[] {
  const byCompany = new Map<string, FounderSyncInput>();

  entries.forEach((entry) => {
    const key = canonicalCompanyKey(entry.companyName);
    if (!key) {
      return;
    }

    const current = byCompany.get(key);
    if (!current) {
      byCompany.set(key, entry);
      return;
    }

    byCompany.set(key, choosePreferredSyncEntry(current, entry));
  });

  return Array.from(byCompany.values());
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

function isPlaceholderFounderName(founderName: string, companyName: string): boolean {
  const normalizedFounder = normalizeForMatch(founderName);
  const normalizedCompany = normalizeForMatch(companyName);
  const companyKey = canonicalCompanyKey(companyName);

  if (!normalizedFounder || normalizedFounder.length < 3) {
    return true;
  }

  if (
    /\bleadership team\b/.test(normalizedFounder) ||
    /\bfounding team\b/.test(normalizedFounder) ||
    /\bexecutive team\b/.test(normalizedFounder)
  ) {
    return true;
  }

  if (
    normalizedFounder === normalizedCompany ||
    normalizedFounder === companyKey ||
    normalizedFounder === `${companyKey} founder` ||
    normalizedFounder.endsWith(" founder")
  ) {
    return true;
  }

  return false;
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

function parseDomain(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }

  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    const sanitized = value
      .replace(/^https?:\/\//i, "")
      .replace(/\/.*$/, "")
      .trim()
      .toLowerCase();
    return sanitized || null;
  }
}

function buildCompanyLogoFallback(
  companyName: string,
  websiteUrl: string | null | undefined,
): string | null {
  const inferredWebsite = websiteUrl ?? inferWebsite(companyName);
  const domain = parseDomain(inferredWebsite);
  if (!domain) {
    return null;
  }

  return `https://unavatar.io/${domain}`;
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
    `${item.founderName} discusses product roadmap and market execution at ${item.companyName}.`,
    `${item.companyName} appears in investor watchlists for sector momentum.`,
  ];
}

function sanitizeItem(raw: FounderDirectoryItem): FounderDirectoryItem {
  const founderNameRaw = dedupeRepeatedHalf(raw.founderName);
  const companyName = dedupeRepeatedHalf(raw.companyName);
  const founderName = /(founding team|leadership team)/i.test(founderNameRaw)
    ? `${companyName} Founder`
    : founderNameRaw;
  const industry = titleCase(dedupeRepeatedHalf(raw.industry));
  const stage = titleCase(raw.stage);
  const productSummary = dedupeRepeatedHalf(raw.productSummary);
  const recentNews =
    raw.recentNews && raw.recentNews.length > 0
      ? raw.recentNews
      : inferRecentNews({ companyName, founderName, industry });
  const sourceUrl = raw.sourceUrl ?? PDF_SOURCE_URL;
  const country = raw.country ?? extractCountryFromHeadquarters(raw.headquarters, sourceUrl);
  const countryTier = raw.countryTier ?? classifyCountryTier(country);
  const fundingSummary = buildFundingSummary({
    fundingInfo: raw.fundingInfo,
    productSummary,
    recentNews,
    sourceUrl,
  });
  const hiringSummary = buildHiringSummary({
    fundingInfo: raw.fundingInfo,
    productSummary,
    recentNews,
  });

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
    recentNews,
    sourceUrl,
    linkedinUrl:
      raw.linkedinUrl ??
      `https://www.linkedin.com/search/results/all/?keywords=${encodeURIComponent(founderName)}`,
    twitterUrl:
      raw.twitterUrl ??
      `https://x.com/search?q=${encodeURIComponent(companyName)}`,
    isFeatured: raw.isFeatured ?? false,
    avatarUrl:
      raw.avatarUrl ??
      buildCompanyLogoFallback(companyName, raw.websiteUrl) ??
      buildPrimaryLinkedInAvatar({
        linkedinUrl: raw.linkedinUrl,
        founderName,
      }),
    country,
    countryTier,
    fundingTotalDisplay: raw.fundingTotalDisplay ?? fundingSummary.fundingTotalDisplay,
    fundingTotalUsd: raw.fundingTotalUsd ?? fundingSummary.fundingTotalUsd,
    lastRound: raw.lastRound ?? fundingSummary.lastRound,
    allRounds:
      raw.allRounds && raw.allRounds.length > 0
        ? raw.allRounds
        : fundingSummary.allRounds,
    isHiring:
      typeof raw.isHiring === "boolean" ? raw.isHiring : hiringSummary.isHiring,
    hiringRoles:
      raw.hiringRoles && raw.hiringRoles.length > 0
        ? raw.hiringRoles
        : hiringSummary.hiringRoles,
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

  if (options.country && options.country.length > 0) {
    const countries = new Set(options.country.map(normalize));
    result = result.filter((item) => {
      const country = item.country ?? extractCountryFromHeadquarters(item.headquarters, item.sourceUrl);
      return countries.has(normalize(country));
    });
  }

  if (options.tier && options.tier.length > 0) {
    const tiers = new Set(options.tier);
    result = result.filter((item) => {
      const country = item.country ?? extractCountryFromHeadquarters(item.headquarters, item.sourceUrl);
      const tier = item.countryTier ?? classifyCountryTier(country);
      return tiers.has(tier);
    });
  }

  return result;
}

function applyPerCountryLimit(
  items: FounderDirectoryItem[],
  perCountryLimit: number | undefined,
): FounderDirectoryItem[] {
  const safeLimit =
    typeof perCountryLimit === "number" && Number.isFinite(perCountryLimit) && perCountryLimit > 0
      ? Math.floor(perCountryLimit)
      : 500;

  const counters = new Map<string, number>();
  const result: FounderDirectoryItem[] = [];

  items.forEach((item) => {
    const country = item.country ?? extractCountryFromHeadquarters(item.headquarters, item.sourceUrl);
    const current = counters.get(country) ?? 0;
    if (current >= safeLimit) {
      return;
    }
    counters.set(country, current + 1);
    result.push(item);
  });

  return result;
}

function getFundingPriority(item: FounderDirectoryItem): number {
  let score = 0;

  if (RECENT_STAGE_RE.test(item.stage)) {
    score += 5;
  }

  if (typeof item.fundingTotalUsd === "number" && item.fundingTotalUsd > 0) {
    score += Math.min(Math.log10(item.fundingTotalUsd + 1), 9);
  }

  if (item.fundingInfo && RECENT_FUNDING_RE.test(item.fundingInfo)) {
    score += 4;
  }

  if (item.lastRound?.announcedOn && /^20[0-9]{2}$/.test(item.lastRound.announcedOn)) {
    const year = Number(item.lastRound.announcedOn);
    if (year >= 2025) {
      score += 2;
    } else if (year >= 2023) {
      score += 1;
    }
  }

  if (item.isHiring) {
    score += 1;
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

function mergeUniqueBySlug(
  primary: FounderDirectoryItem[],
  secondary: FounderDirectoryItem[],
): FounderDirectoryItem[] {
  const bySlug = new Map<string, FounderDirectoryItem>();
  primary.forEach((item) => bySlug.set(item.slug, item));
  secondary.forEach((item) => {
    if (!bySlug.has(item.slug)) {
      bySlug.set(item.slug, item);
    }
  });
  return Array.from(bySlug.values());
}

function finalizeFounderDirectory(
  items: FounderDirectoryItem[],
  options: FounderQueryOptions,
): FounderDirectoryItem[] {
  const trustFiltered = items.filter(
    (item) => !isPlaceholderFounderName(item.founderName, item.companyName),
  );
  const filtered = applySeedFilters(trustFiltered, options);
  const countryLimited = applyPerCountryLimit(filtered, options.perCountryLimit);
  if (options.limit && options.limit > 0) {
    return countryLimited.slice(0, options.limit);
  }
  return countryLimited;
}

function hasScopedFilters(options: FounderQueryOptions): boolean {
  return Boolean(
    (options.industry && options.industry.length > 0) ||
      (options.location && options.location.length > 0) ||
      (options.stage && options.stage.length > 0) ||
      (options.country && options.country.length > 0) ||
      (options.tier && options.tier.length > 0),
  );
}

function buildSeededDirectoryBase(): FounderDirectoryItem[] {
  return applyFeaturedFlag(
    sortByFundingPriority(
      dedupeExactDetailProfiles(
        dedupeCompanyProfiles(PDF_FOUNDER_SEED.map(sanitizeItem)),
      ),
    ),
  );
}

async function loadFounderDirectoryBaseUnfiltered(): Promise<FounderDirectoryItem[]> {
  if (!isDatabaseConfigured()) {
    return buildSeededDirectoryBase();
  }

  try {
    const rows = await prisma.founderDirectoryEntry.findMany({
      orderBy: [{ verified: "desc" }, { foundedYear: "asc" }, { founderName: "asc" }],
    });

    if (rows.length > 0) {
      const dbItems = rows.map(mapDbItemToFounder);
      const mergedItems = mergeUniqueBySlug(dbItems, PDF_FOUNDER_SEED.map(sanitizeItem));
      const uniqueItems = dedupeExactDetailProfiles(dedupeCompanyProfiles(mergedItems));
      return applyFeaturedFlag(sortByFundingPriority(uniqueItems));
    }
  } catch {
    // Fallback to seeded base.
  }

  return buildSeededDirectoryBase();
}

const FOUNDER_BASE_CACHE_TTL_MS = 20 * 60 * 1000;
let founderDirectoryBaseCache:
  | {
      expiresAt: number;
      value: FounderDirectoryItem[];
    }
  | null = null;

async function getCachedFounderDirectoryBaseUnfiltered(): Promise<FounderDirectoryItem[]> {
  const now = Date.now();
  if (founderDirectoryBaseCache && founderDirectoryBaseCache.expiresAt > now) {
    return founderDirectoryBaseCache.value;
  }

  const nextValue = await loadFounderDirectoryBaseUnfiltered();
  founderDirectoryBaseCache = {
    value: nextValue,
    expiresAt: now + FOUNDER_BASE_CACHE_TTL_MS,
  };
  return nextValue;
}

export function splitRecentlyFunded(
  items: FounderDirectoryItem[],
  maxRecent = 24,
): { recent: FounderDirectoryItem[]; rest: FounderDirectoryItem[] } {
  const sorted = sortByFundingPriority(
    dedupeExactDetailProfiles(dedupeCompanyProfiles(items)),
  );
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
  if (!hasScopedFilters(options)) {
    const baseItems = await getCachedFounderDirectoryBaseUnfiltered();
    return finalizeFounderDirectory(baseItems, options);
  }

  if (!isDatabaseConfigured()) {
    const seeded = applyFeaturedFlag(
      sortByFundingPriority(
        dedupeExactDetailProfiles(
          dedupeCompanyProfiles(
            applySeedFilters(PDF_FOUNDER_SEED, options).map(sanitizeItem),
          ),
        ),
      ),
    );
    return finalizeFounderDirectory(seeded, options);
  }

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
      const dbItems = rows.map(mapDbItemToFounder);
      const mergedItems = mergeUniqueBySlug(
        dbItems,
        applySeedFilters(PDF_FOUNDER_SEED, options).map(sanitizeItem),
      );
      const uniqueItems = dedupeExactDetailProfiles(dedupeCompanyProfiles(mergedItems));
      const sorted = applyFeaturedFlag(sortByFundingPriority(uniqueItems));
      return finalizeFounderDirectory(sorted, options);
    }
  } catch {
    // Fallback to seed records when DB is unavailable or not migrated yet.
  }
  const seeded = applyFeaturedFlag(
    sortByFundingPriority(
      dedupeExactDetailProfiles(
        dedupeCompanyProfiles(
          applySeedFilters(PDF_FOUNDER_SEED, options).map(sanitizeItem),
        ),
      ),
    ),
  );
  return finalizeFounderDirectory(seeded, options);
}

export async function getFounderFilterOptions(): Promise<{
  industries: string[];
  locations: string[];
  stages: string[];
  countries: string[];
  tiers: CountryTier[];
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
    countries: uniqueSorted(
      items
        .map((item) => item.country ?? "Unknown")
        .filter((country) => country !== "Unknown"),
    ),
    tiers: Array.from(
      new Set(
        items
          .filter((item) => (item.country ?? "Unknown") !== "Unknown")
          .map((item) => item.countryTier ?? classifyCountryTier(item.country ?? "Unknown")),
      ),
    ).sort(),
  };
}

export type CountryCoverage = {
  country: string;
  countrySlug: string;
  tier: CountryTier;
  companyCount: number;
  founderCount: number;
  hiringCompanies: number;
  fundedCompanies: number;
};

export async function getCountryCoverage(): Promise<CountryCoverage[]> {
  const items = await getFounderDirectory({ perCountryLimit: 500 });
  const grouped = new Map<
    string,
    {
      tier: CountryTier;
      founderCount: number;
      companySlugs: Set<string>;
      hiringCompanySlugs: Set<string>;
      fundedCompanySlugs: Set<string>;
    }
  >();

  items.forEach((item) => {
    const country = item.country ?? extractCountryFromHeadquarters(item.headquarters, item.sourceUrl);
    if (country === "Unknown") {
      return;
    }
    const tier = item.countryTier ?? classifyCountryTier(country);
    const current = grouped.get(country) ?? {
      tier,
      founderCount: 0,
      companySlugs: new Set<string>(),
      hiringCompanySlugs: new Set<string>(),
      fundedCompanySlugs: new Set<string>(),
    };

    current.founderCount += 1;
    current.companySlugs.add(item.companySlug);

    if (item.isHiring) {
      current.hiringCompanySlugs.add(item.companySlug);
    }

    if ((typeof item.fundingTotalUsd === "number" && item.fundingTotalUsd > 0) || item.fundingInfo) {
      current.fundedCompanySlugs.add(item.companySlug);
    }

    grouped.set(country, current);
  });

  return Array.from(grouped.entries())
    .map(([country, value]) => ({
      country,
      countrySlug: countryToSlug(country),
      tier: value.tier,
      companyCount: value.companySlugs.size,
      founderCount: value.founderCount,
      hiringCompanies: value.hiringCompanySlugs.size,
      fundedCompanies: value.fundedCompanySlugs.size,
    }))
    .sort((a, b) => {
      if (a.tier !== b.tier) {
        return a.tier.localeCompare(b.tier);
      }
      if (a.companyCount !== b.companyCount) {
        return b.companyCount - a.companyCount;
      }
      return a.country.localeCompare(b.country);
    });
}

export async function getFounderDirectoryLastUpdatedAt(): Promise<Date> {
  if (!isDatabaseConfigured()) {
    return new Date();
  }

  try {
    const aggregate = await prisma.founderDirectoryEntry.aggregate({
      _max: {
        updatedAt: true,
      },
    });

    return aggregate._max.updatedAt ?? new Date();
  } catch {
    return new Date();
  }
}

export async function upsertFounderDirectoryFromN8N(
  entries: FounderSyncInput[],
): Promise<{ upserted: number }> {
  if (entries.length === 0) {
    return { upserted: 0 };
  }

  const dedupedEntries = dedupeSyncEntriesByCompany(entries);
  const normalizedEntries: FounderSyncInput[] = [];

  for (const entry of dedupedEntries) {
    const fallbackCompanyLogo = buildCompanyLogoFallback(
      entry.companyName,
      entry.websiteUrl ?? null,
    );
    const fallbackAvatar =
      fallbackCompanyLogo ??
      buildPrimaryLinkedInAvatar({
        linkedinUrl: entry.linkedinUrl,
        founderName: entry.founderName,
      }) ?? null;
    const originalAvatar = entry.avatarUrl ?? fallbackAvatar;
    let mirroredAvatar = originalAvatar;

    if (originalAvatar) {
      try {
        mirroredAvatar = await mirrorRemoteImageUrlToSupabase(originalAvatar, {
          folder: "companies/logos",
        });
      } catch {
        mirroredAvatar = originalAvatar;
      }
    }

    normalizedEntries.push({
      ...entry,
      avatarUrl: mirroredAvatar,
    });
  }

  const operations = normalizedEntries.map((entry) => {
    const slug =
      entry.slug && entry.slug.length > 0
        ? slugify(entry.slug)
        : slugify(`${entry.founderName}-${entry.companyName}`);
    const synthesizedFundingInfo =
      entry.fundingInfo ??
      (() => {
        const value = [
          entry.fundingTotalDisplay ? `Total funding: ${entry.fundingTotalDisplay}` : "",
          entry.lastRound
            ? `Last round: ${entry.lastRound.round} ${entry.lastRound.amount}${
                entry.lastRound.announcedOn ? ` (${entry.lastRound.announcedOn})` : ""
              }`
            : "",
        ]
          .filter(Boolean)
          .join(". ");
        return value || null;
      })();
    const synthesizedRecentNews =
      entry.recentNews && entry.recentNews.length > 0
        ? entry.recentNews
        : [
            ...(entry.allRounds ?? []).slice(0, 4).map(
              (round) =>
                `${entry.companyName} ${round.round} ${round.amount}${
                  round.announcedOn ? ` (${round.announcedOn})` : ""
                }.`,
            ),
            ...(entry.hiringRoles && entry.hiringRoles.length > 0
              ? [`${entry.companyName} hiring for ${entry.hiringRoles.join(", ")}.`]
              : []),
          ];
    const synthesizedSummary =
      entry.isHiring && entry.hiringRoles && entry.hiringRoles.length > 0
        ? `${entry.productSummary} Hiring focus: ${entry.hiringRoles.join(", ")}.`
        : entry.productSummary;

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
        productSummary: synthesizedSummary,
        fundingInfo: synthesizedFundingInfo,
        sourceUrl: entry.sourceUrl ?? PDF_SOURCE_URL,
        ycProfileUrl: entry.ycProfileUrl ?? null,
        websiteUrl: entry.websiteUrl ?? null,
        employeeCount: entry.employeeCount ?? null,
        techStack: entry.techStack ?? [],
        recentNews: synthesizedRecentNews,
        linkedinUrl: entry.linkedinUrl ?? null,
        twitterUrl: entry.twitterUrl ?? null,
        verified: entry.verified ?? true,
        // isFeatured is currently derived on read from funding signals.
        avatarUrl: entry.avatarUrl,
      },
      update: {
        founderName: entry.founderName,
        companyName: entry.companyName,
        foundedYear: entry.foundedYear ?? null,
        headquarters: entry.headquarters ?? null,
        industry: entry.industry ?? "General",
        stage: entry.stage ?? "Growth",
        productSummary: synthesizedSummary,
        fundingInfo: synthesizedFundingInfo,
        sourceUrl: entry.sourceUrl ?? PDF_SOURCE_URL,
        ycProfileUrl: entry.ycProfileUrl ?? null,
        websiteUrl: entry.websiteUrl ?? null,
        employeeCount: entry.employeeCount ?? null,
        techStack: entry.techStack ?? [],
        recentNews: synthesizedRecentNews,
        linkedinUrl: entry.linkedinUrl ?? null,
        twitterUrl: entry.twitterUrl ?? null,
        verified: entry.verified ?? true,
        // isFeatured is currently derived on read from funding signals.
        avatarUrl: entry.avatarUrl,
      },
    });
  });

  await prisma.$transaction(operations);
  return { upserted: operations.length };
}

export async function mirrorFounderDirectoryCompanyImages(
  options: { limit?: number } = {},
): Promise<{
  processed: number;
  updated: number;
  failed: number;
}> {
  if (!isDatabaseConfigured()) {
    return { processed: 0, updated: 0, failed: 0 };
  }

  const safeLimit =
    typeof options.limit === "number" && Number.isFinite(options.limit) && options.limit > 0
      ? Math.min(Math.floor(options.limit), 5000)
      : 2000;

  const rows = await prisma.founderDirectoryEntry.findMany({
    where: {
      avatarUrl: {
        not: null,
      },
    },
    select: {
      id: true,
      avatarUrl: true,
    },
    take: safeLimit,
    orderBy: {
      updatedAt: "desc",
    },
  });

  const mirroredByUrl = new Map<string, string>();
  let processed = 0;
  let updated = 0;
  let failed = 0;

  for (const row of rows) {
    const rawUrl = row.avatarUrl?.trim();
    if (!rawUrl) {
      continue;
    }
    processed += 1;

    let mirrored = mirroredByUrl.get(rawUrl);
    if (!mirrored) {
      try {
        mirrored = await mirrorRemoteImageUrlToSupabase(rawUrl, {
          folder: "companies/logos",
        });
        mirroredByUrl.set(rawUrl, mirrored);
      } catch {
        failed += 1;
        continue;
      }
    }

    if (mirrored && mirrored !== rawUrl) {
      await prisma.founderDirectoryEntry.update({
        where: { id: row.id },
        data: { avatarUrl: mirrored },
      });
      updated += 1;
    }
  }

  return { processed, updated, failed };
}
