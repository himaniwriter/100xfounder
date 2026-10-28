const FETCH_TIMEOUT_MS = 8_000;
const MAX_HTML_BYTES = 600_000;
const CONTACT_PATHS = ["", "/contact", "/about", "/team"];
const USER_AGENT = "Mozilla/5.0 (compatible; 100xFounderBot/1.0; +https://100xfounder.com/about)";

const EMAIL_PATTERN = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const IGNORED_EMAIL_PATTERNS = [
  /^no-?reply@/i,
  /^donotreply@/i,
  /@(example|domain|email|yourdomain|sentry|wixpress|sentry-next)\./i,
  /\.(png|jpe?g|gif|svg|webp|css|js)$/i,
  /^(privacy|legal|abuse|security|dmca|gdpr|billing|invoices?|careers|jobs|press)@/i,
];
const ROLE_PRIORITY: Array<[RegExp, number]> = [
  [/^(founders?|ceo|cofounder|co-founder)@/i, 0],
  [/^(hello|hi|hey|team)@/i, 2],
  [/^(contact|info|partnerships?|marketing|growth)@/i, 3],
  [/^(support|help|sales)@/i, 4],
];

export type DiscoveredContact = {
  email: string;
  discoveredFrom: string;
  twitterUrl: string | null;
  linkedinUrl: string | null;
};

async function fetchWithTimeout(url: string): Promise<Response | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      cache: "no-store",
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

function stripTrackingParams(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || key === "ref") {
        url.searchParams.delete(key);
      }
    }
    url.hash = "";
    return url.toString().replace(/\?$/, "");
  } catch {
    return rawUrl;
  }
}

/**
 * Product Hunt's `website` field is a producthunt.com redirect. Follow it to the
 * maker's real site so listings link directly and contact discovery has a domain.
 */
export async function resolveWebsiteUrl(website: string | null): Promise<string | null> {
  if (!website) {
    return null;
  }
  const response = await fetchWithTimeout(website);
  const finalUrl = response?.url || website;
  try {
    if (/producthunt\.com$/i.test(new URL(finalUrl).hostname)) {
      return null;
    }
  } catch {
    return null;
  }
  return stripTrackingParams(finalUrl);
}

function registrableDomain(hostname: string): string {
  const parts = hostname.replace(/^www\./i, "").toLowerCase().split(".");
  return parts.slice(-2).join(".");
}

function scoreEmail(email: string, siteDomain: string): number {
  const domain = email.split("@")[1]?.toLowerCase() || "";
  let score = 1;
  for (const [pattern, value] of ROLE_PRIORITY) {
    if (pattern.test(email)) {
      score = value;
      break;
    }
  }
  // Prefer addresses on the product's own domain.
  return registrableDomain(domain) === siteDomain ? score : score + 10;
}

function extractSocial(html: string, pattern: RegExp): string | null {
  const match = html.match(pattern);
  return match ? match[0].replace(/["'].*$/, "") : null;
}

async function readHtml(response: Response): Promise<string> {
  const text = await response.text();
  return text.slice(0, MAX_HTML_BYTES);
}

/**
 * Looks for a published contact email and social profiles on the product's own
 * website. Only addresses the company publishes on its site are used.
 */
export async function discoverContact(websiteUrl: string): Promise<DiscoveredContact | null> {
  let base: URL;
  try {
    base = new URL(websiteUrl);
  } catch {
    return null;
  }
  const siteDomain = registrableDomain(base.hostname);
  const candidates = new Map<string, string>();
  let twitterUrl: string | null = null;
  let linkedinUrl: string | null = null;

  for (const path of CONTACT_PATHS) {
    const pageUrl = new URL(path || "/", base.origin).toString();
    const response = await fetchWithTimeout(pageUrl);
    if (!response?.ok || !(response.headers.get("content-type") || "").includes("text/html")) {
      continue;
    }
    const html = await readHtml(response);

    for (const match of html.matchAll(/mailto:([^"'?>\s]+)/gi)) {
      const email = decodeURIComponent(match[1]).toLowerCase();
      if (!candidates.has(email)) candidates.set(email, pageUrl);
    }
    for (const match of html.match(EMAIL_PATTERN) || []) {
      const email = match.toLowerCase();
      // Bare-text emails are only trusted on the product's own domain.
      if (registrableDomain(email.split("@")[1] || "") === siteDomain && !candidates.has(email)) {
        candidates.set(email, pageUrl);
      }
    }

    twitterUrl ||= extractSocial(html, /https?:\/\/(?:www\.)?(?:twitter|x)\.com\/(?!intent|share|home)[A-Za-z0-9_]{1,15}/i);
    linkedinUrl ||= extractSocial(html, /https?:\/\/(?:[a-z]{2,3}\.)?linkedin\.com\/(?:company|in)\/[A-Za-z0-9_-]+/i);
  }

  const ranked = [...candidates.entries()]
    .filter(([email]) => !IGNORED_EMAIL_PATTERNS.some((pattern) => pattern.test(email)))
    .sort(([a], [b]) => scoreEmail(a, siteDomain) - scoreEmail(b, siteDomain));

  if (ranked.length === 0) {
    return null;
  }

  const [email, discoveredFrom] = ranked[0];
  return { email, discoveredFrom, twitterUrl, linkedinUrl };
}
