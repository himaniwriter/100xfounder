import { Prisma } from "@prisma/client";
import { ensureSalaryEquitySchema } from "@/lib/db-bootstrap";
import { isDatabaseConfigured } from "@/lib/db-config";
import { slugifySegment } from "@/lib/founders/hubs";
import { prisma } from "@/lib/prisma";

export type SalaryEquityEntry = {
  id: string;
  role: string;
  level: string | null;
  location: string | null;
  country: string | null;
  stage: string | null;
  baseMin: number | null;
  baseMax: number | null;
  currency: string;
  equityMinBps: number | null;
  equityMaxBps: number | null;
  source: string;
  sourceUrl: string | null;
  externalSubmissionId: string | null;
  status: "draft" | "published" | "rejected";
  createdAt: string;
  updatedAt: string;
};

export type SalaryEquityFacet = {
  slug: string;
  label: string;
  count: number;
};

export type SalaryFacetDimension = "location" | "role" | "stage";

export type SalaryFacetContext = {
  dimension: SalaryFacetDimension;
  slug: string;
  label: string;
  entries: SalaryEquityEntry[];
  totalCount: number;
  page: number;
  totalPages: number;
  shouldIndex: boolean;
};

type SalaryEquityRow = {
  id: string;
  role: string;
  level: string | null;
  location: string | null;
  country: string | null;
  stage: string | null;
  base_min: number | null;
  base_max: number | null;
  currency: string | null;
  equity_min_bps: number | null;
  equity_max_bps: number | null;
  source: string | null;
  source_url: string | null;
  external_submission_id: string | null;
  status: string | null;
  created_at: Date | string;
  updated_at: Date | string;
};

const PER_PAGE = 30;
const INDEX_THRESHOLD = 0;

const SEEDED_SALARY_LOCATION_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "new-york", label: "New York" },
  { slug: "san-francisco", label: "San Francisco" },
  { slug: "boston", label: "Boston" },
  { slug: "seattle", label: "Seattle" },
  { slug: "los-angeles", label: "Los Angeles" },
  { slug: "austin", label: "Austin" },
  { slug: "atlanta", label: "Atlanta" },
  { slug: "chicago", label: "Chicago" },
  { slug: "san-diego", label: "San Diego" },
  { slug: "washington", label: "Washington" },
];

const SEEDED_SALARY_ROLE_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "software-engineer", label: "Software Engineer" },
  { slug: "product-manager", label: "Product Manager" },
  { slug: "designer", label: "Designer" },
  { slug: "data-scientist", label: "Data Scientist" },
  { slug: "account-executive", label: "Account Executive" },
  { slug: "founder", label: "Founder" },
];

const SEEDED_SALARY_STAGE_FACETS: Array<{ slug: string; label: string }> = [
  { slug: "pre-seed", label: "Pre-Seed" },
  { slug: "seed", label: "Seed" },
  { slug: "series-a", label: "Series A" },
  { slug: "series-b", label: "Series B" },
  { slug: "series-c", label: "Series C" },
  { slug: "series-d", label: "Series D" },
  { slug: "series-e", label: "Series E" },
];

function mapRow(row: SalaryEquityRow): SalaryEquityEntry {
  return {
    id: row.id,
    role: row.role,
    level: row.level,
    location: row.location,
    country: row.country,
    stage: row.stage,
    baseMin: row.base_min,
    baseMax: row.base_max,
    currency: row.currency || "USD",
    equityMinBps: row.equity_min_bps,
    equityMaxBps: row.equity_max_bps,
    source: row.source || "n8n_webhook",
    sourceUrl: row.source_url,
    externalSubmissionId: row.external_submission_id,
    status:
      row.status === "published" || row.status === "rejected"
        ? row.status
        : "draft",
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

function parsePage(value: number | undefined): number {
  if (!value || Number.isNaN(value) || value < 1) {
    return 1;
  }

  return Math.floor(value);
}

function normalizeText(value: string | null | undefined): string {
  return value?.trim() || "Unknown";
}

function collectFacet(
  entries: SalaryEquityEntry[],
  pick: (entry: SalaryEquityEntry) => string,
): SalaryEquityFacet[] {
  const grouped = new Map<string, { label: string; count: number }>();

  entries.forEach((entry) => {
    const label = normalizeText(pick(entry));
    const slug = slugifySegment(label);
    if (!slug) {
      return;
    }

    const current = grouped.get(slug) ?? { label, count: 0 };
    current.count += 1;
    grouped.set(slug, current);
  });

  return Array.from(grouped.entries())
    .map(([slug, value]) => ({ slug, label: value.label, count: value.count }))
    .sort((a, b) => (b.count !== a.count ? b.count - a.count : a.label.localeCompare(b.label)));
}

function mergeSeededSalaryFacets(
  facets: SalaryEquityFacet[],
  seeded: Array<{ slug: string; label: string }>,
): SalaryEquityFacet[] {
  const merged = new Map<string, SalaryEquityFacet>();
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

function getSeededSalaryFacetLabel(
  dimension: SalaryFacetDimension,
  slug: string,
): string | null {
  const seeded =
    dimension === "location"
      ? SEEDED_SALARY_LOCATION_FACETS
      : dimension === "role"
        ? SEEDED_SALARY_ROLE_FACETS
        : SEEDED_SALARY_STAGE_FACETS;

  return seeded.find((item) => item.slug === slug)?.label ?? null;
}

function resolveFacetLabel(
  entries: SalaryEquityEntry[],
  dimension: SalaryFacetDimension,
  slug: string,
): string | null {
  const facets =
    dimension === "location"
      ? collectFacet(entries, (item) => item.location || item.country || "Unknown")
      : dimension === "role"
        ? collectFacet(entries, (item) => item.role)
        : collectFacet(entries, (item) => item.stage || "Unknown");

  const match = facets.find((item) => item.slug === slug);
  return match?.label ?? getSeededSalaryFacetLabel(dimension, slug);
}

export async function getPublishedSalaryEquityEntries(): Promise<SalaryEquityEntry[]> {
  if (!isDatabaseConfigured()) {
    return [];
  }

  try {
    await ensureSalaryEquitySchema();

    const rows = await prisma.$queryRaw<SalaryEquityRow[]>(
      Prisma.sql`
        SELECT
          id,
          role,
          level,
          location,
          country,
          stage,
          base_min,
          base_max,
          currency,
          equity_min_bps,
          equity_max_bps,
          source,
          source_url,
          external_submission_id,
          status,
          created_at,
          updated_at
        FROM public.salary_equity_entries
        WHERE status = 'published'
        ORDER BY updated_at DESC, created_at DESC
        LIMIT 5000
      `,
    );

    return rows.map(mapRow);
  } catch {
    return [];
  }
}

export async function getSalaryEquityOverview() {
  const entries = await getPublishedSalaryEquityEntries();

  const byLocation = mergeSeededSalaryFacets(
    collectFacet(entries, (item) => item.location || item.country || "Unknown"),
    SEEDED_SALARY_LOCATION_FACETS,
  );
  const byRole = mergeSeededSalaryFacets(
    collectFacet(entries, (item) => item.role),
    SEEDED_SALARY_ROLE_FACETS,
  );
  const byStage = mergeSeededSalaryFacets(
    collectFacet(entries, (item) => item.stage || "Unknown"),
    SEEDED_SALARY_STAGE_FACETS,
  );

  return {
    entries,
    totalCount: entries.length,
    byLocation,
    byRole,
    byStage,
    updatedAt: entries[0]?.updatedAt ?? null,
  };
}

export async function getSalaryFacetContext(
  dimension: SalaryFacetDimension,
  rawSlug: string,
  rawPage?: number,
): Promise<SalaryFacetContext | null> {
  const entries = await getPublishedSalaryEquityEntries();
  const slug = slugifySegment(rawSlug);

  if (!slug) {
    return null;
  }

  const label = resolveFacetLabel(entries, dimension, slug);
  if (!label) {
    return null;
  }

  const filtered = entries.filter((entry) => {
    if (dimension === "location") {
      return slugifySegment(entry.location || entry.country || "Unknown") === slug;
    }

    if (dimension === "role") {
      return slugifySegment(entry.role) === slug;
    }

    return slugifySegment(entry.stage || "Unknown") === slug;
  });

  const totalCount = filtered.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PER_PAGE));
  const page = Math.min(parsePage(rawPage), totalPages);
  const start = (page - 1) * PER_PAGE;
  const pageItems = filtered.slice(start, start + PER_PAGE);

  return {
    dimension,
    slug,
    label,
    entries: pageItems,
    totalCount,
    page,
    totalPages,
    shouldIndex: totalCount >= INDEX_THRESHOLD,
  };
}
