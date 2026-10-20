# Sitemap audit: 100xfounder.com (2026-10-20)

**Score: 72 / 100**

Method: robots.txt discovery, then every child sitemap fetched in full. Status, robots (meta and X-Robots-Tag), canonical and main-content word count were checked on every URL in the startup (152), job (285), post (67), page (26), event (73), guide (3) and news (7) sitemaps. They were checked on a sample of 25 for each taxonomy and landing sitemap. At most 5 concurrent requests, 1 s delay. A few early timeouts were retried slowly. Word counts are `<main>` text only and are approximate.

## Per-sitemap results

| Sitemap | URLs | Checked | Status / canonical / robots | lastmod | Dups |
|---|---|---|---|---|---|
| posts-post | 67 | 67 | all 200, self-canonical, indexable, all 500+ words | real (53 distinct values) | 0 |
| posts-page | 26 | 26 | all 200, indexable. 11 under 500 words (tool, contact, legal and index pages) | 11 distinct values, 13 pages share 2026-10-04 | 0 |
| posts-xf_startup | 152 | 152 | all 200, self-canonical. **12 serve noindex** (see F1) | real (141 distinct values) | 0 |
| posts-xf_event | 73 | 73 | all 200, indexable | **identical for all 73 (2026-10-09T21:35:07)** | 0 |
| posts-xf_job | 285 | 285 | all 200, indexable. No JobPosting `validThrough` found on the job page sampled | real (284 distinct values) | 0 |
| posts-xf_guide | 3 | 3 | OK | real | 0 |
| taxonomies-category | 8 | 8 | OK, indexable. 5 of 8 under 500 words | none | 0 |
| taxonomies-xf_industry | 77 | 25 | OK, indexable. All 25 sampled under 500 words (211-445) | none | 0 |
| taxonomies-xf_company | 29 | 25 | OK, indexable. 23 of 25 under 500 words (jobs/company/*) | none | 0 |
| landing | 68 | 25 | OK. Calculators about 200 words | none | 0 |
| news-sitemap.xml | 7 | 7 | all 200, indexable, 500+ words. Valid `news:` markup with publication, date and title | n/a | 0 |

Index: 10 children, valid XML, declared in robots.txt (both wp-sitemap.xml and news-sitemap.xml).

Structure: every file is far under 50k URLs. There are no `priority` or `changefreq` tags. The sitemaps have no redirects and no 404s. No X-Robots-Tag headers were seen. All sampled canonicals are self-referencing.

## Findings

### F1. HIGH: 12 startup URLs sit in the sitemap but the static page says noindex
- Affected: /startup/skiff/, snackpass, sourcegraph, sprig, standard-ai, strava, sword-health, tala, tecton-ai, tibber, toss, trusona.
- Each has 1,100-1,350 words, so it is rich and has been released (it is in the sitemap).
- The default (Astro static) response still returns `noindex, follow`. WordPress rendered with a cache-busting query returns an indexable page. Checked for skiff and snackpass.
- Cause: the stale static copy was not rebuilt or re-uploaded when the drip release flipped the robots tag. Either the headless `ver` does not change on release, or the page sat in the parity or upload queue.
- Fix: make the drip-release step bump `ver`/modified time and trigger `astro/fetch.py` for that URL. For now, run `bash astro/deploy.sh`. Add a nightly check that fails if any sitemap URL returns noindex.
- Impact: Googlebot gets a "submitted URL marked noindex" signal, and the 20-a-day release is wasted for these pages.

### F2. HIGH: huge indexable-but-unlisted gap in startups
- REST reports **1,494 published startups**. Only 152 are in the sitemap (about 10%).
- That matches the thin-noindex design. The drip is 20 a day, so the rest are either thin or queued.
- I could not verify the thin vs rich split for the other 1,342 from outside. Compare `_xf_indexable` against the sitemap query and list rich listings that are neither released nor in the drip queue.
- dagmor (467 words) is in the sitemap and indexable but is under the 500-word floor in CLAUDE.md. Either enrich it or noindex it.
- Fix: export the list of rich, not-yet-released startups to confirm the drip queue holds all of them. Check that no rich listing is stuck.

### F3. MEDIUM: jobs coverage and Google's copied-job-content handling
- The job sitemap has 285 URLs, but REST reports 1,116 published jobs. About 830 jobs are published but not in the sitemap. Confirm that this is deliberate, for example the cap, filtering or expiry.
- The job pages are copies of employer ATS postings (Greenhouse, Lever, Ashby). Google treats duplicated job copies as low value and prefers the original or employer page.
- Recommendation: keep the job sitemap only for jobs that add something (India-specific context, "how to apply" guidance, salary notes). Otherwise drop it from the general sitemap and rely on the Indexing API (the documented job route) plus the /jobs/ hub. Do not ship all 1,116 jobs.
- Add `validThrough` to the JobPosting schema. The first sampled page had none, and expired jobs must leave the sitemap and return 410 or noindex promptly.
- 14 of 285 job pages are under 500 words (about 300-500). Noindex these or drop them from the sitemap.
- Decision: keep it for now, but trim it. This is a judgement call and the owner should decide. The job pages are not showing Google errors, but the dedupe risk grows with scale.

### F4. MEDIUM: thin pages listed as indexable
Under 500 words, in the sitemap, and without noindex (CLAUDE.md says thin pages should be noindexed):
- **73 of 73 events** (330-380 words). They also all share the same lastmod, which looks like a bulk import date.
- **xf_industry**: 25 of 25 sampled (of 77), xf_company 23 of 25 sampled (of 29), category 5 of 8, and 4 landing pages (the calculators, about 200 words).
- Pages: /spotlights/ (13 words), /contact/, /terms/, /corrections-policy/, /submit/ and similar utility pages.
- Fix: noindex plus remove from the sitemap, or enrich above 500 words. Events and thin archives first. Utility pages (contact, terms, submit) should be noindex and out of the sitemap.

### F5. LOW: lastmod quality
- Events: all 73 carry 2026-10-09T21:35:07 (same second). Use the real event or update date, or omit it. Google ignores lastmod values it finds unreliable.
- Pages: 13 of 26 share 2026-10-04T13:53:12.
- Taxonomy and landing sitemaps (182 URLs) have no lastmod. This is optional and harmless, but adding lastmod from the newest child post helps.
- Post, startup and job lastmods look genuine (hundreds of distinct values).

### F6. INFO
- No duplicates in any file. No priority/changefreq. News sitemap has 7 items, all published within the last 2 days, which is correct for Google News's 48-hour window.
- Both sitemaps are listed in robots.txt. The robots rule `Disallow: /jobs/*?` is fine.
- Not checked: expired-job detection beyond schema, and the status of the ~830 unlisted jobs and 1,342 unlisted startups.

## Priority fixes
1. Fix the stale noindex on the 12 released startups (F1) and add a sitemap-vs-robots monitor.
2. Remove or enrich the 73 events and thin archives (F4).
3. Decide the job sitemap policy and add `validThrough` (F3).
4. Real lastmod for events and pages (F5).
