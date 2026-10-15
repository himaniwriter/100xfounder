# 100xfounder.com: SEO action plan (12 Oct 2026)

Sources: findings/technical.md (score ~74), findings/content.md (content ~66, E-E-A-T weak on Experience), findings/schema-geo.md (GEO ~62), plus Search Console crawl stats and sitemaps.

**Why pages aren't indexed:** no hard block. Google cut crawling after the old host's outage (30 Jul–8 Aug, up to 100% connection failures) and the domain still carries the old site's 4,600 low-quality URLs. Today about 1,200 of ~1,470 sitemap URLs are near-template job and landing pages against 35 articles, so Google's small daily crawl goes mostly to copied job text. The site has almost no links pointing to it.

## Already done (12 Oct)
- 112 duplicate /industry/ pages: noindex and out of sitemap (fewer than 3 startups)
- Plugin re-activated after the deploy outage; sitemaps and robots restored
- Event schema: ticket/registration offer on every event; ended events drop Event markup
- Startup profiles: duplicate Organization block removed
- /llms.txt lists articles, guides, startups, about, author
- Author page: pen-name bio + ProfilePage/Person schema
- Education article: hidden agencies no longer leak via sources; byline set to Ishaan Vardhan

## Phase 1: Unblock indexing (this week)
1. **Noindex + drop from sitemap** job landing pages with < 10 jobs and company job pages with < 5 jobs (includes/seo.php landing sitemap, jobs.php).
2. **Jobs out of the main crawl path:** keep JobPosting markup, but noindex job pages older than 30 days or without a real closing date; emit `validThrough` only when the feed gives one (jobs.php ~623).
3. **Job titles/meta** from structured fields ("Role at Company, City"), ≤ 60 chars, not scraped text.
4. **Homepage `<title>`**: "100xFounder: Startup news, funding, jobs and AI tools in India".
5. **Link every article:** /blog/ with full pagination; "Latest guides" block on the homepage (5 orphan posts today).
6. **Search Console:** remove the 3 old-site sitemaps (sitemap-pages.xml, ai-sitemap-news.xml, sitemap-posts.xml); request indexing daily for the top 10: /, /about/, /editorial-policy/, indian-startup-funding-q3-deal-count-falls, amd-world-labs-acquisition-fei-fei-li, upcoming-indian-startup-ipos, best-ai-for-coding, model-context-protocol-mcp-explained, in-hand-salary-from-ctc, how-to-get-a-job-at-openai.
7. **Restart daily publishing** (4/day) now the app password works.
8. Fix IndexNow key file (indexnow.txt 404 → confirm real key URL).

## Phase 2: Quality and trust (weeks 2–3)
1. Rewrite **/about/** (145 words) and **/editorial-policy/** (172 words): who runs the site, how AI is used, how money is made; fix /advertising-disclosure/ 404.
2. "How we tested / how we compiled this" box on every "best AI" article; dated screenshots where we actually tried the tool.
3. Merge overlapping "best AI tools" lists (free / startups / students) into one hub + distinct sub-pages.
4. One URL pattern for apply guides (301 the other); vary the template by company.
5. Trim the Semrush review (~11k words) to ~3.5k with a TL;DR and visible affiliate disclosure.
6. Shorten titles to ≤ 60 chars; add in-body links between related articles.
7. Schema: Organization sameAs (LinkedIn/X once the owner gives the links); venue addresses on events where known; llms.txt done.
8. Optional, owner's call: Gurugram/Noida jobs `addressRegion` Haryana/UP while the visible label stays "Delhi NCR".

## Phase 3: Authority and focus (month 2)
1. Focus publishing on two clusters: Indian startup funding news + AI-tool recommendations for India; pause new calculators and apply guides.
2. Links from crawled sites: Digihandler site, LinkedIn/X profiles, Product Hunt, startup directories, founder outreach (every featured founder gets the article).
3. Original data: monthly funding round-up from our own tracker (citable, earns links).
4. Expand researched startup profiles (14 queued + 30 newer).
5. Monitor weekly: crawl requests/day, indexed pages, impressions; re-audit in 4 weeks.

**How we'll know it's working:** crawl requests rise from ~5/day to 50+/day within 2–3 weeks, and indexed pages climb past 30 (all articles) within a month.
