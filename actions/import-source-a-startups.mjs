import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { URL } from "node:url";

const SOURCE_HOST = ["https://", "top", "startups.io"].join("");
const SITEMAP_URL = `${SOURCE_HOST}/sitemap.xml`;
const STARTUPS_ROOT = `${SOURCE_HOST}/`;
const USER_AGENT = "Mozilla/5.0";
const PAGE_SIZE = 18;
const CACHE_DIR = process.env.SOURCE_A_CACHE_DIR || null;
const ENABLE_QUERY_SAMPLE = process.env.SOURCE_A_SAMPLE_QUERIES === "1";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function decodeHtmlEntities(text) {
  return String(text || "")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\u00a0|&nbsp;/g, " ");
}

function stripHtml(text) {
  return decodeHtmlEntities(String(text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim());
}

function sanitizeExternalUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.search = "";
    url.hash = "";
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }
    return url.toString();
  } catch {
    return null;
  }
}

function parseSitemapUrls(xml) {
  const urls = [];
  const regex = /<loc>([^<]+)<\/loc>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    urls.push(decodeHtmlEntities(match[1]));
  }
  return urls;
}

function parseCount(html) {
  const match = html.match(/id="count_results">\s*([\d,]+)\s+startups/i);
  if (!match) return null;
  return Number(match[1].replace(/,/g, ""));
}

function parseStage(tags, fundingText) {
  const haystack = [...tags, fundingText].join(" ");
  const stageMatch = haystack.match(/(Pre[-\s]?Seed|Seed|Series\s*[A-G]|Growth|Strategic|IPO|Public|Acquired)/i);
  return stageMatch ? stageMatch[1].replace(/\s+/g, " ").trim() : "Growth";
}

function parseInvestors(fundingTags) {
  return fundingTags
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => !/(pre[-\s]?seed|seed|series\s*[a-g]|growth|strategic|ipo|public|acquired)/i.test(item));
}

function parseYearFromText(text) {
  const match = String(text || "").match(/\b(19\d{2}|20\d{2})\b/);
  if (!match) return null;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : null;
}

function parseCard(cardHtml, sourcePage) {
  const companyName = stripHtml((cardHtml.match(/id="startup-website-link"[^>]*>\s*<h3[^>]*>([^<]+)/i) || [])[1]);
  if (!companyName) return null;

  const websiteRaw = (cardHtml.match(/<a[^>]*href="([^"]+)"[^>]*id="startup-website-link"/i) || [])[1] || null;
  const websiteUrl = sanitizeExternalUrl(websiteRaw);
  const logoUrl = sanitizeExternalUrl((cardHtml.match(/<img[^>]*src="([^"]+)"[^>]*alt="[^"]*startup company logo/i) || [])[1] || null);

  const summaryMatch = cardHtml.match(/<b id="card-header">What they do:\s*<\/b>\s*<br>([\s\S]*?)<\/p>/i);
  const productSummary = stripHtml((summaryMatch || [])[1] || "") || `${companyName} builds startup products and services.`;

  const industryTags = Array.from(cardHtml.matchAll(/id="industry-tags">([\s\S]*?)<\/span>/gi)).map((m) => stripHtml(m[1]));
  const companySizeTags = Array.from(cardHtml.matchAll(/id="company-size-tags">([\s\S]*?)<\/span>/gi)).map((m) => stripHtml(m[1]));
  const fundingTags = Array.from(cardHtml.matchAll(/id="funding-tags">([\s\S]*?)<\/span>/gi)).map((m) => stripHtml(m[1]));

  const factsBlock = (cardHtml.match(/<b id="card-header">Quick facts:\s*<\/b>([\s\S]*?)<\/p>/i) || [])[1] || "";
  const hqMatch = factsBlock.match(/HQ:\s*([^<\n]+)/i);
  const headquarters = stripHtml((hqMatch || [])[1] || "") || null;

  let foundedYear = null;
  for (const badge of companySizeTags) {
    const year = parseYearFromText(badge);
    if (/founded/i.test(badge) && year) {
      foundedYear = year;
      break;
    }
  }

  const employeeCount =
    companySizeTags.find((item) => /employee/i.test(item)) || null;

  const foundersBlock = (cardHtml.match(/<b id="card-header">Founders:\s*<\/b>\s*<br>([\s\S]*?)<\/p>/i) || [])[1] || "";
  const founderText = stripHtml(foundersBlock);

  const takeActionBlock = (cardHtml.match(/<b id="card-header">Take action:\s*<\/b>([\s\S]*?)<\/p>/i) || [])[1] || "";
  const linkedinUrl = sanitizeExternalUrl((takeActionBlock.match(/<a[^>]*href=([^\s>]+)[^>]*>\s*See who works here/i) || [])[1]?.replace(/"/g, "") || null);

  const jobsUrl = sanitizeExternalUrl((cardHtml.match(/<a[^>]*href=([^\s>]+)[^>]*id="view-jobs"/i) || [])[1]?.replace(/"/g, "") || null);

  const isFeatured = /id="sponsor-link"[^>]*>\s*Featured/i.test(cardHtml);
  const fundingText = fundingTags.join(", ");
  const stage = parseStage(fundingTags, fundingText);
  const investors = parseInvestors(fundingTags);

  const founderName = founderText || `${companyName} Team`;

  return {
    id: `source-a-${slugify(companyName)}`,
    slug: `${slugify(founderName)}-${slugify(companyName)}`,
    companySlug: slugify(companyName),
    founderName,
    companyName,
    foundedYear,
    headquarters,
    industry: industryTags[0] || "Startup",
    stage,
    productSummary,
    fundingInfo: fundingText || null,
    sourceUrl: "https://100xfounder.com/startups",
    ycProfileUrl: null,
    websiteUrl,
    employeeCount,
    techStack: [],
    recentNews: [`${companyName} appears in the 100Xfounder startup directory import feed.`],
    linkedinUrl,
    twitterUrl: null,
    verified: true,
    isFeatured,
    avatarUrl: logoUrl,
    fundingTotalDisplay: null,
    fundingTotalUsd: null,
    lastRound:
      fundingTags.length > 0
        ? {
            round: stage,
            amount: fundingText || stage,
            amountUsd: null,
            announcedOn: null,
            investors,
            source: "https://100xfounder.com/startups",
          }
        : null,
    allRounds:
      fundingTags.length > 0
        ? [
            {
              round: stage,
              amount: fundingText || stage,
              amountUsd: null,
              announcedOn: null,
              investors,
              source: "https://100xfounder.com/startups",
            },
          ]
        : [],
    isHiring: Boolean(jobsUrl),
    hiringRoles: jobsUrl ? ["Open Roles"] : [],
    jobsUrl,
  };
}

function parseCardsFromHtml(html, sourcePage) {
  const chunks = html.split('<div class="col-12 col-md-6 col-xl-4 infinite-item">').slice(1);
  return chunks.map((chunk) => parseCard(chunk, sourcePage)).filter(Boolean);
}

async function fetchText(url) {
  if (CACHE_DIR) {
    if (url === SITEMAP_URL) {
      const path = `${CACHE_DIR}/sitemap.xml`;
      if (existsSync(path)) {
        return readFileSync(path, "utf8");
      }
    }

    if (url === STARTUPS_ROOT) {
      const path = `${CACHE_DIR}/startups-page-1.html`;
      if (existsSync(path)) {
        return readFileSync(path, "utf8");
      }
    }

    const pageMatch = url.match(/\\?page=(\\d+)/);
    if (pageMatch) {
      const path = `${CACHE_DIR}/startups-page-${pageMatch[1]}.html`;
      if (existsSync(path)) {
        return readFileSync(path, "utf8");
      }
    }
  }

  const safeUrl = String(url).replace(/'/g, "'\\''");
  return execSync(
    `curl -sS '${safeUrl}' -H 'User-Agent: ${USER_AGENT}' -H 'Accept:application/xml,text/xml,text/html,*/*'`,
    {
      encoding: "utf8",
      maxBuffer: 8 * 1024 * 1024,
      shell: "/bin/zsh",
    },
  );
}

function pickBetter(current, candidate) {
  const score = (item) => {
    let total = 0;
    if (item.websiteUrl) total += 2;
    if (item.linkedinUrl) total += 1;
    if (item.avatarUrl) total += 1;
    if (item.isHiring) total += 1;
    if (item.fundingInfo) total += 1;
    total += Math.min(item.productSummary.length / 120, 4);
    return total;
  };

  return score(candidate) > score(current) ? candidate : current;
}

async function main() {
  const sitemapXml = await fetchText(SITEMAP_URL);
  const sitemapUrls = parseSitemapUrls(sitemapXml);
  const startupQueryUrls = sitemapUrls.filter(
    (url) =>
      url.startsWith(`${SOURCE_HOST}/?`) &&
      !url.includes("/jobs") &&
      !url.includes("salary-equity") &&
      !url.includes("startup-salary-equity-database"),
  );

  const firstHtml = await fetchText(STARTUPS_ROOT);
  const count = parseCount(firstHtml) || 0;
  const firstCards = parseCardsFromHtml(firstHtml, STARTUPS_ROOT);
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const companies = new Map();
  for (const card of firstCards) {
    companies.set(card.companySlug, card);
  }

  for (let page = 2; page <= totalPages; page += 1) {
    const pageUrl = `${STARTUPS_ROOT}?page=${page}`;
    const html = await fetchText(pageUrl);
    const cards = parseCardsFromHtml(html, pageUrl);

    for (const card of cards) {
      const existing = companies.get(card.companySlug);
      if (!existing) {
        companies.set(card.companySlug, card);
      } else {
        companies.set(card.companySlug, pickBetter(existing, card));
      }
    }

    if (page % 10 === 0) {
      console.log(`Scraped page ${page}/${totalPages} | unique companies: ${companies.size}`);
    }
  }

  if (ENABLE_QUERY_SAMPLE) {
    // Optional query crawl for any missing listings.
    for (const url of startupQueryUrls.slice(0, 500)) {
      if (companies.size >= count && count > 0) {
        break;
      }
      const html = await fetchText(url);
      const cards = parseCardsFromHtml(html, url);
      for (const card of cards) {
        const existing = companies.get(card.companySlug);
        if (!existing) {
          companies.set(card.companySlug, card);
        } else {
          companies.set(card.companySlug, pickBetter(existing, card));
        }
      }
    }
  }

  const output = Array.from(companies.values())
    .sort((a, b) => a.companyName.localeCompare(b.companyName))
    .map(({ jobsUrl, ...item }) => item);

  writeFileSync(
    "lib/founders/source-a-seed.json",
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );

  const wrapper = `import sourceASeed from "@/lib/founders/source-a-seed.json";\nimport type { FounderDirectoryItem } from "@/lib/founders/types";\n\nexport const SOURCE_A_PROFILE_URL = "https://100xfounder.com/startups";\n\nexport const SOURCE_A_SEED: FounderDirectoryItem[] = sourceASeed as FounderDirectoryItem[];\n`;
  writeFileSync("lib/founders/source-a-seed.ts", wrapper, "utf8");

  console.log(`Done. scraped=${output.length} expected=${count} sitemapQueries=${startupQueryUrls.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
