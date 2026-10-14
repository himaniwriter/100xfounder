# Technical/indexability audit, 100xfounder.com (2026-10-12, read-only, ~25 requests)

Overall: the site is technically sound (HTTPS, 200s, canonicals, sitemaps, redirects, security headers, fast). Indexing is held back by crawl-demand and discovery, not by hard blocks.

## High
1. Homepage <title> is just "100xFounder" (no keywords/value prop). Fix: set a descriptive title in front-page.php / seo.php (xf title filter). Evidence: https://100xfounder.com/
2. Articles with no link from homepage or /blog/ (click depth 2+ only via categories): /model-context-protocol-mcp-explained/, /how-to-get-a-job-at-anthropic/, /best-ai-for-coding/, /best-ai-tools-for-startups/, /how-to-get-a-job-at-elevenlabs/ (5 of 35 posts). /blog/ shows ~29 links, has no pagination. Fix: make /blog/ list all posts with rel next/prev pagination (page-blog template / archive.php), add "latest/all guides" block on front-page.php.
3. Crawl share skewed to jobs: 1,144 job URLs (~78% of sitemap) of ~67KB each, plus 82 job landing pages, vs 35 articles. Googlebot (503 req/90 days, HTML 12%) will spend its budget on jobs. Fix: keep job URLs in a separate sitemap but order/lastmod honestly; consider noindex for jobs lacking unique description, and prioritise article/guide URLs via news-sitemap and homepage links. File: includes/seo.php (sitemap filters), includes/jobs.php.

## Medium
4. Job validThrough is identical on sampled jobs (2026-11-25T23:59:59+05:30 on Agoda, Stripe, Zscaler) = looks synthetic (import date + fixed window), not the employer's real expiry. Risk of Google "expired job" mismatch. Fix: only emit validThrough when the ATS gives a date; otherwise omit; drop jobs not seen in latest feed. includes/jobs.php:623 (_xf_valid_through source).
5. Job landing pages (/jobs/<role>-jobs-in-<city>/, e.g. engineering-jobs-in-pune, operations-jobs-in-remote) have unique titles/descriptions/counts and 15-51 job links, so not duplicates, but 7-job pages like operations-jobs-in-remote are borderline thin and overlap /jobs/ and each other. Fix: noindex landing pages with <10 jobs and drop from wp-sitemap-landing-1.xml (includes/seo.php / landing module).
6. Job pages are heavy (58-67KB HTML) and og:description is the raw start of the employer JD (copied text, duplicate-content risk vs the ATS). Fix: add unique intro/summary (role, location, company link) and truncate copied JD; includes/jobs.php / single-xf_job.php.
7. Site-search page /?s=x returns 200 with noindex,follow and is disallowed in robots.txt. Disallowed + noindex conflict (Google cannot see the noindex). Harmless, but remove the robots Disallow for ?s= if you want noindex honoured, or keep and accept.
8. Missing indexnow key file: https://100xfounder.com/indexnow.txt returns 404 (key file naming is <key>.txt, so verify the real key URL in settings.php matches what is submitted; IndexNow code exists in seo.php/settings.php).

## Low
9. robots.txt: two Sitemap lines, fine; /wp-sitemap.xml (core) lists an xf_industry sitemap, confirm it now has only the 3 intended terms.
10. HSTS lacks includeSubDomains/preload; no Content-Security-Policy beyond upgrade-insecure-requests (optional).
11. AdSense and GTM scripts are async (OK); theme CSS/JS cached 7 days with ?ver= (OK). Homepage 134KB HTML; consider trimming inline CSS.

## Passing
- http->https 301, www->apex 301 (single hop), unknown URL returns true 404 (no soft 404), fake /job/ returns 404.
- Canonical self-referencing on home, tools, landing, job pages; one meta description; no X-Robots-Tag header.
- /wp-sitemap.xml index valid; post sitemap 35 URLs; news-sitemap has 9 URLs. Jobs lastmod are current (2026-10-09/10).
- Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, HSTS present.
- No hreflang (single English site), fine.
- Homepage links to ~25 articles, 5 recent jobs, events, category hubs; /jobs/ links 50 jobs with canonical to itself and ?-filters disallowed.

Technical score estimate: 74/100.
