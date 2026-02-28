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

export const THIN_NOINDEX_PAGE_SLUGS = new Set<string>();

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
  const shouldIndex = true;
  const canonicalPath = buildCanonicalPath(basePath, query);

  return {
    shouldIndex,
    canonicalPath,
    robots: undefined,
  };
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
