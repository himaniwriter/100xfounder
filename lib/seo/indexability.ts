export type QueryValue = string | string[] | undefined;

export type IndexabilityDecision = {
  shouldIndex: boolean;
  canonicalPath: string;
  robots:
    | {
        index: false;
        follow: true;
      }
    | undefined;
};

export const THIN_NOINDEX_PAGE_SLUGS = new Set<string>([
  "join",
  "careers",
  "changelog",
  "add-startup-or-job",
  "negotiation-coaching",
]);

const SITEMAP_EXCLUDED_EXACT_PATHS = new Set([
  "/search",
  "/feature-now",
  "/llms.txt",
  "/rss.xml",
  "/atom.xml",
  "/news-sitemap.xml",
  "/ai-sitemap.xml",
  "/ai-sitemap-news.xml",
  "/sitemap.xml",
  "/startup-salary-equity-database",
  ...Array.from(THIN_NOINDEX_PAGE_SLUGS).map((slug) => `/${slug}`),
]);

const SITEMAP_EXCLUDED_PREFIXES = ["/api/", "/admin", "/dashboard", "/founder/"];

function slugifySegment(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function normalizeSingleQueryToken(value: string): string[] {
  if (!value.includes(",")) {
    const trimmed = value.trim();
    return trimmed ? [trimmed] : [];
  }

  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function normalizeQueryValues(value: QueryValue): string[] {
  if (!value) {
    return [];
  }

  const raw = Array.isArray(value) ? value : [value];
  const normalized = raw.flatMap((item) => normalizeSingleQueryToken(item));
  return Array.from(new Set(normalized));
}

export function isSimpleQueryState(
  query: Record<string, string[] | undefined>,
): boolean {
  const values = Object.values(query).map((entry) => entry ?? []);
  const activeDimensions = values.filter((entry) => entry.length > 0).length;
  const hasMultiValueDimension = values.some((entry) => entry.length > 1);
  return activeDimensions <= 1 && !hasMultiValueDimension;
}

export function buildCanonicalPath(
  basePath: string,
  query: Record<string, string[] | undefined>,
): string {
  const params = new URLSearchParams();
  const entries = Object.entries(query)
    .map(([key, values]) => [key, values ?? []] as const)
    .filter(([, values]) => values.length > 0)
    .sort(([left], [right]) => left.localeCompare(right));

  entries.forEach(([key, values]) => {
    values
      .slice()
      .sort((left, right) => left.localeCompare(right))
      .forEach((value) => {
        params.append(key, value);
      });
  });

  const queryString = params.toString();
  return queryString ? `${basePath}?${queryString}` : basePath;
}

export function resolveQueryIndexability(
  basePath: string,
  query: Record<string, string[] | undefined>,
): IndexabilityDecision {
  const activeEntries = Object.entries(query).filter(
    ([, values]) => (values?.length ?? 0) > 0,
  );

  if (basePath === "/search") {
    return {
      shouldIndex: false,
      canonicalPath: "/search",
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  if (basePath === "/startups") {
    if (activeEntries.length === 0) {
      return {
        shouldIndex: true,
        canonicalPath: "/startups",
        robots: undefined,
      };
    }

    const canonicalPath = mapStartupsQueryToCanonicalPath(query);
    return {
      shouldIndex: false,
      canonicalPath,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  if (basePath === "/founders" || basePath === "/blog") {
    if (activeEntries.length === 0) {
      return {
        shouldIndex: true,
        canonicalPath: basePath,
        robots: undefined,
      };
    }

    if (isSimpleQueryState(query)) {
      return {
        shouldIndex: true,
        canonicalPath: buildCanonicalPath(basePath, query),
        robots: undefined,
      };
    }

    return {
      shouldIndex: false,
      canonicalPath: basePath,
      robots: {
        index: false,
        follow: true,
      },
    };
  }

  return {
    shouldIndex: true,
    canonicalPath: buildCanonicalPath(basePath, query),
    robots: undefined,
  };
}

function mapStartupsQueryToCanonicalPath(
  query: Record<string, string[] | undefined>,
): string {
  const valueMap: Record<string, string | undefined> = {
    industry: query.industry?.[0] ?? query.industries?.[0],
    location: query.location?.[0] ?? query.hq_location?.[0],
    funding_round: query.funding_round?.[0] ?? query.stage?.[0],
    investor: query.investor?.[0] ?? query.investors?.[0],
  };

  const activeKeys = Object.entries(valueMap).filter(([, value]) => Boolean(value));
  if (activeKeys.length !== 1) {
    return "/startups";
  }

  const [key, value] = activeKeys[0];
  const slug = slugifySegment(value ?? "");
  if (!slug) {
    return "/startups";
  }

  if (key === "industry") {
    return `/startups/industry/${slug}`;
  }
  if (key === "location") {
    return `/startups/location/${slug}`;
  }
  if (key === "funding_round") {
    return `/startups/funding-round/${slug}`;
  }
  return `/startups/investor/${slug}`;
}

export function isThinNoindexPageSlug(slug: string): boolean {
  return THIN_NOINDEX_PAGE_SLUGS.has(slug.trim().toLowerCase());
}

export function isPathEligibleForSitemap(path: string): boolean {
  const normalizedPath = path.split("?")[0].trim() || "/";
  if (SITEMAP_EXCLUDED_EXACT_PATHS.has(normalizedPath)) {
    return false;
  }

  return !SITEMAP_EXCLUDED_PREFIXES.some((prefix) =>
    normalizedPath.startsWith(prefix),
  );
}
