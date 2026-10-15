# Content quality / E-E-A-T audit: 100xfounder.com (12 Oct 2026)

Sample: 13 articles (35 URLs in the posts sitemap, including 4 tool pages), 6 landing pages, 3 job pages, 1 guide, trust pages. Fetched live HTML. The job-landing job-count scan did not finish, so thin-landing counts are partial.

## Scores (0-100)
Content quality 66. E-E-A-T: Experience 35, Expertise 55, Authoritativeness 50, Trust 62. AI citation readiness 78.

## Findings
1. HIGH, scaled-content risk: 78 job landing pages (role x city, e.g. /jobs/sales-jobs-in-mumbai/) plus about 1,144 job pages, on a domain with a 4,600-URL spammy history.
   - Evidence: landing pages are about 530-650 words, mostly filter UI and job lists with 107-130 internal links and 0 external links. The meta description is one identical template ("N open X jobs ... taken only from official careers pages"). Company pages: Vercel 40 words, GitLab and Zscaler about 430-450 words, all with the same "Open roles at X in India, synced daily" description.
   - Fix: noindex any landing or company page with fewer than about 10 jobs or no unique text. Keep about 8-10 role pages and the 8 city-level pages indexable. Add 150-250 words of unique, sourced intro (salary data, hiring trends) to those. Leave the thin ones out of the sitemap.
2. HIGH, job pages are copied ATS text: 800-940 words, with `<title>` and meta description scraped from the posting ("About Us Paytm is India's leading...", "About Agoda At Agoda, we bridge..."). Titles run 97-105 characters and are truncated. There is no original value beyond JobPosting schema.
   - Fix: write the meta description from structured fields ("Senior Sales Engineer, Rubrik, Mumbai. Posted 20 Aug. On-site"). Shorten titles to 60 characters or fewer. Noindex jobs older than 60 days or with no pay or description. Add a short unique "what to know" block. Do not request indexing for any job page.
3. HIGH, Experience signal is weak: all articles are bylined to the pen name (honest, and correct per the rules). The "How to get a job at X" guides and the "best AI tools" lists show no first-hand testing, screenshots or own benchmarks.
   - Fix: add a "How we tested" section with real test notes, dated screenshots and prompts. Where nothing was tested, say so ("compiled from vendor documentation"). That is honest and still helpful.
4. HIGH, inconsistent authorship on a money page: /best-education-marketing-agency-india/ is bylined "Lovish Madaan" (a real name, on a "Our #1 Pick" agency ranking) while the other 34 use Ishaan Vardhan. It reads as a commercial or paid ranking.
   - Fix: disclose any commercial relationship, and use "Sponsored" or rel=sponsored if paid. Use a consistent byline or an owner bio. Consider noindexing it until the ranking method is documented.
5. MEDIUM, About page undermines trust: /about/ is 145 words and describes the site as a "startup launch directory" (Product Hunt curation), which does not match the news, jobs and AI-tool content. It names no people, has no address, no ownership or funding statement, and no internal links. /editorial-policy/ is 172 words and /author/ishaan-vardhan/ has no meta description.
   - Fix: rewrite About (400+ words) covering who runs the site, a real contact and address, how AI is used, the revenue model (ads, affiliate, sponsored) and a corrections link. Expand the editorial policy with an AI-use section and a link to the corrections policy. Add an affiliate and advertising disclosure (/advertising-disclosure/ returns 404, so check what /disclaimer/ and /advertise/ cover).
6. MEDIUM, AI-use disclosure not found on the sampled article: the best-ai-for-coding text showed no "AI-assisted" or "pen name" line in body, byline or footer, only a Sources list. You said a disclosure exists. Confirm it renders on every article. The author bio is the only place the pen name is explained.
7. MEDIUM, topical breadth: five clusters (funding news, jobs, AI tools, salary and tax calculators, events and startup directory) on a 6-day-old domain with 35 articles. "Best AI tools" lists make up about 14 of the 35 articles. Topical authority is diluted and the news cluster is the thinnest (about 5 posts).
   - Fix: pick 2 hero pillars for the next 60 days: Indian startup funding and news, plus AI-tool recommendations for India. Pause new apply-guides and calculators beyond what exists.
8. MEDIUM, template duplication: the 9 "How to get a job at X" guides share the same 14-H2 structure, 19 internal links and the same title pattern ("How to Get a Job at X in 2026: ..."). They are 2,100-2,800 words and sourced (29-46 external links). Quality is good, but near-identical structure across 10+ pages is a scaled-content signal. Guides sit at two URL patterns (/how-to-get-a-job-at-openai/ and /how-to-apply/how-to-get-a-job-at-paytm/).
   - Fix: pick one URL pattern and 301 the others. Vary the structure by company. Do not add more until the existing ones are indexed.
9. MEDIUM, Semrush review is 10,963 words (46 min read, 24 H2s): bloated for a review, and the schema is only NewsArticle plus breadcrumbs (no Review markup, which is right under the no-fake-ratings rule).
   - Fix: trim to about 3,500 words, add a TL;DR table and a visible affiliate disclosure. Check affiliate links carry rel="sponsored".
10. LOW, internal linking: each article has 16-20 internal links. They are largely template-driven (sidebar and related blocks), and the in-body count was not measured. Titles are 76-93 characters (including the " – 100xFounder" suffix) and will truncate in results.
   - Fix: drop the suffix or shorten titles to 60 characters or fewer. Descriptions are 150-167 characters (good) but the agency article is 180 (truncates). Add 3-5 contextual body links between related articles (coding, designers, startups, free tools).
11. LOW, freshness is good: "Updated 7 Oct" stamps and "as of October 2026" in titles and descriptions. The risk is that mass same-day updates look artificial. Update dates only when facts change.
12. POSITIVE: strong sourcing (17-96 external links and a dated Sources list per article), clear H2 hierarchy, answer-first openings, NewsArticle and Person schema, a corrections policy and a privacy policy. These are the strengths to protect.

## Noindex, merge, improve
- Noindex or drop from the sitemap: job landing pages with fewer than about 10 jobs, company pages with fewer than 5 roles (Vercel), expired or undescribed job pages, and the author page until it has a meta description.
- Merge: the two apply-guide URL patterns; the overlapping "best AI tools" lists (best-free-ai-tools vs best-ai-tools-for-startups vs best-ai-tools-for-students) into one hub plus unique sub-pages.
- Improve first: /about/ and /editorial-policy/, the agency article, and the Semrush review.

## Top 10 "request indexing" (in order)
1. /about/
2. /editorial-policy/
3. /
4. /indian-startup-funding-q3-deal-count-falls/
5. /amd-world-labs-acquisition-fei-fei-li/
6. /upcoming-indian-startup-ipos/
7. /best-ai-for-coding/
8. /model-context-protocol-mcp-explained/
9. /in-hand-salary-from-ctc/ (then /tools/in-hand-salary-calculator/)
10. /how-to-get-a-job-at-openai/

Hold off on the agency article and job pages. Strengthen /about/ before requesting it if possible.
