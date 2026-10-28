---
name: write-apply-guide
description: Research and write a sourced "How to apply at {company}" guide for 100xfounder.com and upload it to WordPress as Pending review. Use when the owner says "/write-apply-guide", "write an apply guide for X", or asks for hiring-process / interview guides for companies on the jobs board.
---

# /write-apply-guide

Writes evergreen "How to apply at {company}" guides (pillar 2: Jobs in India) on the owner's Claude plan (no API credits). **Always upload as Pending review — never publish.**

## Setup
- Read `CLAUDE.md` and `docs/STYLE_GUIDE.md` first.
- Needs env vars `XF_SITE_URL`, `XF_WP_USER` (Author role), `XF_WP_APP_PASSWORD`. If any is missing, stop and ask the owner.
- Upload helper: `bash .claude/skills/write-news/xf.sh`.
- **If the `100xfounder` MCP server is connected** (`docs/MCP.md`), prefer its tools over `xf.sh`: `list_queue`, `recent_posts`, `list_categories`, then `create_draft` with the payload below.

## Steps

1. **Pick the company.** Use the one the owner named, else `xf.sh queue apply-guide 3` and take the top item. It should already be on the jobs board (`/jobs/company/{slug}/`); use that slug as `company_slug` so live roles show.

2. **Research** with web search/fetch. Sources, in priority order:
   - The company's own careers site, "how we hire" pages, engineering/culture blog, and current job posts.
   - Interviews with the company's recruiters or leaders in reputable outlets.
   - Candidate reports (Glassdoor, AmbitionBox, LeetCode Discuss) **only** for interview format, and always labelled as candidate reports, never stated as fact.
   Keep a source list of `url`, `publisher`, `date` (YYYY-MM-DD), `claim`. **Never invent** rounds, timelines, salaries, questions or names — if unsourced, leave it out or say it varies.

3. **Write** 900–1,500 words of HTML in our own words (`<p>`, `<h2>`, `<h3>`, `<ul>`, `<ol>`). Suggested H2s: What {company} looks for; The hiring process (`<ol>` of stages, each with what happens and how long, where sourced); Interview rounds by role (only roles you can source); How to stand out (specific, practical); Referrals, timelines and offers; FAQs (3–5 short Q&As).
   - Title: `How to Get a Job at {Company} in {Year}: Process, Rounds & Tips` (aim 55–70 chars). Excerpt: 140–160 chars.

4. **Self-check.** Every claim maps to a source; candidate reports labelled as such; nothing copied; no hype or promises ("guaranteed", "insider secret"); not presented as official or company-affiliated.

5. **Upload** as a JSON file, then `xf.sh draft file.json`:
   ```json
   {"type":"xf_guide","title":"How to Get a Job at Razorpay in 2026: Process, Rounds & Tips",
    "excerpt":"…","content":"<p>…</p>",
    "fields":{"company_slug":"razorpay","hiring_for":"Engineering, Product, Sales",
              "process_length":"3–5 weeks","rounds":"4–5 rounds","careers_url":"https://razorpay.com/jobs/"},
    "sources":[{"url":"…","publisher":"Razorpay","date":"2026-09-01","claim":"Hiring stages"}],
    "queue_id":12}
   ```
   Fill `process_length` / `rounds` only if sourced; otherwise omit the field.

6. **Report** the edit link for the owner to review and publish.

## Never
- Publish, or claim the guide is official or company-endorsed.
- Share leaked interview questions or anything under NDA.
- Charge candidates, or link to paid "referral" services.
