# 100xfounder.com: full SEO audit, 20 Oct 2026

**SEO health score: 61/100.** This is a heuristic, weighted score; it isn't a Google-internal signal.
**Business type:** a publisher and directory for startups, AI tools and jobs, aimed at India.
**Specialist reports:** `findings/technical.md`, `content.md`, `schema.md`, `sitemap.md`, `performance.md`, `geo.md` and `sxo.md`.

| Category | Weight | Score | Source |
|---|---|---|---|
| Technical SEO | 22% | 58 | technical, sitemap |
| Content quality | 23% | 58 | content (E-E-A-T 54) |
| On-page / search experience | 20% | 52 | sxo |
| Schema | 10% | 68 | schema |
| Performance (estimated) | 10% | 78 | performance; the lab tools were blocked |
| AI search readiness | 10% | 66 | geo |
| Images | 5% | 70 | performance and content |

## Google's view (Search Console, data to 12 Oct)

- **Indexing:** 1 page indexed, about 5,990 not indexed.
- **Main reason:** 2,676 pages are "crawled – currently not indexed", meaning Google read them and judged quality and trust too low.
- **Last 7 days:** 6 clicks, 59 impressions, average position 4.

## Already fixed today (20 Oct)

| Finding | Fix |
|---|---|
| 12 articles and 3 guides bylined "Lovish Madaan" (content, schema, SXO; HIGH) | Moved to the pen name Ishaan Vardhan. Drafts and REST uploads now always credit the pen name. The static pages were rebuilt. |
| 12 drip-released startups had stale noindex static copies (technical, sitemap; CRITICAL) | Astro rebuild run, 2,501 pages refreshed. The root cause is that rebuilds can't run automatically until the Hostinger token is in the Keychain. |
| Thin events (73) and archives indexable (technical, sitemap; HIGH) | Events and jobs now follow the 500-word thin rule. Archives need 10+ items. Jobs are indexed for 14 days only, which took the jobs sitemap from 285 to 141. |
| Old-site 404s and 5xx in Search Console | They already return 301 or 410. "Validate fix" was started for both. |
| Calculators | The Feedough-style rebuild of 4 tools plus 9 new ones is in progress, with tests and live checks. |

## Open findings, highest severity first

1. **CRITICAL: no automatic Astro rebuilds.** Until the Keychain token exists, every drip release, edit or expiry goes stale on the static pages.
2. **HIGH: authority is close to zero.** No third-party mentions were found, and Organization `sameAs` lists Instagram only. Google's main trust signal for a young domain is missing.
3. **HIGH: no internal links between content types.** 5 of 6 sampled articles link to no startup or job page.
4. **HIGH: topics are spread too thin.** The site covers startups, jobs, tax, immigration, a Semrush review, events and calculators, with no cluster built in depth.
5. **HIGH: the funding promise is broken.** /funding-tracker/ is empty ("Rounds will appear here"). "swiggy funding" leads to a 404, and investor-persona fit scores 32/100.
6. **HIGH: templated listings.** Every listing uses one skeleton, has duplicate "Pricing" headings, shows "0 taps" and has empty reviews.
7. **HIGH: the Digihandler article isn't disclosed up front.** The site runs as an editorial pick, but the one-line disclosure isn't next to the pick (it's only in the form). The site rule requires it beside Digihandler.
8. **HIGH: JobPosting has no `validThrough`,** so Google can't expire jobs.
9. **HIGH: query-string pagination.** /startups/?pg=2…62 canonicalises to page 1, which leaves about 1,300 profiles reachable only through pages that point their canonical away.
10. **HIGH: bot protection.** Hostinger shows headless Chrome a "Just a moment" challenge, so Lighthouse and PSI are blocked. Confirm Googlebot is never challenged. 3.6% of /job/ requests timed out under light load.
11. **MEDIUM: schema.**
    - NewsArticle is used on evergreen explainers.
    - dateModified is earlier than datePublished.
    - HTML entities appear in JSON-LD.
    - Organization is repeated instead of referenced by @id.
    - There's no Person entity for the author.
    - Product Hunt sameAs links carry utm tags.
12. **MEDIUM: answer-first structure.** The first paragraph is a summary dek, few headings are questions, and profiles show no author or updated date.
13. **MEDIUM: performance.**
    - HTML is never a cache HIT.
    - Remote images are hot-linked (a 1.67 MB Wikimedia PNG on Swiggy).
    - Images use size-full JPEGs.
    - The logo gets fetchpriority instead of the hero image.
    - 44% of home page images have no dimensions.
14. **MEDIUM: llms.txt** contains HTML entities and a `/?p=754` link, and lists no tools or startups.
15. **LOW:** sitemap lastmods are identical, /sitemap_index.xml returns 404, and /startup/ returns 404.

## Not measured

- Real Core Web Vitals: the lab tools were blocked and there is no CrUX key.
- Backlink counts: no Moz or Ahrefs key.
- Live AI citations.
- Search Console data after 12 Oct.
