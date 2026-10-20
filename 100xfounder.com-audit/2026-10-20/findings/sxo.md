# SXO audit: 100xfounder.com (2026-10-20)

**SXO Gap Score (site-level): 52 / 100.** Separate from the SEO Health Score.

Method: live pages fetched with curl and parsed; SERPs read through WebSearch (top ~9 results per query, no rank positions or SERP-feature panels, so PAA, snippet and AI Overview were not assessed). Page type uses the taxonomy in the SXO skill.

## Query-by-query (SERP backwards analysis)

| # | Query | SERP dominant type | 100xFounder page | Mismatch | Persona scores (/100) |
|---|---|---|---|---|---|
| 1 | swiggy funding | News articles on specific rounds (Series H/J, 2018-21), mostly legacy outlets; high consensus | No page. `/swiggy-funding/` is 404. `/startup/swiggy/` is a product profile (1,432 words) with no funding rounds, and `/funding-tracker/` shows "Rounds will appear here as we track them" | CRITICAL (no page of the needed type) | Investor 25, Founder 40 |
| 2 | swiggy competitors | Data-provider competitor lists (CB Insights, Semrush, Sacra) plus news | `/startup/swiggy/` has an Alternatives block (Zomato, Zepto, Blinkit), each with "See its own pricing page" and no comparison | HIGH (list-style, no comparison data or market share) | Investor 35, Founder 55 |
| 3 | how to get a job at paytm | Third-party guides (Naukri Code360, Hitbullseye, resume sites), with the process and rounds | `/how-to-get-a-job-at-paytm/`: 1,827 words, how-to-apply guide, Lever board link, open-role count, rounds, Article schema, updated 15 Oct | ALIGNED. Best match of the six. | Job seeker 78, Founder 50 |
| 4 | in-hand salary from ctc calculator | Calculator tool pages (Petpooja, stockcalc) mixed with explainers (Upstox, Zoho, ABC) | Two pages: `/tools/in-hand-salary-calculator/` (13 inputs, WebApplication schema, only 213 words) and `/in-hand-salary-from-ctc/` (2,154-word guide, NewsArticle schema, 0 inputs). The guide links to the tool once. | MEDIUM. Right types exist but split, so the two pages compete. The tool is thin around the widget and the guide has no calculator. | Job seeker 72 (tool) / 65 (guide) |
| 5 | best ai tools for students | Listicles from vendors and blogs (ClickUp, PlusAI, Straico); high consensus | `/best-ai-tools-for-students/`: 2,603 words, 13 images, 1 table, 13 H2 | ALIGNED on type. Authority is weak against ClickUp-class domains; the site says some lists are compiled from docs, not hands-on tests. | Student/Founder 68, Job seeker 55 |
| 6 | indian startup funding this week | Weekly roundups from Inc42, Entrackr, IANS (dated, with totals and deal counts) | `/funding-tracker/` (empty rounds table, 12 article cards). No weekly roundup page exists. | CRITICAL (the SERP wants a weekly roundup, the page is an evergreen hub with no data) | Investor 30, Founder 45 |
| (extra) | "<startup> pricing", e.g. Nitrostack | Not run live (small startup, no meaningful SERP) | `/startup/nitrostack/` is `noindex,follow` at 453 words | Not a target as it stands | n/a |

## Findings

1. **CRITICAL: no funding-data page type for the site's core news pillar.** Queries 1 and 6 want round-by-round data. The funding tracker's rounds table is empty ("Rounds will appear here as we track them") while it describes itself as "Who raised, from whom. Every row links to its source." The header promises something the page doesn't deliver, which hurts trust. Fix: either fill the table with sourced rows (a few dozen real rounds) or hide the promise until it has data. Ship a dated weekly roundup ("Indian startup funding, week of 12-18 Oct 2026") with total, deal count, top 5 rounds and sources, on a fixed URL pattern with 301s.
2. **CRITICAL: major-company funding queries have no matching page.** The Swiggy profile contains one passing mention of funding, and its IPO details are only in prose. Fix: add a "Funding and IPO" section to profiles of listed or well-known companies (rounds table with date, round, amount, lead investors and source), or build a `/company/swiggy/funding/` page. Don't chase "swiggy funding" against Inc42 or Crunchbase unless you can add something they don't have, such as post-IPO financials, which is plausible.
3. **HIGH: competitor and alternatives blocks are thin.** Each alternative just says "See its own pricing page". Fix: add a comparison table (what it does, price model, scale, source) so the block can serve "X competitors".
4. **HIGH: trust-damaging byline inconsistency.** The home page shows "By Lovish Madaan" while articles carry "Ishaan Vardhan", described on About as a pen name of the desk. Two bylines with different disclosure levels reads as unclear authorship. Fix: use one policy, either the real named editor on every article or the pen name with the disclosure shown on every article (not only on About).
5. **HIGH: no clear single promise.** The About page lists seven pillars (founders, jobs, funding news, AI tools, which-AI-for-what, founder verification, AI news) plus calculators and events. The home H1 is "Today in Indian & US startups", but the nav and content also push jobs, tools, calculators and events. A new visitor can't say in one line what the site is for. This dilutes topical authority and trust (see "Site-level" below). Fix: choose one lead promise on the home (for example "Startup and AI news for India, with the jobs and tools to act on it"), demote the rest to secondary rows, and show the evidence of focus (counts of sourced rounds and verified jobs).
6. **MEDIUM: split calculator intent.** The tool page (213 words, WebApplication) and the guide (2,154 words, NewsArticle) target the same query. Fix: put the calculator widget at the top of the guide (or embed it) and add 400+ words, an FAQ and examples to the tool page, with a canonical decision on which URL is the primary one. Change the guide's schema from NewsArticle to Article or HowTo, since it is an evergreen explainer, not news.
7. **MEDIUM: startup profiles are mostly thin, which is deliberate.** `/startup/nitrostack/` is noindexed at 453 words, so most pricing-style queries cannot be won until profiles are enriched. Only rich profiles (such as Swiggy) can rank. Fix: prioritise research on the 20 listings with the most search demand; keep the noindex policy.
8. **MEDIUM: profile UX clutter above the fold.** The Swiggy page opens with a "0 X / 0 taps" meter, share buttons, and three photo credits before the answer. Zero-state widgets look empty and reduce trust. Fix: hide the meter until it has taps, and move the overview and pricing summary above the widget.
9. **LOW: images on profiles are Wikimedia incidental photos** (a delivery bike photo, a logo) rather than product screenshots, which weakens the media score. Fix: use product or UI screenshots where licence permits.
10. **LOW: sitemap hygiene.** `/sitemap_index.xml` returns the 404 template with an og:url of the sitemap path, so crawlers hitting the Yoast-style path see a soft-looking page. `/sitemap.xml` 301s correctly. Fix: 301 `/sitemap_index.xml` to `/wp-sitemap.xml`.

## Strengths
- The Paytm guide is a good model: official source, dated count, rounds, disclaimer of non-affiliation, update date.
- Strong editorial transparency pages (about, editorial and corrections policies), sourced content and clear "independent" statements.
- Depth is good on guides (1,800-2,600 words) and the schema is wide-ranging (Article, BreadcrumbList, WebApplication, CollectionPage, ItemList).

## Dimension scores (site-level, 100 points)
Page Type 9/15 (2 of 6 queries critical), Content Depth 11/15, UX Signals 9/15, Schema 10/15, Media 7/15, Authority 4/15 (young domain, double byline, `site:` search showed no indexed pages in this tool, so unverified), Freshness 8/10 (updated 15-19 Oct). Total about 58, adjusted to **52** for the empty promised data and the focus problem.

## Site-level: does a visitor understand the purpose, and does focus affect trust?
Partly. The home page reads as a news portal ("Today in Indian & US startups"), but the footprint (calculators, events, jobs board, a directory of tiny launches, AI tool lists, a founders quiz, a meter and a "launch" form) looks like several sites. For a visitor from search, each landing page answers its own query reasonably, so the breadth doesn't block conversion. For Google and for investor or analyst personas, it dilutes trust: the funding tracker is empty, the byline differs between home and articles, and many profiles are thin. Recommendation: lead with startup and funding news (the pillar with a data advantage), put jobs and tools as clearly labelled sections, and cut or hide features that show empty states.

## Personas (across pages)
- Founder (choosing tools or tracking funding): 60. Good AI-tools content, weak funding data.
- Job seeker: 74. Best-served persona (Paytm guide, calculators, official-source jobs).
- Investor or analyst: 32. No round data, no weekly totals, no company funding history.

## Limitations
Positions, SERP features (snippet, PAA, AI Overview) and Search Console data were not available. WebSearch returns summaries rather than ranked live Google results, and the `site:` query returned no hits from this domain, which I could not verify. Persona scores are judgements, not user testing. Only six queries sampled; page speed and mobile rendering were not measured. Nitrostack's pricing query was not searched.

Generate a PDF report? Use `/seo google report`. Related: `/seo schema` (guide schema type), `/seo content` (E-E-A-T and byline), `/seo page` (thin profiles).
