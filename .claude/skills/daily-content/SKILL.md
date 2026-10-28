---
name: daily-content
description: The daily 100xfounder.com content routine. Finds what's trending in startups, AI, funding, jobs and careers (India and international), researches and writes 10 sourced articles with 5 openly licensed images each, and schedules them on the live site. Use when the owner says "/daily-content", "run the content routine", or the scheduled task fires.
---

# /daily-content

Runs once a day on the owner's Mac (scheduled task "100xfounder daily content"), on the owner's Claude plan.

**This routine publishes without a per-post human review** (owner, 4 Oct 2026), so the step 3 self-review gate *is* the review — treat it as the line a careful editor would hold. Target 10 articles, but never trade quality for count: publish fewer rather than weak ones. Anything about a founder-verification item or a private person is out of scope here and still needs the owner's review.

## 0. Setup (stop and report if either fails)
- You are in the 100xfounder repo. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md` and `content/BRIEF.md`, and follow every rule in them.
- `XF_SITE_URL`, `XF_WP_USER`, `XF_WP_APP_PASSWORD` are set (from `~/.zshrc`; never print their values). Confirm the API works: `curl -s -u "$XF_WP_USER:$XF_WP_APP_PASSWORD" "$XF_SITE_URL/wp-json/xf/v1/recent?days=14"` returns JSON.

## 1. Pick 10 topics
Avoid repeats: check `xf/v1/recent?days=30` and `ls content/drafts/`; never reuse a topic or angle. Work through the unwritten topics in `content/PLAN.md` (phase 2 and 3) before inventing new evergreen ones.

Use WebSearch for the last 48 hours — Indian startup funding/IPOs (Inc42, Entrackr, Economic Times, Mint, Moneycontrol), global AI and startup news (TechCrunch, The Verge, Reuters, Sifted, BetaKit), AI model/tool launches (official vendor blogs), tech hiring and layoffs, visa/tax/salary changes. **Never use ANI (aninews.in, ani.in) or sites that republish ANI.**

Choose by search demand and fit, spread across lanes (roughly 3 news analysis, 3 AI tools, 2 careers & salary, 2 founder story / how-to), and prefer topics that link naturally to our own pages (jobs board, a company page, a calculator, the funding tracker):
- **News analysis** — the day's biggest sourced story, as an explainer with context, not a rewrite.
- **AI tools / "which AI for what"** (global traffic).
- **Careers & salary** — India or international: visas, pay, hiring at a company on our jobs board, an apply guide.
- **Founder story or startup how-to** (evergreen).

## 2. Research and write
Dispatch writer agents with the Agent tool (`run_in_background`), **at most 3 at a time** (owner's credit limit), each handling 3–4 topics. Wait for a batch before starting the next.

Each agent follows `content/BRIEF.md` exactly. In short: 1,800–2,500 words (news analysis may run 900–1,400 if the story won't support more — never pad); Key takeaways, an FAQ, and a Sources list with inline attribution; at least 8 sources you actually fetched; exactly 5 openly licensed images (Wikimedia Commons / Openverse; PD, CC0, CC BY, CC BY-SA only) with credits and source pages, the first as featured image and markers `<!-- xf-image-2 -->`…`<!-- xf-image-5 -->` for the rest; 2–5 internal links. Save each as `content/drafts/daily-YYYYMMDD-<slug>.json`.

## 3. Self-review gate (a failing article is not uploaded)
For each file, fix it or drop it:
- Every number, date, quote and name maps to a source in `sources` you actually fetched. No invented figures, no net-worth/valuation/revenue estimates.
- No sentence copied from a source. No ANI anywhere.
- Images: exactly 5, licences allowed, credits and source pages present, markers 2–5 each present once.
- Word count in range, title 55–70 chars, excerpt 140–160 chars, valid JSON (`python3 -m json.tool`).
- Would a careful editor at a good news site publish this as is? If not, drop it.

## 4. Schedule on the live site
```
python3 content/upload_rest.py --per-day 4 content/drafts/daily-YYYYMMDD-*.json
```
Pace (owner, 6 Oct 2026): **four posts a day at random times between 07:00 and 22:30 IST, at least 90 minutes apart** (the script picks the times). Never bulk-publish in a spike. New drafts join the end of the existing queue; the site sends each to IndexNow and the news sitemap when it goes live.

`upload_rest.py` uses only WordPress's built-in REST API plus `/xf/v1/drafts`, so it works whether or not the latest plugin is deployed: it continues after already-queued posts, uploads each image to the media library, and pauses between posts for Wikimedia's rate limit. `content/upload.py` is the alternative once the 2026-10-04 plugin release is live.

For breaking news (a funding round, acquisition, IPO), move the draft to the front so it goes out while still news:
```
python3 content/reschedule.py --first <part-of-file-name>
```

## 5. Report and commit
Write `content/reports/YYYY-MM-DD.md`: topics chosen and why, titles, scheduled times, URLs, and anything dropped and why. Then `git add content && git commit` on the working branch and push.

## URLs
Every slug is 2–6 words, keyword first, and **never contains a year** (owner, 7 Oct 2026) — the address must still be valid next year; put the year in the title instead if it helps. Event pages are the only exception, since the edition year is part of the event's name.
