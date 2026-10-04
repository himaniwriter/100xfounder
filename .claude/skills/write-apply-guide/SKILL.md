---
name: write-apply-guide
description: Research and write a sourced "How to apply at {company}" guide for 100xfounder.com and upload it to WordPress as Pending review. Use when the owner says "/write-apply-guide", "write an apply guide for X", or asks for hiring-process / interview guides for companies on the jobs board.
---

# /write-apply-guide

Writes evergreen "How to apply at {company}" guides (pillar 2: Jobs in India). Runs on the owner's Claude plan; no API credits. **Guides are always uploaded as Pending review.** You never publish.

## Before you start
1. Read `CLAUDE.md` (rules) and `docs/STYLE_GUIDE.md`.
2. Needs `XF_SITE_URL`, `XF_WP_USER` (Author role) and `XF_WP_APP_PASSWORD`. If any are missing, stop and ask the owner.
3. Uses the same helper as /write-news: `bash .claude/skills/write-news/xf.sh`.

## Steps
1. **Pick the company.**
   - If the owner named one, use it. Otherwise run `xf.sh queue apply-guide 3` and take the top item.
   - The company should already be on the jobs board (`/jobs/company/{slug}/`). Use that slug as `company_slug` so the guide shows the live roles.
2. **Research.** Use web search and fetch. Good sources, in order:
   - The company's own careers site, engineering/culture blog, official "how we hire" pages, and current job posts.
   - Interviews with the company's recruiters or leaders in reputable outlets.
   - Aggregated candidate reports (Glassdoor, AmbitionBox, LeetCode Discuss) **only** for interview format, and say they are candidate reports, never facts.
   - Keep a source list: `url`, `publisher`, `date` (YYYY-MM-DD) and the `claim` it supports.
   - **Never invent** rounds, timelines, salaries, questions or names. If you can't source it, leave it out or say it varies.
3. **Write** 900–1,500 words of HTML (`<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`). Our own words. Suggested H2s:
   - What {company} looks for
   - The hiring process (an `<ol>` of stages, each with what happens and how long, where sourced)
   - Interview rounds by role (Engineering, Product, etc. only where sourced)
   - How to stand out (practical, specific tips)
   - Referrals, timelines and offers
   - FAQs (3–5 short Q&As)
   Title format: `How to Get a Job at {Company} in {Year}: Process, Rounds & Tips` (55–70 chars where possible). Excerpt 140–160 chars.
4. **Self-check.** Every claim maps to a source; candidate reports are labelled as such; nothing copied; no promises ("guaranteed", "insider secret"); not presented as official or affiliated.
5. **Upload.** Write a JSON file and run `xf.sh draft file.json`:
   ```json
   {"type":"xf_guide","title":"How to Get a Job at Razorpay in 2026: Process, Rounds & Tips",
    "excerpt":"…","content":"<p>…</p>",
    "fields":{"company_slug":"razorpay","hiring_for":"Engineering, Product, Sales",
              "process_length":"3–5 weeks","rounds":"4–5 rounds","careers_url":"https://razorpay.com/jobs/"},
    "sources":[{"url":"…","publisher":"Razorpay","date":"2026-09-01","claim":"Hiring stages"}],
    "queue_id":12}
   ```
   Only fill `process_length` / `rounds` if sourced; otherwise omit the field.
6. **Report** the edit link so the owner can review and publish.

## Never
- Publish, or claim the guide is official or endorsed by the company.
- Share leaked interview questions or anything under NDA.
- Charge or ask candidates for money, or link to paid "referral" services.
