#!/usr/bin/env node

const baseUrlInput = process.argv[2] || "https://100xfounder.com";
const baseUrl = baseUrlInput.replace(/\/+$/, "");

const failures = [];
const warnings = [];

function pass(message) {
  console.log(`PASS  ${message}`);
}

function fail(message) {
  failures.push(message);
  console.error(`FAIL  ${message}`);
}

function warn(message) {
  warnings.push(message);
  console.warn(`WARN  ${message}`);
}

async function fetchText(url, options = {}) {
  const response = await fetch(url, {
    redirect: "manual",
    ...options,
  });
  const text = await response.text();
  return { response, text };
}

function extractCanonical(html) {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
  );
  return match?.[1] || null;
}

function extractLocEntries(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) =>
    match[1].trim(),
  );
}

function isForbiddenSitemapUrl(url) {
  const path = new URL(url).pathname;
  return (
    path === "/search" ||
    path === "/feature-now" ||
    path.startsWith("/api/") ||
    path.startsWith("/founder/") ||
    path === "/llms.txt" ||
    path.endsWith(".xml")
  );
}

async function checkRobots() {
  const { response, text } = await fetchText(`${baseUrl}/robots.txt`);
  if (response.status !== 200) {
    fail(`robots.txt should return 200 but returned ${response.status}`);
    return;
  }

  const requiredLines = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin",
    "Disallow: /dashboard",
  ];

  requiredLines.forEach((line) => {
    if (!text.includes(line)) {
      fail(`robots.txt missing required line: "${line}"`);
    }
  });

  if (!text.includes("Sitemap:")) {
    fail("robots.txt missing sitemap references");
  } else {
    pass("robots.txt includes crawl directives and sitemap references");
  }
}

async function checkSitemap() {
  const { response, text } = await fetchText(`${baseUrl}/sitemap.xml`);
  if (response.status !== 200) {
    fail(`sitemap.xml should return 200 but returned ${response.status}`);
    return { urls: [] };
  }

  const urls = extractLocEntries(text);
  if (urls.length === 0) {
    fail("sitemap.xml has no <loc> entries");
    return { urls };
  }

  const invalidUrls = urls.filter(isForbiddenSitemapUrl);
  if (invalidUrls.length > 0) {
    fail(
      `sitemap.xml contains noindex/redirect/utility URLs: ${invalidUrls
        .slice(0, 5)
        .join(", ")}`,
    );
  } else {
    pass("sitemap.xml excludes noindex/redirect/utility URLs");
  }

  return { urls };
}

async function checkCanonical(paths) {
  for (const path of paths) {
    const { response, text } = await fetchText(`${baseUrl}${path}`);
    if (response.status !== 200) {
      fail(`${path} should return 200 for canonical check, got ${response.status}`);
      continue;
    }
    const canonical = extractCanonical(text);
    if (!canonical) {
      fail(`${path} is missing a canonical link`);
      continue;
    }
    if (!canonical.startsWith("https://100xfounder.com/")) {
      fail(`${path} canonical must use https://100xfounder.com but found ${canonical}`);
      continue;
    }
    pass(`${path} has canonical on production domain`);
  }
}

async function checkRedirect(path, expectedPrefix) {
  const { response } = await fetchText(`${baseUrl}${path}`);
  if (response.status !== 308) {
    fail(`${path} should return 308 but returned ${response.status}`);
    return;
  }
  const location = response.headers.get("location") || "";
  if (!location.startsWith(expectedPrefix)) {
    fail(`${path} should redirect to ${expectedPrefix}* but got ${location}`);
    return;
  }
  pass(`${path} redirects to ${location}`);
}

async function checkNoindex(path) {
  const { response, text } = await fetchText(`${baseUrl}${path}`);
  if (response.status !== 200) {
    fail(`${path} should return 200 for noindex check, got ${response.status}`);
    return;
  }

  const hasNoindexMeta = /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(
    text,
  );
  if (!hasNoindexMeta) {
    fail(`${path} should include noindex robots meta`);
    return;
  }

  pass(`${path} includes noindex directive`);
}

async function run() {
  console.log(`Running SEO crawl validation against ${baseUrl}`);

  await checkRobots();
  const { urls } = await checkSitemap();

  await checkCanonical(["/", "/blog", "/founders", "/pricing", "/signals", "/startups"]);
  await checkRedirect("/feature-now", "/get-featured");

  const founderFromSitemap = urls.find((url) =>
    new URL(url).pathname.startsWith("/founders/"),
  );
  if (founderFromSitemap) {
    const slug = new URL(founderFromSitemap).pathname.replace("/founders/", "");
    await checkRedirect(`/founder/${slug}`, `/founders/${slug}`);
  } else {
    warn("No founder URL found in sitemap to verify /founder/:slug redirect");
  }

  await checkNoindex("/search?q=openai");
  await checkNoindex("/jobs");
  await checkNoindex("/founders?industry=AI&location=New+York");

  if (warnings.length > 0) {
    console.log(`Completed with ${warnings.length} warning(s).`);
  }

  if (failures.length > 0) {
    console.error(`Completed with ${failures.length} failure(s).`);
    process.exit(1);
  }

  console.log("SEO crawl validation completed successfully.");
}

run().catch((error) => {
  console.error("Validation script crashed:", error);
  process.exit(1);
});
