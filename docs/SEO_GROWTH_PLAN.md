# 100xFounder: 90-Day Growth & SEO Plan

_Last updated: 2026-10-04. Search volumes below are rough estimates for the US and global markets. Verify them in Google Keyword Planner, the Ahrefs free keyword tool, or Search Console once it's connected, before committing content to them._

## 1. Fix the SEO liabilities first

The repo's own reports show problems that will hold back any new content:

- **2,271 indexable pages have fewer than 500 words** (`reports/low-content-pages-under-500.csv`). They break down as:
  - 1,140 under `/companies/*`
  - 1,031 under `/founders/*`
  - 50 under `/countries/*`
  - 1,211 of these pages have **fewer than 100 words**
- Under Google's helpful-content and scaled-content policies, a large share of thin pages lowers rankings for the whole domain.
- **Don't publish the existing 1,200-keyword map as it stands** (`100xfounder_keyword_pillar_internal_link_map_1200.csv`). It is mostly near-duplicate variants of the same query, e.g. "startup ai tools checklist", "…checklist 2026", "…checklist 2027", "…for beginners". Each claims about 1,500 searches a month, which is not plausible. Those pages would compete with each other and read as scaled content.

**Actions (week 1):**
- Set `noindex` on company and founder pages until each has a minimum amount of real content: tagline, description, category, links, and founder or funding data.
- Keep the 1,258 startup listings visible on the site, but only let rich listings into the sitemap.
- Consolidate `/founders/*` into the company page with 301 redirects, so there is one strong page per startup instead of two thin ones.
- Connect Google Search Console. Submit a clean sitemap and use the "Pages" report to track recovery.

## 2. Keyword targets, ranked by ease × value

### Tier A: Founder-intent "where to launch" keywords (the money keywords)
These searchers are the customers who pay for fast-track and featured listings. Competition is moderate: mostly blog listicles and other directories, and few strong domains.

| Keyword (examples) | Est. monthly searches | Difficulty | Page |
|---|---|---|---|
| startup directories / startup directory list | 1k–3k | Medium | `/blog/startup-directories` (100+ list, kept updated) |
| where to submit my startup / submit startup free | 500–1.5k | Low–Med | same list + `/submit` |
| product hunt alternatives | 1k–2k | Medium | `/blog/product-hunt-alternatives` |
| betalist alternatives, launch platforms for startups | 200–600 | Low | comparison pages |
| how to launch a startup on product hunt | 500–1k | Medium | guide |
| startup launch checklist | 300–800 | Low–Med | guide + downloadable template |
| how to get first 100 users / customers | 1k–3k | Medium | guide |
| free backlinks for startups / saas directories list | 300–1k | Low–Med | list post |

### Tier B: Programmatic directory pages (the volume engine, built on the existing `/startups/*` routes)
Each page gets little traffic, but there are thousands of them. Only publish a page when it has at least about 8 real listings plus a written intro.

| Pattern | Example | Notes |
|---|---|---|
| best {category} startups {year} | best AI agent startups 2026 | Low KD for specific niches; avoid broad "AI startups" |
| {category} startups in {city} | fintech startups in Bangalore / Austin | City+category combos are low competition (the routes exist: `industry`, `location`) |
| {startup} alternatives / competitors | Notion alternatives | AlternativeTo model; strongest long-tail play, needs rich listings |
| startups using {tech} | startups using Supabase | Uses the existing `techStack` field |
| startups hiring {role} / remote | remote AI startups hiring | Feeds the jobs board (`/startups/jobs/*`) |
| recently funded {category} startups | seed funded climate startups 2026 | Uses existing funding data |

### Tier C: Free tools (link magnets; higher difficulty, but tools earn backlinks)
- SAFE / convertible note calculator and equity dilution calculator (a few thousand searches a month each, medium KD)
- Startup runway / burn rate calculator
- Startup name and domain checker
- Pitch deck examples gallery (high volume, high KD, but it fits the directory)

Build one tool per month. Each one earns links that lift every directory page.

## 3. 90-day projection (realistic, not hockey-stick)

SEO takes 3–6 months to compound on a domain that is recovering from thin content. For the first 90 days, most traffic comes from distribution: founders share their own launches, and other directories link to us.

| | Month 1 | Month 2 | Month 3 |
|---|---|---|---|
| Focus | Relaunch, pruning, Search Console, 5 Tier-A posts, outreach to founders | Weekly launch cohorts, badge program, 50 programmatic pages, first tool | 150+ programmatic pages, second tool, newsletter sponsors |
| Monthly visits | 500–1.5k | 2k–5k | 5k–12k |
| Organic share | ~20% | ~35% | ~50% |
| New submissions | 40–100 | 100–200 | 200–400 |
| Newsletter subs | 100–300 | 300–800 | 800–2k |
| Paid listings | 3–10 | 10–25 | 20–50 |
| Revenue (USD/mo) | $100–400 | $400–1.2k | $1k–3k |

**What moves these numbers:**
- **Founder self-promotion:** each weekly cohort of about 25 launches gets shared by the founders. This is the biggest early traffic source.
- **The "Featured on 100xFounder" badge:** about 20–40% of launched startups embed it, which brings dofollow backlinks every week.
- **Getting onto other directory lists:** almost every "startup directories list" article accepts additions. Pitch 30–50 of them in month 1.
- **Community distribution:** Indie Hackers, r/SideProject, r/startups (follow each community's rules), X and LinkedIn launch threads, and tagging founders.

## 4. Weekly operating rhythm

- **Mon:** publish the launch cohort, then send the newsletter "This week's 100x launches"
- **Tue/Thu:** one Tier-A or Tier-B content piece
- **Wed:** outreach to 20 founders and 10 directory/list owners
- **Fri:** review Search Console (impressions, rising queries, pages to enrich); look for new keywords where we already get impressions
- **Monthly:** ship one free tool; prune or enrich the pages with the lowest engagement

## 5. KPIs to track

- Indexed pages vs. submitted (Search Console)
- Impressions and clicks on Tier-A keywords
- Submissions per week and free → paid conversion rate (target 5–10%)
- Badge embeds (referring domains)
- Newsletter subscribers and open rate
