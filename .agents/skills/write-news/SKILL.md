---
name: write-news
description: Research and write 100Xfounder startup/funding news drafts from the site's content queue and upload them to WordPress as Pending review. Use when the owner says "write news", "/write-news", "clear the queue", or asks for funding/startup stories.
---

# /write-news

Writes startup and funding news for 100xfounder.com. It runs on the owner's Codex plan, not API credits. **Drafts are always uploaded as Pending review.** You never publish.

## Before you start
1. Read `AGENTS.md` (rules) and `docs/STYLE_GUIDE.md` (how we write).
2. Check that these environment variables exist. If any are missing, stop and ask the owner to set them:
   - `XF_SITE_URL`, e.g. `https://100xfounder.com` or `http://localhost:8080`
   - `XF_WP_USER`, a WordPress user with the **Author** role
   - `XF_WP_APP_PASSWORD`, created in WordPress → Users → Profile → Application Passwords
3. Run the helper in `.Codex/skills/write-news/xf.sh`, for example `bash .Codex/skills/write-news/xf.sh queue news 3`.

> **If the `100xfounder` MCP server is connected** (see `docs/MCP.md`), use its tools instead of `xf.sh`: `list_queue`, `recent_posts`, `list_categories`, then `create_draft` with the same payload. Everything below still applies.

## Steps
1. **Pick topics.**
   - Run `xf.sh queue news N` (default N=3). If the owner gave a topic, use that instead.
   - Run `xf.sh recent 3` and skip anything we already covered.
2. **Research each topic.**
   - Use web search and fetch. Start from the queue item's `source_urls`.
   - Prefer primary sources: company announcement, filing, investor post. Add at least one reputable report.
   - Keep a list for every source: `url`, `publisher`, `date` (YYYY-MM-DD) and the `claim` it supports.
   - **Never invent numbers, quotes or names.** If a fact can't be sourced, leave it out.
3. **Write.**
   - Follow the style guide: 350–700 words, our own words, an inverted-pyramid structure, and H2 subheads. Apply **Written for Google News and Discover** below.
   - End with a short "Why it matters" section.
   - Output HTML: `<p>`, `<h2>`, `<ul>` and `<blockquote>` only for real, sourced quotes.
   - Pick one category slug: `funding`, `startup-news`, `ai-news`, `fintech`, `ai-deeptech`, `ecommerce`, `consumer-d2c`, `saas`, `healthtech`, `ev-mobility`, `web3`, `spacetech`, `gaming`, `press-releases` or `reports`. Run `xf.sh categories` to list them.
4. **Self-check before upload.** Every item must hold:
   - Every figure and claim maps to a source in your list.
   - No sentence is copied from a source (paraphrase; quote only short, attributed lines).
   - The title is 55–70 characters, specific and not clickbait.
   - The excerpt is 140–160 characters.
   - The headline passes the News and Discover rules below, and there is a licensed lead image at least 1200px wide.
5. **Upload.** Write a JSON file and run `xf.sh draft file.json`. The payload:
   ```json
   {"type":"post","title":"…","excerpt":"…","content":"<p>…</p>","category":"funding","tags":["Zepto"],
    "sources":[{"url":"…","publisher":"…","date":"2026-10-04","claim":"Raised $X led by Y"}],
    "original_url":"…","image_url":"(required: licensed image ≥1200px wide, see Written for Google News and Discover)","image_credit":"…","queue_id":12}
   ```
   - **Funding rounds** also go on the tracker. Upload a second draft with `"type":"xf_round"` and these `fields`: `company`, `sector`, `round`, `lead_investor`, `amount_display`, `amount_usd` (a plain number, or leave it out if undisclosed), `country`, `announced` and `source_url`.
6. **Report** the edit links that come back, so the owner can review and publish them.

## Written for Google News and Discover
Neither surface can be bought or forced; Google picks stories from both automatically. What earns a place is the same in both: fast, original, clearly sourced news with an honest headline and a big picture. Hold every story to this:

- **Speed and freshness.** Write the story the day it breaks; a funding round is news for about 48 hours (that is also the window of our `news-sitemap.xml`). Never re-date an old story. If you update one, add an `<p><em>Updated DD Month YYYY: what changed.</em></p>` line at the top; only real changes count as an update.
- **Headline.** Plain and specific: who did what, with the number when there is one ("Zepto raises $450M at $7B valuation led by General Catalyst"). 55–70 characters, under 110 at most. Never withhold the point, exaggerate, or bait ("You won't believe…", "This startup just…", "Huge news"). Discover demotes those headlines and Google News treats them as a policy problem.
- **First two sentences carry the story.** Sentence one: who, what, how much, when, source. Sentence two: why it matters to a founder, investor or job seeker. Discover shows the first lines as the preview; a reader should get the news without clicking.
- **Add something an aggregator does not.** At least one of: the round in context (previous rounds, sector totals from our funding tracker), the India angle for a global story, what it means for hiring (link `/jobs/company/<slug>/` when the company is on our board), or the primary document itself. A rewrite of one outlet's article adds nothing and Google ranks the original.
- **One story per URL**, with a dateline and the publish time in the first paragraph's facts (e.g. "on Friday, 3 October").
- **A large picture, always.** Discover's large card needs an image at least 1200px wide; stories without one barely show up. Use the image rules in `content/BRIEF.md` (Wikimedia Commons or Openverse, 1600px `thumburl`, accepted licences only) or an official press kit that grants media use. No logos, screenshots of tweets or text-heavy graphics as the lead image. Set it as `image_url` with `image_credit`.
- **Attribute everything inline** ("according to its filing with the RoC", "the company told Inc42") and keep the Sources list. Trust signals are what get a small publisher into Top stories.
- **Topic focus.** Stay inside our categories. A site that covers Indian startups, funding and AI deeply is more likely to be shown for those topics than one that also chases celebrity or viral stories.

## Never
- Publish, or set any status other than pending (the API won't allow it anyway).
- Estimate net worth, revenue or valuations without a source.
- Use images you don't have the right to use.
