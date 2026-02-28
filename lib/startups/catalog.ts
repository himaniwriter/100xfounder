import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";
import { ensureJobPostingsSchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured } from "@/lib/db-config";
import { slugifySegment } from "@/lib/founders/hubs";
import {
  getFounderDirectory,
  getFounderDirectoryLastUpdatedAt,
} from "@/lib/founders/store";
import type { FounderDirectoryItem, FundingRound } from "@/lib/founders/types";
import { prisma } from "@/lib/prisma";

export type StartupTaxonomyDimension =
  | "industry"
  | "location"
  | "funding_round"
  | "investor";

export type StartupTaxonomyOption = {
  slug: string;
  label: string;
  count: number;
};

type StartupHubOverview = {
  totalStartups: number;
  updatedAt: string;
  industries: StartupTaxonomyOption[];
  locations: StartupTaxonomyOption[];
  fundingRounds: StartupTaxonomyOption[];
  investors: StartupTaxonomyOption[];
};

export type StartupListContext = {
  dimension: StartupTaxonomyDimension;
  slug: string;
  label: string;
  description: string;
  items: FounderDirectoryItem[];
  totalCount: number;
  page: number;
  totalPages: number;
  shouldIndex: boolean;
};

export type JobFacetDimension = "location" | "role" | "title" | "market";

export type JobPostingRecord = {
  id: string;
  title: string;
  slug: string;
  companyName: string;
  companyWebsite: string | null;
  location: string | null;
  country: string | null;
  jobType: string | null;
  workMode: string | null;
  experienceLevel: string | null;
  salaryRange: string | null;
  currency: string | null;
  description: string;
  requirements: string | null;
  applyUrl: string;
  applicationEmail: string | null;
  industry: string | null;
  source: string;
  externalSubmissionId: string | null;
  status: "draft" | "published" | "rejected";
  postedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobFacetOption = {
  slug: string;
  label: string;
  count: number;
};

export type JobFacetContext = {
  dimension: JobFacetDimension;
  slug: string;
  label: string;
  jobs: JobPostingRecord[];
  totalCount: number;
  page: number;
  totalPages: number;
  shouldIndex: boolean;
};

type JobPostingRow = {
  id: string;
  title: string;
  slug: string;
  company_name: string;
  company_website: string | null;
  location: string | null;
  country: string | null;
  job_type: string | null;
  work_mode: string | null;
  experience_level: string | null;
  salary_range: string | null;
  currency: string | null;
  description: string;
  requirements: string | null;
  apply_url: string;
  application_email: string | null;
  industry: string | null;
  source: string | null;
  external_submission_id: string | null;
  status: string | null;
  posted_at: Date | string | null;
  expires_at: Date | string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

type StartupDimensionInput = "industry" | "location" | "funding-round" | "investor";

const STARTUP_PAGE_SIZE = 50;
const JOBS_PAGE_SIZE = 25;
export const STARTUP_INDEX_THRESHOLD = 15;
export const JOB_INDEX_THRESHOLD = 15;
export const STARTUP_STATIC_PARAMS_CAP = 5000;

const LOCATION_RULES: Array<{ slug: string; label: string; terms: string[] }> = [
  {
    slug: "san-francisco-bay-area",
    label: "San Francisco Bay Area",
    terms: ["san francisco", "sf bay", "bay area", "silicon valley"],
  },
  { slug: "new-york", label: "New York", terms: ["new york", "nyc", "brooklyn", "manhattan"] },
  { slug: "boston", label: "Boston", terms: ["boston"] },
  { slug: "seattle", label: "Seattle", terms: ["seattle"] },
  { slug: "los-angeles", label: "Los Angeles", terms: ["los angeles", "la"] },
  { slug: "austin", label: "Austin", terms: ["austin"] },
  { slug: "atlanta", label: "Atlanta", terms: ["atlanta"] },
  { slug: "chicago", label: "Chicago", terms: ["chicago"] },
  { slug: "san-diego", label: "San Diego", terms: ["san diego"] },
  { slug: "washington", label: "Washington", terms: ["washington", "dc"] },
  { slug: "dallas", label: "Dallas", terms: ["dallas"] },
  { slug: "miami", label: "Miami", terms: ["miami"] },
  { slug: "philadelphia", label: "Philadelphia", terms: ["philadelphia"] },
  { slug: "india", label: "India", terms: ["india", "bengaluru", "bangalore", "gurgaon", "mumbai", "delhi"] },
  { slug: "usa", label: "United States", terms: ["united states", "usa", "us"] },
];

const LOCATION_ALIASES: Record<string, string> = {
  "san-francisco": "san-francisco-bay-area",
  "washington-dc": "washington",
};

const ROUND_ALIASES: Record<string, string> = {
  "pre-seed": "pre-seed",
  preseed: "pre-seed",
  seed: "seed",
  "series-a": "series-a",
  "series-b": "series-b",
  "series-c": "series-c",
  "series-d": "series-d",
  "series-e": "series-e",
  "series-f": "series-f",
  "series-g": "series-g",
};

const INVESTOR_ALIASES: Record<string, string> = {
  yc: "y-combinator",
  "y-combinator": "y-combinator",
  "y combinator": "y-combinator",
};

const SEEDED_INDUSTRY_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "artificial-intelligence", label: "Artificial Intelligence" },
  { slug: "fintech", label: "FinTech" },
  { slug: "cybersecurity", label: "Cybersecurity" },
  { slug: "saas", label: "SaaS" },
  { slug: "gaming", label: "Gaming" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "biotech", label: "Biotech" },
  { slug: "edtech", label: "EdTech" },
  { slug: "enterprise-software", label: "Enterprise Software" },
  { slug: "e-commerce", label: "E-Commerce" },
];

const SEEDED_LOCATION_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "remote", label: "Remote" },
  { slug: "usa", label: "United States" },
  { slug: "india", label: "India" },
  { slug: "canada", label: "Canada" },
  { slug: "london", label: "London" },
  { slug: "san-francisco-bay-area", label: "San Francisco Bay Area" },
  { slug: "boston", label: "Boston" },
  { slug: "seattle", label: "Seattle" },
  { slug: "new-york", label: "New York" },
  { slug: "los-angeles", label: "Los Angeles" },
  { slug: "austin", label: "Austin" },
  { slug: "atlanta", label: "Atlanta" },
  { slug: "chicago", label: "Chicago" },
  { slug: "san-diego", label: "San Diego" },
  { slug: "washington", label: "Washington" },
  { slug: "dallas", label: "Dallas" },
  { slug: "miami", label: "Miami" },
  { slug: "philadelphia", label: "Philadelphia" },
  { slug: "atlanta", label: "Atlanta" },
  { slug: "denver", label: "Denver" },
  { slug: "houston", label: "Houston" },
];

const SEEDED_ROUND_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "pre-seed", label: "Pre-Seed" },
  { slug: "seed", label: "Seed" },
  { slug: "series-a", label: "Series A" },
  { slug: "series-b", label: "Series B" },
  { slug: "series-c", label: "Series C" },
  { slug: "series-d", label: "Series D" },
  { slug: "series-e", label: "Series E" },
];

const SEEDED_INVESTOR_OPTIONS: Array<{ slug: string; label: string }> = [
  { slug: "y-combinator", label: "Y Combinator" },
];

const SEEDED_JOB_LOCATION_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "new-york", label: "New York" },
  { slug: "san-francisco-bay-area", label: "San Francisco Bay Area" },
  { slug: "boston", label: "Boston" },
  { slug: "seattle", label: "Seattle" },
  { slug: "los-angeles", label: "Los Angeles" },
  { slug: "austin", label: "Austin" },
  { slug: "atlanta", label: "Atlanta" },
  { slug: "chicago", label: "Chicago" },
  { slug: "san-diego", label: "San Diego" },
  { slug: "washington", label: "Washington" },
  { slug: "remote", label: "Remote" },
];

const SEEDED_JOB_ROLE_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "engineering", label: "Engineering" },
  { slug: "product", label: "Product" },
  { slug: "sales", label: "Sales" },
  { slug: "marketing", label: "Marketing" },
  { slug: "design", label: "Design" },
  { slug: "operations", label: "Operations" },
  { slug: "leadership", label: "Leadership" },
  { slug: "finance", label: "Finance" },
  { slug: "people", label: "People" },
];

const SEEDED_JOB_MARKET_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "artificial-intelligence", label: "Artificial Intelligence" },
  { slug: "fintech", label: "FinTech" },
  { slug: "cybersecurity", label: "Cybersecurity" },
  { slug: "saas", label: "SaaS" },
  { slug: "gaming", label: "Gaming" },
  { slug: "healthcare", label: "Healthcare" },
  { slug: "biotech", label: "Biotech" },
  { slug: "edtech", label: "EdTech" },
  { slug: "enterprise-software", label: "Enterprise Software" },
  { slug: "e-commerce", label: "E-Commerce" },
];

const SEEDED_JOB_TITLE_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "software-engineer", label: "Software Engineer" },
  { slug: "founding-engineer", label: "Founding Engineer" },
  { slug: "product-manager", label: "Product Manager" },
  { slug: "data-scientist", label: "Data Scientist" },
  { slug: "account-executive", label: "Account Executive" },
];

function normalizeText(value: string | null | undefined): string {
  return (value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function titleCase(value: string): string {
  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function parsePage(page: number | undefined): number {
  if (!page || Number.isNaN(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

function dedupeCompanies(items: FounderDirectoryItem[]): FounderDirectoryItem[] {
  const byCompany = new Map<string, FounderDirectoryItem>();
  items.forEach((item) => {
    if (!byCompany.has(item.companySlug)) {
      byCompany.set(item.companySlug, item);
    }
  });
  return Array.from(byCompany.values());
}

function collectFundingRoundsFromText(text: string): string[] {
  const matches = text.match(/pre[- ]seed|seed|series\s*[a-z]|growth|strategic|post-ipo|ipo/gi) || [];
  return matches
    .map((match) => match.toLowerCase().replace(/\s+/g, " ").trim())
    .map((value) => {
      if (value.startsWith("series ")) {
        const suffix = value.replace("series ", "").toUpperCase();
        return `Series ${suffix}`;
      }
      if (value === "pre seed") return "Pre-Seed";
      if (value === "post ipo") return "Post-IPO";
      return titleCase(value);
    });
}

function collectInvestorFallback(text: string): string[] {
  const result: string[] = [];
  const normalized = text.replace(/\s+/g, " ");
  const leadMatch = normalized.match(/(?:led by|backed by|from|investors?:)\s*([^.;]+)/i);

  if (!leadMatch || !leadMatch[1]) {
    return result;
  }

  leadMatch[1]
    .split(/,| and /i)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .forEach((item) => {
      result.push(item);
    });

  return result;
}

function normalizeRoundLabel(value: string): string {
  const normalized = value.toLowerCase().replace(/\s+/g, " ").trim();
  if (normalized.startsWith("series ")) {
    return `Series ${normalized.replace("series ", "").toUpperCase()}`;
  }
  if (normalized === "pre seed") {
    return "Pre-Seed";
  }
  if (normalized === "post ipo") {
    return "Post-IPO";
  }
  return titleCase(normalized);
}

function normalizeInvestorLabel(value: string): string {
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (/^yc$/i.test(trimmed)) {
    return "Y Combinator";
  }
  if (/^y\s*combinator$/i.test(trimmed)) {
    return "Y Combinator";
  }
  return trimmed;
}

function extractRounds(item: FounderDirectoryItem): string[] {
  const rounds = new Set<string>();

  (item.allRounds || []).forEach((round: FundingRound) => {
    if (round.round) {
      rounds.add(normalizeRoundLabel(round.round));
    }
  });

  if (item.lastRound?.round) {
    rounds.add(normalizeRoundLabel(item.lastRound.round));
  }

  collectFundingRoundsFromText(item.fundingInfo || "").forEach((round) => {
    rounds.add(normalizeRoundLabel(round));
  });

  return Array.from(rounds);
}

function extractInvestors(item: FounderDirectoryItem): string[] {
  const investors = new Set<string>();

  (item.allRounds || []).forEach((round: FundingRound) => {
    (round.investors || []).forEach((investor) => {
      const label = normalizeInvestorLabel(investor);
      if (label) {
        investors.add(label);
      }
    });
  });

  collectInvestorFallback(item.fundingInfo || "").forEach((investor) => {
    const label = normalizeInvestorLabel(investor);
    if (label) {
      investors.add(label);
    }
  });

  return Array.from(investors);
}

function resolveLocationFromFounder(item: FounderDirectoryItem): {
  slug: string;
  label: string;
} {
  const source = normalizeText(`${item.headquarters || ""} ${item.country || ""}`);

  const rule = LOCATION_RULES.find((entry) =>
    entry.terms.some((term) => source.includes(normalizeText(term))),
  );

  if (rule) {
    return { slug: rule.slug, label: rule.label };
  }

  const locationSource = item.headquarters || item.country || "Unknown";
  const firstSegment = locationSource.split(",")[0]?.trim() || "Unknown";
  const label = titleCase(firstSegment);
  return {
    slug: slugifySegment(label),
    label,
  };
}

function mapDimensionFromInput(input: StartupDimensionInput): StartupTaxonomyDimension {
  if (input === "funding-round") {
    return "funding_round";
  }
  return input;
}

function dimensionToPath(input: StartupDimensionInput): string {
  return input;
}

function buildDescription(dimension: StartupTaxonomyDimension, label: string): string {
  if (dimension === "industry") {
    return `Top ${label} startups with founder, funding, and hiring intelligence.`;
  }
  if (dimension === "location") {
    return `Top startups in ${label} with funding rounds, founders, and hiring signals.`;
  }
  if (dimension === "funding_round") {
    return `Startups that raised ${label}, ranked by high-signal company momentum.`;
  }
  return `Top startups backed by ${label} with structured founder and funding coverage.`;
}

async function getFounderBase(): Promise<FounderDirectoryItem[]> {
  return getFounderDirectory({ perCountryLimit: 500, limit: 5000 });
}

const getCachedFounderBase = unstable_cache(
  getFounderBase,
  ["startups-founder-base-v1"],
  { revalidate: 900 },
);

function collectStartupOptions(founders: FounderDirectoryItem[]) {
  const industry = new Map<string, { label: string; companySlugs: Set<string> }>();
  const location = new Map<string, { label: string; companySlugs: Set<string> }>();
  const fundingRound = new Map<string, { label: string; companySlugs: Set<string> }>();
  const investor = new Map<string, { label: string; companySlugs: Set<string> }>();

  founders.forEach((item) => {
    const industrySlug = slugifySegment(item.industry);
    if (industrySlug) {
      const current = industry.get(industrySlug) || {
        label: item.industry,
        companySlugs: new Set<string>(),
      };
      current.companySlugs.add(item.companySlug);
      industry.set(industrySlug, current);
    }

    const locationResolved = resolveLocationFromFounder(item);
    if (locationResolved.slug) {
      const current = location.get(locationResolved.slug) || {
        label: locationResolved.label,
        companySlugs: new Set<string>(),
      };
      current.companySlugs.add(item.companySlug);
      location.set(locationResolved.slug, current);
    }

    extractRounds(item).forEach((round) => {
      const slug = slugifySegment(round);
      if (!slug) {
        return;
      }
      const current = fundingRound.get(slug) || {
        label: round,
        companySlugs: new Set<string>(),
      };
      current.companySlugs.add(item.companySlug);
      fundingRound.set(slug, current);
    });

    extractInvestors(item).forEach((investorLabel) => {
      const slug = slugifySegment(investorLabel);
      if (!slug) {
        return;
      }
      const current = investor.get(slug) || {
        label: investorLabel,
        companySlugs: new Set<string>(),
      };
      current.companySlugs.add(item.companySlug);
      investor.set(slug, current);
    });
  });

  return {
    industry,
    location,
    fundingRound,
    investor,
  };
}

function mapToSortedOptions(
  source: Map<string, { label: string; companySlugs: Set<string> }>,
): StartupTaxonomyOption[] {
  return Array.from(source.entries())
    .map(([slug, value]) => ({
      slug,
      label: value.label,
      count: value.companySlugs.size,
    }))
    .filter((item) => item.slug.length > 0)
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)));
}

function mergeSeededStartupOptions(
  options: StartupTaxonomyOption[],
  seeded: Array<{ slug: string; label: string }>,
): StartupTaxonomyOption[] {
  const merged = new Map<string, StartupTaxonomyOption>();
  options.forEach((option) => {
    merged.set(option.slug, option);
  });

  seeded.forEach((seed) => {
    if (!merged.has(seed.slug)) {
      merged.set(seed.slug, {
        slug: seed.slug,
        label: seed.label,
        count: 0,
      });
    }
  });

  return Array.from(merged.values()).sort((a, b) =>
    b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label),
  );
}

function applyStartupPagination(items: FounderDirectoryItem[], page: number) {
  const totalCount = items.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / STARTUP_PAGE_SIZE));
  const currentPage = Math.min(parsePage(page), totalPages);
  const offset = (currentPage - 1) * STARTUP_PAGE_SIZE;
  return {
    totalCount,
    totalPages,
    page: currentPage,
    items: items.slice(offset, offset + STARTUP_PAGE_SIZE),
  };
}

function normalizeLocationSlug(slug: string): string {
  const normalized = slugifySegment(slug);
  return LOCATION_ALIASES[normalized] || normalized;
}

function normalizeRoundSlug(slug: string): string {
  const normalized = slugifySegment(slug);
  return ROUND_ALIASES[normalized] || normalized;
}

function normalizeInvestorSlug(slug: string): string {
  const normalized = slugifySegment(slug);
  return INVESTOR_ALIASES[normalized] || normalized;
}

async function loadStartupHubOverview(): Promise<StartupHubOverview> {
  const founders = await getCachedFounderBase();
  const options = collectStartupOptions(founders);
  const lastUpdatedAt = await getFounderDirectoryLastUpdatedAt();

  return {
    totalStartups: dedupeCompanies(founders).length,
    updatedAt: lastUpdatedAt.toISOString(),
    industries: mapToSortedOptions(options.industry).slice(0, 20),
    locations: mapToSortedOptions(options.location).slice(0, 20),
    fundingRounds: mapToSortedOptions(options.fundingRound).slice(0, 20),
    investors: mapToSortedOptions(options.investor).slice(0, 20),
  };
}

const getCachedStartupHubOverview = unstable_cache(
  loadStartupHubOverview,
  ["startups-hub-overview-v1"],
  { revalidate: 900 },
);

export async function getStartupHubOverview(): Promise<StartupHubOverview> {
  return getCachedStartupHubOverview();
}

export async function getStartupDirectoryDataset(): Promise<{
  founders: FounderDirectoryItem[];
  overview: StartupHubOverview;
}> {
  const [founders, overview] = await Promise.all([
    getCachedFounderBase(),
    getCachedStartupHubOverview(),
  ]);

  return { founders, overview };
}

export async function getStartupTaxonomyOptions(
  dimensionInput: StartupDimensionInput,
): Promise<StartupTaxonomyOption[]> {
  const founders = await getCachedFounderBase();
  const options = collectStartupOptions(founders);

  if (dimensionInput === "industry") {
    return mergeSeededStartupOptions(
      mapToSortedOptions(options.industry),
      SEEDED_INDUSTRY_OPTIONS,
    );
  }
  if (dimensionInput === "location") {
    return mergeSeededStartupOptions(
      mapToSortedOptions(options.location),
      SEEDED_LOCATION_OPTIONS,
    );
  }
  if (dimensionInput === "funding-round") {
    return mergeSeededStartupOptions(
      mapToSortedOptions(options.fundingRound),
      SEEDED_ROUND_OPTIONS,
    );
  }

  return mergeSeededStartupOptions(
    mapToSortedOptions(options.investor),
    SEEDED_INVESTOR_OPTIONS,
  );
}

export async function getStartupListContext(
  dimensionInput: StartupDimensionInput,
  rawSlug: string,
  rawPage?: number,
): Promise<StartupListContext | null> {
  const founders = await getCachedFounderBase();
  const options = collectStartupOptions(founders);
  const dimension = mapDimensionFromInput(dimensionInput);

  const normalizedSlug =
    dimensionInput === "location"
      ? normalizeLocationSlug(rawSlug)
      : dimensionInput === "funding-round"
        ? normalizeRoundSlug(rawSlug)
        : dimensionInput === "investor"
          ? normalizeInvestorSlug(rawSlug)
          : slugifySegment(rawSlug);

  if (!normalizedSlug) {
    return null;
  }

  const mapByDimension =
    dimensionInput === "industry"
      ? options.industry
      : dimensionInput === "location"
        ? options.location
        : dimensionInput === "funding-round"
          ? options.fundingRound
          : options.investor;

  const selected = mapByDimension.get(normalizedSlug);
  const seededSelection =
    dimensionInput === "industry"
      ? SEEDED_INDUSTRY_OPTIONS.find((item) => item.slug === normalizedSlug)
      : dimensionInput === "location"
        ? SEEDED_LOCATION_OPTIONS.find((item) => item.slug === normalizedSlug)
        : dimensionInput === "funding-round"
          ? SEEDED_ROUND_OPTIONS.find((item) => item.slug === normalizedSlug)
          : SEEDED_INVESTOR_OPTIONS.find((item) => item.slug === normalizedSlug);

  if (!selected && !seededSelection) {
    return null;
  }

  const filtered = dedupeCompanies(
    founders.filter((item) => selected?.companySlugs.has(item.companySlug)),
  );

  const paged = applyStartupPagination(filtered, rawPage ?? 1);
  const label = selected?.label || seededSelection?.label || normalizedSlug;

  return {
    dimension,
    slug: normalizedSlug,
    label,
    description: buildDescription(dimension, label),
    items: paged.items,
    totalCount: paged.totalCount,
    page: paged.page,
    totalPages: paged.totalPages,
    shouldIndex: paged.totalCount >= STARTUP_INDEX_THRESHOLD,
  };
}

function mapJobRow(row: JobPostingRow): JobPostingRecord {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    companyName: row.company_name,
    companyWebsite: row.company_website,
    location: row.location,
    country: row.country,
    jobType: row.job_type,
    workMode: row.work_mode,
    experienceLevel: row.experience_level,
    salaryRange: row.salary_range,
    currency: row.currency,
    description: row.description,
    requirements: row.requirements,
    applyUrl: row.apply_url,
    applicationEmail: row.application_email,
    industry: row.industry,
    source: row.source || "n8n_webhook",
    externalSubmissionId: row.external_submission_id,
    status:
      row.status === "published" || row.status === "rejected"
        ? row.status
        : "draft",
    postedAt: row.posted_at ? new Date(row.posted_at).toISOString() : null,
    expiresAt: row.expires_at ? new Date(row.expires_at).toISOString() : null,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function inferJobRole(title: string): string {
  const value = title.toLowerCase();
  if (/engineer|developer|sre|frontend|backend|fullstack|devops|data scientist/.test(value)) {
    return "Engineering";
  }
  if (/product manager|product lead|pm\b/.test(value)) {
    return "Product";
  }
  if (/sales|account executive|bdr|sdr|business development/.test(value)) {
    return "Sales";
  }
  if (/marketing|growth/.test(value)) {
    return "Marketing";
  }
  if (/founder|chief|vp|director|head/.test(value)) {
    return "Leadership";
  }
  if (/design|ux|ui/.test(value)) {
    return "Design";
  }
  if (/finance|accounting/.test(value)) {
    return "Finance";
  }
  if (/hr|talent|recruit/.test(value)) {
    return "People";
  }
  return "Operations";
}

function buildJobFacet(
  jobs: JobPostingRecord[],
  pickLabel: (job: JobPostingRecord) => string,
): JobFacetOption[] {
  const grouped = new Map<string, { label: string; count: number }>();

  jobs.forEach((job) => {
    const label = pickLabel(job).trim() || "Unknown";
    const slug = slugifySegment(label);
    if (!slug) {
      return;
    }

    const current = grouped.get(slug) || { label, count: 0 };
    current.count += 1;
    grouped.set(slug, current);
  });

  return Array.from(grouped.entries())
    .map(([slug, value]) => ({
      slug,
      label: value.label,
      count: value.count,
    }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)));
}

function mergeSeededJobFacets(
  facets: JobFacetOption[],
  seeded: Array<{ slug: string; label: string }>,
): JobFacetOption[] {
  const merged = new Map<string, JobFacetOption>();
  facets.forEach((facet) => {
    merged.set(facet.slug, facet);
  });

  seeded.forEach((seed) => {
    if (!merged.has(seed.slug)) {
      merged.set(seed.slug, {
        slug: seed.slug,
        label: seed.label,
        count: 0,
      });
    }
  });

  return Array.from(merged.values()).sort((a, b) =>
    b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label),
  );
}

function getSeededJobFacetLabel(
  dimension: JobFacetDimension,
  slug: string,
): string | null {
  const seeded =
    dimension === "location"
      ? SEEDED_JOB_LOCATION_FACETS
      : dimension === "role"
        ? SEEDED_JOB_ROLE_FACETS
        : dimension === "title"
          ? SEEDED_JOB_TITLE_FACETS
          : SEEDED_JOB_MARKET_FACETS;

  return seeded.find((item) => item.slug === slug)?.label ?? null;
}

export async function getPublishedJobs(): Promise<JobPostingRecord[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await ensureJobPostingsSchema();

    const rows = await prisma.$queryRaw<JobPostingRow[]>(
      Prisma.sql`
        SELECT
          id,
          title,
          slug,
          company_name,
          company_website,
          location,
          country,
          job_type,
          work_mode,
          experience_level,
          salary_range,
          currency,
          description,
          requirements,
          apply_url,
          application_email,
          industry,
          source,
          external_submission_id,
          status,
          posted_at,
          expires_at,
          created_at,
          updated_at
        FROM public.job_postings
        WHERE status = 'published'
        ORDER BY COALESCE(posted_at, created_at) DESC, updated_at DESC
        LIMIT 5000
      `,
    );

    return rows.map(mapJobRow);
  } catch {
    return [];
  }
}

export async function getJobsOverview() {
  const jobs = await getPublishedJobs();

  const byLocation = mergeSeededJobFacets(
    buildJobFacet(jobs, (job) => job.location || job.country || "Remote"),
    SEEDED_JOB_LOCATION_FACETS,
  );
  const byRole = mergeSeededJobFacets(
    buildJobFacet(jobs, (job) => inferJobRole(job.title)),
    SEEDED_JOB_ROLE_FACETS,
  );
  const byTitle = mergeSeededJobFacets(
    buildJobFacet(jobs, (job) => job.title),
    SEEDED_JOB_TITLE_FACETS,
  );
  const byMarket = mergeSeededJobFacets(
    buildJobFacet(jobs, (job) => job.industry || "General"),
    SEEDED_JOB_MARKET_FACETS,
  );

  return {
    jobs,
    totalCount: jobs.length,
    byLocation,
    byRole,
    byTitle,
    byMarket,
    updatedAt: jobs[0]?.updatedAt ?? null,
  };
}

function getJobFacetLabel(
  jobs: JobPostingRecord[],
  dimension: JobFacetDimension,
  slug: string,
): string | null {
  const facets =
    dimension === "location"
      ? buildJobFacet(jobs, (job) => job.location || job.country || "Remote")
      : dimension === "role"
        ? buildJobFacet(jobs, (job) => inferJobRole(job.title))
        : dimension === "title"
          ? buildJobFacet(jobs, (job) => job.title)
          : buildJobFacet(jobs, (job) => job.industry || "General");

  const match = facets.find((item) => item.slug === slug);
  return match?.label ?? getSeededJobFacetLabel(dimension, slug);
}

export async function getJobsFacetContext(
  dimension: JobFacetDimension,
  rawSlug: string,
  rawPage?: number,
): Promise<JobFacetContext | null> {
  const jobs = await getPublishedJobs();
  const slug = slugifySegment(rawSlug);

  if (!slug) {
    return null;
  }

  const label = getJobFacetLabel(jobs, dimension, slug);
  if (!label) {
    return null;
  }

  const filtered = jobs.filter((job) => {
    if (dimension === "location") {
      return slugifySegment(job.location || job.country || "Remote") === slug;
    }

    if (dimension === "role") {
      return slugifySegment(inferJobRole(job.title)) === slug;
    }

    if (dimension === "title") {
      return slugifySegment(job.title) === slug;
    }

    return slugifySegment(job.industry || "General") === slug;
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / JOBS_PAGE_SIZE));
  const page = Math.min(parsePage(rawPage), totalPages);
  const start = (page - 1) * JOBS_PAGE_SIZE;
  const pageItems = filtered.slice(start, start + JOBS_PAGE_SIZE);

  return {
    dimension,
    slug,
    label,
    jobs: pageItems,
    totalCount,
    page,
    totalPages,
    shouldIndex: totalCount >= JOB_INDEX_THRESHOLD,
  };
}

function withPreservedQuery(path: string, source: URLSearchParams): string {
  const next = new URLSearchParams();
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "source"].forEach(
    (key) => {
      const value = source.get(key);
      if (value) {
        next.set(key, value);
      }
    },
  );

  const queryString = next.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export function mapSourceDirectoryQueryToPath(searchParams: URLSearchParams): string | null {
  const industries = searchParams.get("industries");
  const hqLocation = searchParams.get("hq_location");
  const fundingRound = searchParams.get("funding_round");
  const investors = searchParams.get("investors");

  const active = [industries, hqLocation, fundingRound, investors].filter(Boolean);
  if (active.length !== 1) {
    return null;
  }

  if (industries) {
    return withPreservedQuery(`/startups/industry/${slugifySegment(industries)}`, searchParams);
  }
  if (hqLocation) {
    return withPreservedQuery(
      `/startups/location/${normalizeLocationSlug(hqLocation)}`,
      searchParams,
    );
  }
  if (fundingRound) {
    return withPreservedQuery(
      `/startups/funding-round/${normalizeRoundSlug(fundingRound)}`,
      searchParams,
    );
  }
  if (investors) {
    return withPreservedQuery(`/startups/investor/${normalizeInvestorSlug(investors)}`, searchParams);
  }

  return null;
}

export function mapSourceJobsQueryToPath(searchParams: URLSearchParams): string | null {
  const jobLocation = searchParams.get("job_location");
  const role = searchParams.get("role");
  const title = searchParams.get("title");
  const market = searchParams.get("startup__markets");

  const active = [jobLocation, role, title, market].filter(Boolean);
  if (active.length !== 1) {
    return null;
  }

  if (jobLocation) {
    return withPreservedQuery(`/startups/jobs/location/${slugifySegment(jobLocation)}`, searchParams);
  }
  if (role) {
    return withPreservedQuery(`/startups/jobs/role/${slugifySegment(role)}`, searchParams);
  }
  if (title) {
    return withPreservedQuery(`/startups/jobs/title/${slugifySegment(title)}`, searchParams);
  }
  if (market) {
    return withPreservedQuery(`/startups/jobs/market/${slugifySegment(market)}`, searchParams);
  }

  return null;
}

export function getStartupDimensionPath(dimension: StartupDimensionInput): string {
  return `/startups/${dimensionToPath(dimension)}`;
}
