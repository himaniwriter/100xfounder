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

function extractLocEntries(xml) {
  return Array.from(xml.matchAll(/<loc>([^<]+)<\/loc>/g)).map((match) =>
    match[1].trim(),
  );
}

function extractCanonical(html) {
  const match = html.match(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)["'][^>]*>/i,
  );
  return match?.[1] || null;
}

function hasNoindexMeta(html) {
  return /<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex/i.test(
    html,
  );
}

function hasBreadcrumbSchema(html) {
  return /"@type"\s*:\s*"BreadcrumbList"/i.test(html);
}

async function collectSitemapUrls(entrypoint) {
  const queue = [entrypoint];
  const seen = new Set();
  const urls = [];

  while (queue.length > 0) {
    const sitemapUrl = queue.shift();
    if (!sitemapUrl || seen.has(sitemapUrl)) {
      continue;
    }
    seen.add(sitemapUrl);

    const { response, text } = await fetchText(sitemapUrl);
    if (response.status !== 200) {
      fail(`${sitemapUrl} returned ${response.status}`);
      continue;
    }

    const locs = extractLocEntries(text);
    if (text.includes("<sitemapindex")) {
      locs.forEach((loc) => queue.push(loc));
      continue;
    }

    locs.forEach((loc) => urls.push(loc));
  }

  return Array.from(new Set(urls));
}

async function checkRobots() {
  const { response, text } = await fetchText(`${baseUrl}/robots.txt`);
  if (response.status !== 200) {
    fail(`robots.txt should return 200 but returned ${response.status}`);
    return;
  }

  const required = [
    "User-agent: *",
    "Allow: /",
    "Disallow: /api/",
    "Disallow: /admin",
    "Disallow: /dashboard",
    "Sitemap:",
  ];

  required.forEach((line) => {
    if (!text.includes(line)) {
      fail(`robots.txt missing required directive: ${line}`);
    }
  });

  pass("robots.txt directives validated");
}

async function checkSitemapUrls(urls) {
  if (urls.length === 0) {
    fail("No URLs found in sitemap files");
    return;
  }

  pass(`Collected ${urls.length} sitemap URLs`);

  for (const url of urls.slice(0, 5000)) {
    const { response, text } = await fetchText(url);
    const status = response.status;
    if (status >= 300 && status < 400) {
      fail(`Sitemap URL redirects: ${url} -> ${response.headers.get("location") || "unknown"}`);
      continue;
    }
    if (status !== 200) {
      fail(`Sitemap URL is not 200: ${url} (${status})`);
      continue;
    }

    const canonical = extractCanonical(text);
    if (!canonical) {
      fail(`Missing canonical on ${url}`);
      continue;
    }

    if (!canonical.startsWith("https://100xfounder.com/")) {
      fail(`Canonical host mismatch on ${url}: ${canonical}`);
      continue;
    }

    if (hasNoindexMeta(text)) {
      fail(`Sitemap URL is noindex: ${url}`);
      continue;
    }
  }

  pass("Sitemap URL status/canonical/noindex checks completed");
}

async function checkQueryRules() {
  const cases = [
    {
      path: "/search?q=openai",
      expectNoindex: true,
      expectedCanonicalSuffix: "/search",
    },
    {
      path: "/founders?industry=fintech",
      expectNoindex: false,
      expectedCanonicalSuffix: "/founders?industry=fintech",
    },
    {
      path: "/founders?industry=fintech&location=india",
      expectNoindex: true,
      expectedCanonicalSuffix: "/founders",
    },
    {
      path: "/blog?category=Funding",
      expectNoindex: false,
      expectedCanonicalSuffix: "/blog?category=Funding",
    },
    {
      path: "/blog?category=Funding&topic=ai",
      expectNoindex: true,
      expectedCanonicalSuffix: "/blog",
    },
    {
      path: "/startups?industry=artificial-intelligence",
      expectNoindex: true,
      expectedCanonicalSuffix: "/startups/industry/artificial-intelligence",
    },
  ];

  for (const testCase of cases) {
    const { response, text } = await fetchText(`${baseUrl}${testCase.path}`);
    if (response.status !== 200) {
      fail(`${testCase.path} returned ${response.status}`);
      continue;
    }

    const canonical = extractCanonical(text);
    if (!canonical?.endsWith(testCase.expectedCanonicalSuffix)) {
      fail(
        `${testCase.path} canonical mismatch. Expected suffix "${testCase.expectedCanonicalSuffix}", got "${canonical}"`,
      );
    }

    const isNoindex = hasNoindexMeta(text);
    if (testCase.expectNoindex !== isNoindex) {
      fail(
        `${testCase.path} robots mismatch. Expected noindex=${testCase.expectNoindex}, got noindex=${isNoindex}`,
      );
    }
  }

  pass("Query indexability rules validated");
}

function pickSampleByPrefix(urls, prefix) {
  return urls.find((url) => new URL(url).pathname.startsWith(prefix)) || null;
}

async function checkBreadcrumbs(urls) {
  const samples = [
    pickSampleByPrefix(urls, "/countries/"),
    pickSampleByPrefix(urls, "/industries/"),
    pickSampleByPrefix(urls, "/stages/"),
    pickSampleByPrefix(urls, "/startups/industry/"),
    pickSampleByPrefix(urls, "/blog/"),
  ].filter(Boolean);

  if (samples.length === 0) {
    warn("No breadcrumb sample URLs found in sitemap");
    return;
  }

  for (const sample of samples) {
    const { response, text } = await fetchText(sample);
    if (response.status !== 200) {
      fail(`Breadcrumb sample ${sample} returned ${response.status}`);
      continue;
    }

    if (!hasBreadcrumbSchema(text)) {
      fail(`Breadcrumb schema missing on ${sample}`);
      continue;
    }

    pass(`Breadcrumb schema found on ${sample}`);
  }
}

async function run() {
  console.log(`Running SEO crawl audit against ${baseUrl}`);
  await checkRobots();
  const urls = await collectSitemapUrls(`${baseUrl}/sitemap.xml`);
  await checkSitemapUrls(urls);
  await checkQueryRules();
  await checkBreadcrumbs(urls);

  if (warnings.length > 0) {
    console.log(`Completed with ${warnings.length} warning(s).`);
  }

  if (failures.length > 0) {
    console.error(`Completed with ${failures.length} failure(s).`);
    process.exit(1);
  }

  console.log("SEO crawl audit completed successfully.");
}

run().catch((error) => {
  console.error("SEO crawl audit failed to run:", error);
  process.exit(1);
});
