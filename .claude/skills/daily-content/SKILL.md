---
name: daily-content
description: The daily 100xfounder.com content routine. Finds what's trending in startups, AI, funding, jobs and careers (India and international), researches and writes 10 sourced articles with 5 openly licensed images each, and schedules them on the live site. Use when the owner says "/daily-content", "run the content routine", or the scheduled task fires.
---

# /daily-content

Runs once a day on the owner's Mac (scheduled task "100xfounder daily content"), on the owner's Claude plan. **Owner decision, 4 Oct 2026: this routine publishes without a per-post review**, so the quality bar below is the review. Target 10 a day (owner, 4 Oct 2026). Never lower the bar to hit the count: publish fewer rather than weak ones.

## 0. Setup checks (stop and report if any fail)
- Working directory is the 100xfounder repo. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md` and `content/BRIEF.md` (the writing rules; follow every one).
- `XF_SITE_URL`, `XF_WP_USER`, `XF_WP_APP_PASSWORD` are set (in `~/.zshrc`; never print them). `curl -s -u "$XF_WP_USER:$XF_WP_APP_PASSWORD" "$XF_SITE_URL/wp-json/xf/v1/recent?days=14"` returns JSON.

## 1. Pick 10 topics (today's mix)
1. Get what we already published: `xf/v1/recent?days=30` plus `ls content/drafts/`. Never repeat a topic or angle.
2. Find what's trending in the last 48 hours with WebSearch: Indian startup funding and IPOs (Inc42, Entrackr, Economic Times, Mint, Moneycontrol), global AI and startup news (TechCrunch, The Verge, Reuters, Sifted, BetaKit), AI model/tool launches (official vendor blogs), tech hiring and layoffs, and visa/tax/salary changes. **Never use ANI or sites that republish ANI.**
3. Choose by search demand and fit, spread across all lanes (about 3 news analysis, 3 AI tools, 2 careers & salary, 2 founder story / how-to). Also work through the unwritten topics in `content/PLAN.md` (phase 2 and 3 batches) before inventing new evergreen ones:
   - **News analysis**: the biggest sourced story of the day, written as an explainer with context, not a rewrite.
   - **AI tools / "which AI for what"** (global traffic).
   - **Careers & salary** (India or international: visas, pay, hiring at a company on our jobs board, an apply guide).
   - **Founder story or startup how-to** (evergreen).
4. Prefer topics that link naturally to our own pages (jobs board, a company page, a calculator, the funding tracker).

## 2. Research and write each article
Write them with at most 3 writer agents at a time (Agent tool, run_in_background), each taking 3–4 topics and this brief; wait for them, then start the rest. Never more than 3 at once (owner's credit limit).
Follow `content/BRIEF.md` exactly: 1,800–2,500 words (news analysis may be 900–1,400 if the story doesn't support more; never pad), Key takeaways, FAQ, a Sources list like news sites, inline attribution, at least 8 fetched sources, 5 openly licensed images (Wikimedia Commons / Openverse; PD, CC0, CC BY, CC BY-SA only) with markers `<!-- xf-image-2..5 -->`, 2–5 internal links. Save each to `content/drafts/daily-YYYYMMDD-<slug>.json`.

## 3. Self-review (the gate; a failed article is not uploaded)
For each file check, and fix or drop:
- Every number, date, quote and name maps to a source in `sources` that you actually fetched. No invented figures, no net-worth estimates.
- No sentence copied from a source. No ANI.
- Images: 5, licences allowed, credits and source pages present, markers 2–5 present once.
- Word count, title 55–70 chars, excerpt 140–160 chars, valid JSON (`python3 -m json.tool`).
- Would a careful editor at a good news site publish this as is? If not, drop it.

## 4. Schedule on the live site
`python3 content/upload.py --per-day 10 --start <tomorrow> content/drafts/daily-YYYYMMDD-*.json`
It spreads the 10 posts from 07:00 to 22:30 IST. The site sends each to IndexNow and the news sitemap when it goes live.

## 5. Report
Write `content/reports/YYYY-MM-DD.md`: topics chosen and why, titles, scheduled times, URLs, anything dropped and why. Commit the drafts and report on the working branch (`git add content && git commit`), and push.
