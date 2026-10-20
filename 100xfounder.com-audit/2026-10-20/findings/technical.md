# Technical SEO audit: 100xfounder.com (2026-10-20)

Score: 58/100

Method: sitemap_discovery helper; all 758 unique sitemap URLs fetched (5 concurrent, 1 s delay); 90 random startup URLs that are not in the sitemap; ~15 archive/pagination/redirect probes. Stopped early at the turn limit. The redirect-chain and status-code probe list (http/www/trailing-slash/404/410/feeds) was NOT run, and hreflang, JobPosting schema and ATS-duplication were not checked in depth.

## What works
- robots.txt is valid and declares both sitemaps. The helper validates wp-sitemap.xml (sitemapindex) and news-sitemap.xml (urlset). /sitemap.xml 301s to wp-sitemap.xml in one hop.
- Sitemap index has 10 children and 758 unique URLs. 731/731 first-pass 200s on pages that responded, then 27/27 retried OK. No sitemap URL redirects or 404s.
- Every sitemap page has a self-referencing canonical, exactly one H1, and JSON-LD. No canonical mismatches.
- 90/90 sampled startups outside the sitemap (1,337 of 1,488 listed) are noindex,follow. No indexable rich page was found missing from the sitemap in that sample.
- HTTPS: HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy and upgrade-insecure-requests are present. http:// 301s to https. www serves 200 (not tested for a redirect to the apex).
- Static pages are fast: TTFB 0.24-0.32 s.
- Viewport meta is present on all pages checked.

## Findings

### 1. [Critical] Static Astro copies are stale; rebuilds appear to have stopped
Evidence: 12 startups are in wp-sitemap-posts-xf_startup-1.xml but the static page serves `noindex, follow`: /startup/skiff/, snackpass, sourcegraph, sprig, standard-ai, strava, sword-health, tala, tecton-ai, tibber, toss, trusona (1,100-1,350 words each). The same URL with `?x=1` (WordPress) serves `max-image-preview:large`, so it is indexable. Static Last-Modified is 19 Oct 11:02-11:09 UTC, about 18 h old. /parallel-loop-seed-funding/ (published 19 Oct 21:19 IST, listed in news-sitemap) has no Last-Modified, so it is served by WordPress, not a static copy. I did not verify the scheduler directly; the stall is inferred.
Fix: check the `astro-rebuild` task and `astro/deploy.sh` logs. Add an alert when the newest static `index.html` is older than 2 h. Make the drip-release flip and the sitemap build reuse the same `ver` so a page is never listed while its static copy says noindex. As a stopgap, run `bash astro/deploy.sh` now.

### 2. [High] Thin pages are indexable and in the sitemap
Evidence (main-content words): 73/73 /event/ pages (279-443 words; the owner rule is a 500-word minimum) are indexable and listed. 76 of 77 /industry/ archives (median 117 words, min 59, e.g. /industry/api/ 59, /industry/agriculture/ 93) are indexable and listed; only /industry/games/ (35 words) is noindex, and that one is also in the sitemap. /category/ archives are 259-667 words, 8 listed. Landing pages /jobs/... have 156+ words. This fits the "Crawled – currently not indexed" (2,676) pattern.
Fix: noindex,follow and drop from the sitemap any event under 500 words and any industry/category archive under about 300 words, or enrich them. Never list a noindex URL in the sitemap (/industry/games/ is the example).

### 3. [High] Intermittent connection drops and timeouts under light load
Evidence: at 5 concurrent requests with a 1 s delay, 27/758 requests (3.6%) failed with RemoteDisconnected or read timeout. All were /job/ URLs (elastic-*, elevenlabs-*, fampay-*, hevo-data-*). All 27 returned 200 when retried at 2 concurrent. This is consistent with the 37 5xx errors in Search Console and suggests rate limiting or origin throttling on Hostinger's shared plan. Some of these job pages may be WordPress-served, not static.
Fix: confirm that every sitemap job URL has a static file. Check Hostinger's bot protection and rate limits against Googlebot. Review the Hostinger access log for 5xx and 429.

### 4. [High] Pagination and search by query string, with an infinite space
Evidence: /startups/ links to ?pg=2..62, and the canonical is always /startups/, so 1,300+ startup pages are reachable only through pages that canonicalise away. ?pg=63, ?q=ai and ?utm_x=1 all return 200 with the canonical set to /startups/ (there is no 404 for out-of-range pages). /jobs/?wp=Remote and /jobs/?pg=2 return 200 with the canonical set to /jobs/, and `Disallow: /jobs/*?` blocks them, so Google cannot see the canonical (likely the "blocked by robots" count of 37). The /startups/ and /launches/ ?pg URLs are not blocked. Query URLs are never served static, so they all hit WordPress.
Fix: return 404 for out-of-range ?pg. Either use self-canonical, crawlable /startups/page/N/ or keep them canonicalised and rely on the sitemap and internal links. Prefer noindex over robots-Disallow for the jobs facets (Disallow stops Google reading the canonical or noindex). Add `Disallow: /startups/*?` only if you also keep the sitemap complete.

### 5. [Medium] Sitemap covers only 151 of 1,488 startups, and job pages risk being near-duplicates
Evidence: 258 /job/ pages are listed. Titles repeat across locations (e.g. "Staff Software Engineer at Okta, Bengaluru" x6). Jobs are ATS-sourced (Greenhouse, Lever and similar), so body text is likely to be copied from the employer's listing; I did not diff it.
Fix: add unique value to each job page (location, salary context, "how to apply" steps), make titles unique with a location or team, keep JobPosting schema with validThrough, and remove expired jobs from the sitemap. Check the ATS copy before expecting the pages to index.

### 6. [Medium] /startup/ returns 404 and the internal link structure is thin
Evidence: /startup/ gives 404 (the post-type base has no archive). The startups hub, `/startups/?pg=N`, is the only path to ~1,300 noindex profiles. Their value is internal linking only, so these links dilute crawl budget (1,315 "Discovered – not indexed").
Fix: redirect /startup/ to /startups/. Link only to rich or indexable profiles from the hub's first pages.

### 7. [Low] No hreflang found
Evidence: 0 of 731 pages checked had hreflang. The AI module is said to produce 10-language translations; none was seen in sitemaps or links. Defer to seo-hreflang if translations go live.

### 8. [Low] Security headers
Evidence: HSTS max-age=31536000 without includeSubDomains/preload. No real CSP (upgrade-insecure-requests only).
Fix: add includeSubDomains if all subdomains are HTTPS, and a report-only CSP.

### 9. [Low] Search results page robots
Evidence: `/?s=test` returns 200 with no robots meta in my check, and it is robots-Disallowed, so a noindex would not be seen anyway.
Fix: add noindex and remove the Disallow, or keep it as is if no links to it exist.

## Cross-checks against other audits
- "12 drip-released startups had stale noindex static copies because rebuilds are not running": CONFIRMED. Exactly 12 startups, with the static copy noindex and WordPress indexable. Rebuild stall is consistent with Last-Modified of 19 Oct 11:09 UTC. Not checked directly in the scheduler.
- "Hostinger's bot protection serves a 'Just a moment' challenge to headless Chrome": NEITHER confirmed nor contradicted. I used curl/requests only and never saw a challenge page (all 821 HTML fetches returned real content). I did see 3.6% connection drops at 5 concurrent, which hints at throttling.
- "Thin events and archives are indexable": CONFIRMED. See finding 2: 73 events at 279-443 words and 76 of 77 industry archives, median 117 words, are indexable and in the sitemap.

## Not covered
Full ~200-URL status sample across redirects/410s, redirect-chain probes, hreflang, JobPosting validity, ATS text diff, orphan-page analysis, Core Web Vitals field data, and the news-sitemap detail (7 URLs, spot-checked only).
