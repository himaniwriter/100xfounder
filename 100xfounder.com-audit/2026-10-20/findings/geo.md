# GEO / AI search readiness: 100xfounder.com (2026-10-20)

**GEO score: 66 / 100**

| Dimension | Weight | Score |
|---|---|---|
| Citability | 25% | 68 |
| Structural readability | 20% | 78 |
| Multi-modal | 15% | 62 |
| Authority and brand | 20% | 42 |
| Technical accessibility | 20% | 85 |

Method: live fetches with curl on 2026-10-20, 5 articles and 5 startup profiles analysed from `<main>` HTML. Samples: best-ai-coding-reddit, dailyobjects-series-c-funding, indiaai-mission-startups, how-to-get-a-job-at-openai, new-vs-old-tax-regime; /startup/thinking-orbs, pass-designer, qarunbook, sellio, capybara-court. The site-wide Product schema was deliberately not assessed (owner decision).

## AI crawler access
robots.txt has only `User-agent: *` rules (blocks wp-admin, search, /jobs/*?, per-post feeds, ?replytocom, ?preview). No AI bot is named, so all are allowed by default.
- Allowed: GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, CCBot, anthropic-ai, cohere-ai.
- curl with GPTBot, ClaudeBot and PerplexityBot UAs returns HTTP 200 (no UA-based blocking at origin; a CDN/WAF bot challenge for real crawler IPs was not testable).
- Pages are server-rendered or static Astro HTML, so content is visible without JS.
- Sitemaps: wp-sitemap.xml and news-sitemap.xml are listed.

## llms.txt
Present and well formed: H1, blockquote summary, sectioned lists with descriptions (events, news, ~40 articles, startups, jobs, tools, about, policies, sitemaps). Good.

## Findings

### F1 (High) No explicit Organization identity beyond Instagram
Evidence: Organization JSON-LD on home has `sameAs` of one URL (instagram.com/100x.founder). Author page also lists only Instagram. No LinkedIn, X, YouTube, GitHub, Crunchbase, Wikidata. LinkedIn /company/100xfounder returned 999 (inconclusive); Wikipedia page 404.
Fix: create and link LinkedIn company page, YouTube channel, X, and a Wikidata item; add all to Organization `sameAs`. Effort: 2-3 h.

### F2 (High) Weak off-site brand footprint
Evidence: searches for "100xFounder" and "100xfounder.com" returned no usable third-party results (Bing and DDG HTML were blocked or irrelevant; YouTube results showed only the generic phrase "100x founder", not the brand). Reddit could not be fetched. Treat as unverified, but no mentions were found. Brand mentions (YouTube about 0.74 correlation, Reddit, Wikipedia) outweigh backlinks for AI citation.
Fix: start a YouTube channel with short explainers of the best articles; answer questions in r/developersIndia, r/StartUpIndia, r/indianstartups with real value (not link drops); get listed in Product Hunt, Crunchbase-style and Indian startup directories; run the founder-outreach pillar to earn founder-shared links. Effort: ongoing, 3-5 h/week.

### F3 (High) Passages are not answer-first and are too short to be extracted whole
Evidence: first body paragraph in articles is the meta-description-style dek ("We read 12 Reddit threads..."), not a direct answer. Average paragraph 34-54 words; only 0-2 paragraphs per article fall in the 100-200 word range (target 134-167). Startup profiles average 26-30 words per paragraph, 0-1 in range. 4 of 5 startup profiles open with only a one-line tagline.
Fix: under every H2, open with a 40-60 word direct answer, followed by a 134-167 word self-contained block with a named source and a number. Start startup profiles with a 2-sentence "X is a ... for ... priced at ..." definition. Effort: template change for profiles, 20 min per article for top 20.

### F4 (Medium) Question headings underused
Evidence: 4-6 question-style H2/H3 of 18-23 headings per article; 2 of 15 on profiles.
Fix: phrase headings as the queries people ask ("Which AI is best for UPSC prep?", "How much does X cost in India?"). Effort: low.

### F5 (Medium) Inconsistent author entity
Evidence: byline "Ishaan Vardhan" appears on 4 of 5 articles but not on indiaai-mission-startups; Person schema present. Pen name is disclosed on the author page (good, honest). Startup profiles show no author or reviewed-by or last-updated date.
Fix: add byline plus visible "Updated" date on every article and profile; add `dateModified` to profile schema; link the Organization (editorial policy, corrections policy) from the Person `worksFor`. Effort: 1 h in theme.

### F6 (Medium) Startup profiles: schema good, media thin on some
Evidence: SoftwareApplication, BreadcrumbList, FAQ and 2 tables present on all 5; pass-designer has only 1 image; only capybara-court has a VideoObject. No ratings are fabricated (correct per owner rule).
Fix: require 2+ images (already a rule) and add a product demo video or embed where the founder supplies one. Effort: low.

### F7 (Medium) Articles: strong structure, source attribution present
Evidence: 2,200-2,900 words, 1-2 tables, 9-13 images, lists, FAQ, 9-10 external source links each, NewsArticle schema. Strength: quotable figures with sources (e.g. IndiaAI GPU rate, Blue Card floor in llms.txt). Gap: no video/infographic content; tables are present on 4/5 (the OpenAI guide has none).
Fix: add one comparison table per guide and a short YouTube explainer embed for top 10 pages. Effort: medium.

### F8 (Low) llms.txt hygiene
Evidence: descriptions are page meta text, with HTML entities left raw ("F&#038;O", "&#8217;", "&#039;"), and one link uses `/?p=754` instead of the canonical slug. Lists only ~40 articles and no startup profiles or tool pages by name.
Fix: decode entities and use canonical URLs in the generator; add a "Best AI tools by job" section pointing to the pillar pages. Effort: 30 min.

### F9 (Low) No RSL 1.0 licensing statement
Evidence: no RSL file or reference found. Fix: optional; publish a short AI-use policy and RSL file if you want to signal terms. Effort: 30 min.

## Platform-specific scores
- Google AI Overviews: 70. Indexable, structured, FAQ and tables, sourced facts. Improve answer-first blocks and freshness dates.
- ChatGPT: 55. Crawlable and llms.txt present, but low off-site mentions (Reddit, YouTube, Wikipedia) limit selection.
- Perplexity: 68. Fresh, cited, Reddit-summary style articles fit it well; add direct-answer blocks and visible dates.
- Bing Copilot: 62. Add Bing Webmaster Tools and IndexNow (already used); build LinkedIn presence.

## Top 5 changes
1. Add answer-first 40-60 word openers and 134-167 word blocks (F3), 1 day for top 20 pages.
2. Build sameAs entities: LinkedIn, YouTube, X, Wikidata (F1), 3 h.
3. Start YouTube and Reddit presence (F2), ongoing.
4. Author byline and visible updated date everywhere, including profiles (F5), 1 h.
5. Clean llms.txt entities and canonical URLs, add startups and tools (F8), 30 min.

## Not checked
Real-time ChatGPT/Perplexity citation tests and backlink counts (no DataForSEO or working search access); CDN-level bot blocking for genuine crawler IPs.
