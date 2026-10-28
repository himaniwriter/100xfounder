---
name: write-news
description: Research and write 100Xfounder startup/funding news drafts from the site's content queue and upload them to WordPress as Pending review. Use when the owner says "write news", "/write-news", "clear the queue", or asks for funding/startup stories.
---

# /write-news

Write startup and funding news for 100xfounder.com and upload each as a **Pending review** draft. Runs on the owner's Claude plan, not API credits. **You never publish** — the API only accepts pending, and so do you.

## Setup
- Read `CLAUDE.md` (rules) and `docs/STYLE_GUIDE.md` (how we write) before writing.
- The helper `.claude/skills/write-news/xf.sh` needs `XF_SITE_URL`, `XF_WP_USER` (an **Author**), and `XF_WP_APP_PASSWORD` (WordPress → Users → Profile → Application Passwords). If any is unset, stop and ask the owner — never print the values.
- **If the `100xfounder` MCP server is connected** (`docs/MCP.md`), use its tools (`list_queue`, `recent_posts`, `list_categories`, `create_draft`) instead of `xf.sh`, with the same payload. Everything below still applies.

## Workflow
1. **Pick topics.** `xf.sh queue news N` (default N=3), or the owner's topic. Run `xf.sh recent 3` and skip anything already covered.
2. **Research.** Start from the queue item's `source_urls`; use web search and fetch. Prefer primary sources (company announcement, filing, investor post) plus at least one reputable report. For every source keep `url`, `publisher`, `date` (YYYY-MM-DD) and the `claim` it supports. **Never invent numbers, quotes or names; if a fact can't be sourced, leave it out.** Summarise in our own words — never republish another outlet's article.
3. **Write.** 500–900 words, inverted pyramid, our own words, sentence-case H2 subheads, ending in a short "Why it matters". Follow **Google News and Discover** below. Output HTML using only `<p>`, `<h2>`, `<ul>`, `<blockquote>` (real, attributed quotes only), and one `<figure><img><figcaption>` for a credited in-body image. Pick one category slug from `xf.sh categories` (e.g. `funding`, `startup-news`, `ai-news`, `fintech`, `ai-deeptech`, `ecommerce`, `consumer-d2c`, `saas`, `healthtech`, `ev-mobility`, `web3`, `spacetech`, `gaming`, `press-releases`, `reports`).
4. **Self-check — every item must hold:** each figure/claim maps to a source in your list; nothing copied (paraphrase; short attributed quotes only); title 55–70 chars, specific, not clickbait; excerpt 140–160 chars; **at least 500 words and 2 images — a licensed featured image ≥1200px wide plus one credited openly-licensed in-body image** (`sources.php` blocks publication below either floor); headline passes the News/Discover rules.
5. **Upload.** Write a JSON file and run `xf.sh draft file.json`:
   ```json
   {"type":"post","title":"…","excerpt":"…","content":"<p>…</p>","category":"funding","tags":["Zepto"],
    "sources":[{"url":"…","publisher":"…","date":"2026-10-04","claim":"Raised $X led by Y"}],
    "original_url":"…","image_url":"(required: licensed image ≥1200px wide, see below)","image_credit":"…","queue_id":12}
   ```
   **Funding rounds** also get a second draft with `"type":"xf_round"` and `fields`: `company`, `sector`, `round`, `lead_investor`, `amount_display`, `amount_usd` (plain number, omit if undisclosed), `country`, `announced`, `source_url`.
6. **Report** the edit links that come back so the owner can review and publish.

## Google News and Discover
Google picks stories automatically; neither surface can be forced. Earn a place with fast, original, clearly sourced news, an honest headline and a big picture:

- **Freshness.** Write the day it breaks; a funding round is news for ~48 hours (our `news-sitemap.xml` window). Never re-date an old story. A real update gets a top line `<p><em>Updated DD Month YYYY: what changed.</em></p>`.
- **Headline.** Who did what, with the number ("Zepto raises $450M at $7B valuation led by General Catalyst"). 55–70 chars, 110 max. No withholding, exaggeration or bait ("You won't believe…", "Huge news") — Discover demotes these and News treats them as a policy problem.
- **First two sentences carry the story.** S1: who, what, how much, when, source. S2: why it matters to a founder, investor or job seeker. Discover previews these lines; the reader should get the news without clicking.
- **Add what an aggregator can't:** the round in context (prior rounds, sector totals from our funding tracker), the India angle on a global story, the hiring implication (link `/jobs/company/<slug>/` if the company is on our board), or the primary document. A single-outlet rewrite adds nothing and ranks below the original.
- **One story per URL,** with a dateline and publish time in the first paragraph ("on Friday, 3 October").
- **Always a large picture, ≥1200px wide** (Discover's large card). Use the image rules in `content/BRIEF.md` (Wikimedia Commons or Openverse, 1600px `thumburl`, accepted licences only) or an official press kit granting media use. No logos, tweet screenshots or text graphics as the lead. Set `image_url` + `image_credit`. A news post needs **2 images** to go live (owner, 2026-10-15): this featured image plus one credited openly-licensed image embedded in the body.
- **Attribute inline** ("according to its RoC filing", "the company told Inc42") and keep the Sources list.
- **Stay inside our categories** — Indian startups, funding and AI, not celebrity or viral filler.

## Never
- Publish or set any status other than pending.
- State net worth, revenue or valuation without a dated source.
- Use images you don't have the right to use.

## URLs
Slugs are 2–6 words, keyword first, and **never contain a year** (owner, 7 Oct 2026) — the address must stay valid next year; put the year in the title if it helps. Event pages are the only exception (the edition year is part of the name).
