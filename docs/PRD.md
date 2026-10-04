# 100xFounder Content and SEO Platform: PRD

**Status:** Draft, awaiting owner approval
**Version:** 0.1 (2026-10-04)
**Platform:** WordPress on Hostinger with the `100xfounder` plugin. See `CLAUDE.md` for the standing rules.

---

## 1. Goals

| Goal | Measure (target at 6 months) |
|---|---|
| Organic traffic | 50k+ monthly visits from Google |
| AdSense approval, then revenue | Approved within 60 days of launch, with RPM tracked |
| Direct revenue | Paid listings, sponsored articles and affiliate clicks: first ₹50k/month |
| Trust (E-E-A-T) | Every founder or company article sourced; founder-verification rate 20%+ |
| Index health | 90%+ of submitted URLs indexed; zero manual actions |

**Audience:**
1. Indian job seekers in tech, AI and marketing.
2. Founders and startup watchers.
3. People looking for an AI tool for a specific task.

**Non-goals for v1:** user accounts for the public, comments, mobile apps, and languages other than English. Hindi pages are a possible v2.

## 2. Content principles

These apply to every pillar:

1. **Sourced or not published.** Each article about a person or company stores structured **sources**: URL, publisher, date and the claim each source supports. The sources show under the article as a "Sources" block and are reused in the founder-verification email (pillar 6).
2. **Human in the loop.** Automation finds, drafts and queues. A person reviews and publishes. Nothing about a real person goes live unreviewed.
3. **Unique value on every indexed page.** Thin pages stay `noindex` until they meet a minimum content bar for their page type, so they don't drag the site down in Google or with AdSense.
4. **Fast discovery, honestly.**
   - **Every type:** XML sitemaps, IndexNow (Bing, Yandex) and internal links from the homepage and hub pages within minutes of publishing.
   - **Jobs only:** Google's Indexing API, which Google allows only for job postings and livestreams.
   - Fast indexing is achievable, but nobody can guarantee a ranking.
5. **Clear labelling.** "Sponsored" and "Affiliate link" disclosures, with `rel="sponsored"` on those links.

## 3. Shared foundation (built first, used by every pillar)

| Component | What it does |
|---|---|
| **Editorial workflow** | Statuses: *Idea → Draft → In review → Published → Needs update*. Shows the assigned reviewer and a review checklist (sources present, facts checked, no thin content). Uses WordPress's built-in Pending/Draft plus a checklist panel. |
| **Sources system** | A meta box on every post type that holds a repeatable list of sources (URL, publisher, date, supported claim). It renders a "Sources" block with `citation` schema. Publishing a founder or company article with no sources is blocked. |
| **AI drafting assistant (optional)** | A "Draft with AI" button that turns the queued item plus its sources into a first draft. It writes in our own words, cites sources inline, and never fabricates figures. Runs on the Claude API using your API key, with a capped monthly budget, and drafts always land in review. |
| **Schema** | `NewsArticle`, `ProfilePage`/`Person`, `Organization`, `JobPosting`, `SoftwareApplication`, `ItemList`, `BreadcrumbList` and `FAQPage` (only where real Q&A exists). |
| **Indexing** | Core sitemaps, a Google News sitemap (last 48h), IndexNow ping on publish/update, the Google Indexing API for jobs, and auto-noindex of thin pages. |
| **E-E-A-T pages** | Author profiles with bios, plus Editorial Policy, Corrections Policy, Sources & Methodology and Advertise pages. AdSense already has About/Contact/Privacy/Terms/Disclaimer. |
| **Internal linking** | Hub pages for each pillar, "Related" blocks, breadcrumbs, and automatic links from company and founder names to their profile pages. |
| **Monetisation primitives** | A sponsored flag, an affiliate-link manager (cloaked `/go/slug` links with click counts), and AdSense slots in each template. |
| **Search Console and analytics** | Site verification meta, GA4 (or Clarity) snippet setting, and a dashboard tile for indexed/submitted counts. |

---

## 4. Pillar specs

### Pillar 1: Founders (Product Hunt founders, stories, news, sourced net worth)

**Pages:**
- `/founders/` hub (filter by industry and country)
- `/founder/{name}/` profile, a `ProfilePage` with `Person` schema
- `/founder/{name}/net-worth/`, only when a reliable source exists

**Profile contents:**
- name, photo (with consent), current role and company links
- bio and journey timeline
- startups (linked to `/startup/…`)
- funding history
- news mentions (auto-linked from our news posts)
- founder spotlight (existing)
- verification badge (pillar 6)
- sources block

**Data sources:**
- The Product Hunt daily import (existing) supplies the product.
- The **Product Hunt API hides maker names**, so the founder's identity comes from the spotlight form, the company's own about page, or manual research with sources.
- News mentions come from our own articles and the AI news tracker.

**Net-worth policy:**
- Only figures published by Forbes, Hurun, Bloomberg, company filings or reputable press, cited with date. Otherwise the section is hidden.
- Most Product Hunt founders have **no** public net worth, so net-worth pages will exist mainly for well-known founders. It's a high-search, high-risk topic, so the sourcing rule is strict.

**Automation:** each new Product Hunt launch creates a *founder stub* in the review queue (company and product only). It's published only once it has a name, a bio of 150+ words and at least 2 sources, or a published spotlight.

**SEO targets:**
- "{founder} net worth" and "{founder} biography" (well-known founders only)
- "who founded {product}"
- "{startup} founder"

**Acceptance criteria:**
- A profile can't be published without at least 2 sources.
- Net worth needs a cited source and an "as of" date.
- Thin profiles stay noindexed.

### Pillar 2: Jobs in India (marketing, AI, tech, big companies) and "how to apply" guides

**Pages:**
- `/jobs/` hub
- `/jobs/{role}-jobs-in-{city}/`, e.g. ai-engineer-jobs-in-bengaluru
- `/jobs/company/{company}/`
- `/job/{company}-{title}-{id}/` single job with `JobPosting` schema
- `/how-to-apply/{company}/` evergreen guide: hiring process, interview rounds, eligibility, salary ranges (sourced), tips, and the official careers link

**Job sources:**
- **Official only:** public ATS job-board feeds (Greenhouse, Lever, Ashby, SmartRecruiters, Workable, Recruitee).
- An admin adds a company with its ATS type and board ID, and jobs sync daily.
- A manual "Add job" form covers companies without a feed.
- **No scraping of LinkedIn, Naukri or Indeed.** Their terms forbid it, and Google penalises scraped job spam.

**Freshness:**
- Jobs expire automatically (`validThrough`).
- Expired jobs are removed, and Google is notified through the Indexing API (`URL_DELETED`).

**Discovery:** Google for Jobs via `JobPosting` schema and the Indexing API, which makes new jobs visible within hours.

**Filters:** role (marketing, AI/ML, engineering, product, design, data), city, remote, experience level and company.

**Monetisation:**
- AdSense
- featured job slots (paid)
- "How to apply" guides can carry course or resume-tool affiliates, disclosed

**SEO targets:**
- "{company} careers / how to apply"
- "{role} jobs in {city}"
- "{company} interview process"
- "{company} fresher hiring"

**Acceptance criteria:**
- Every job links to the official apply URL.
- Expired jobs are gone within 24h.
- City/role pages are noindexed below 5 live jobs.

### Pillar 3: Startup and funding news, innovative startups, paid listings, sponsored articles

**Builds on:** the existing news portal, directory and daily launches.

**New pages and flows:**
- `/submit-startup/` with free and paid tiers
- `/advertise/` with sponsored-article packages
- `/sponsored/` archive
- funding-round tags (Seed, Series A…)
- a weekly "Funding roundup" post

**Paid listing tiers (prices to confirm):**

| Tier | What you get |
|---|---|
| Free | Waits in a review queue; nofollow link |
| Fast-track | Reviewed in 48h; dofollow; included in the weekly newsletter or roundup |
| Featured | Pinned on the homepage, directory and category pages for 7 or 30 days |

**Sponsored article flow:**
1. The order form is filled in and payment taken.
2. The brief or draft goes through editorial review against quality and policy rules.
3. It's published with a **"Sponsored"** label, `rel="sponsored"` links and an author line of "Partner content".

**Payments:** see the open questions. Razorpay suits Indian buyers; Stripe or PayPal suit international ones.

**Acceptance criteria:**
- Paid items can't skip review.
- All sponsored content is labelled.
- Payment webhooks change status automatically.

### Pillar 4: AI tools that rank fast and actually work

*Interpretation needs your confirmation; see the open questions.* The proposal is **free, working tools hosted on our site**: people use them, they earn links, and long-tail tool keywords rank quickly.

**Initial set:**
- 6 that need no AI and have no running cost:
  - startup equity dilution calculator
  - SAFE/convertible calculator
  - in-hand salary calculator (India, new and old tax regime)
  - CTC to in-hand calculator
  - notice-period buyout calculator
  - startup name and domain checker
- 4 AI-powered, using a capped Claude API budget and rate limits:
  - LinkedIn headline generator
  - cold email / referral message writer
  - resume bullet improver
  - startup pitch one-liner generator

**"Must be working":** every tool has an automated test, run daily, plus uptime monitoring. A broken tool is hidden automatically and the admin is alerted.

**Pages:** `/tools/` hub and `/tools/{tool}/`. Each tool page has the tool, a how-to section, worked examples, a FAQ and `SoftwareApplication` schema.

**Acceptance criteria:**
- Tools load in under 2s on mobile.
- AI tools have abuse limits (per-IP rate limit, CAPTCHA after N uses) and a monthly cost cap.

### Pillar 5: "Which AI to use for what" (directory modelled on theresanaiforthat.com)

**Pages:**
- `/ai-tools/` hub
- `/ai/{tool}/` tool profile: what it does, pricing, best for, pros and cons, screenshots, a "verified working" date, and alternatives
- `/ai-for/{task}/` task pages, e.g. "AI for writing cover letters"
- `/ai/{tool}/alternatives/`
- `/best-ai-tools-for-{audience}/`

**Data:**
- The directory starts empty and grows from four sources: our own research, founder submissions (free and paid tiers, as in pillar 3), Product Hunt launches in AI topics (auto-suggested from the daily import), and affiliate partners.
- **We don't copy theresanaiforthat's data.** That breaches copyright and their terms.

**"Verified working":**
- A daily link and health check runs on every tool URL.
- Dead or parked domains are flagged and hidden.
- Each profile shows "Last checked {date}".

**Task taxonomy:** about 200 tasks to start, grouped into writing, image, video, audio, coding, marketing, productivity, education, business and so on. A task page is indexed only when it has 5+ tools.

**Monetisation:** affiliate links (disclosed, `rel="sponsored"`), featured placements, paid "verified" badge reviews, and AdSense.

**Acceptance criteria:**
- Each tool profile has 150+ words of our own copy plus structured fields.
- Alternatives are computed from shared tasks.
- Health checks run daily.

### Pillar 6: Founder verification outreach

**Trigger:** an article or profile about a founder or company is published (pillars 1 and 3).

**Flow:**
1. Find the founder or company email, using the existing contact discovery or a spotlight contact.
2. Send an email with the article link, a summary of each claim with its **source**, and two buttons: **"Looks right"** and **"Request a correction"**.
3. **Looks right:** the article gets a **"Verified by {founder}, {date}"** badge, which strengthens E-E-A-T.
4. **Request a correction:** the founder fills in a form (claim, correct information, proof link). It goes to the editor's queue, the editor publishes the correction, and an "Updated {date}" note goes on the article and in the public corrections log.
5. One reminder after 5 days, then stop. Unsubscribe and suppression are shared with the existing outreach.

**Admin:** a verification status column on every founder or company post (Not sent / Sent / Verified / Correction requested / Corrected).

**Acceptance criteria:**
- Every email lists sources.
- Corrections are applied only after review.
- The verified badge is never automatic without the founder's click.

### Pillar 7: AI news tracking with review

**Sources:** RSS and Atom feeds from AI labs, big tech, research and press:
- OpenAI, Anthropic, Google, DeepMind, Meta AI, Microsoft, NVIDIA and Hugging Face blogs
- TechCrunch AI, The Verge AI, VentureBeat AI, Inc42, YourStory, ET Tech and MeitY press releases
- Hacker News items with an AI tag

The list can be edited in admin.

**Pipeline:**
1. Fetch every 2 hours with the hPanel cron.
2. Remove duplicates and cluster items covering the same story (title similarity plus shared links).
3. **Significance score** (multiple outlets, official source, keywords such as launch, funding, model, policy, India).
4. Put stories in the **News desk** queue for review, ranked by score.
5. An editor approves a story, which creates a draft (optionally written by the AI assistant) with all sources attached, then edits and publishes it.

**Continue working on it:**
- Published stories become **Story trackers**: a story page with a timeline.
- New items matching the story's keywords and entities are suggested as *updates*.
- The editor appends an update, which bumps `dateModified`, re-pings IndexNow and refreshes it in the news sitemap.

**Pages:** `/ai-news/` hub, `/ai-news/{story}/` with a live timeline, and a Google News sitemap.

**Acceptance criteria:**
- Nothing publishes without approval.
- Every item links its original sources.
- A story timeline shows every update with a date.

---

## 5. Information architecture (top navigation)

**News** (Startup · Funding · AI News) · **Founders** · **Jobs** · **AI Tools** (Directory · Free Tools) · **Startups** (Directory · Launches · Submit) · **Advertise**

## 6. Roadmap (proposed order; each phase ships locally first, and you approve before it goes live)

| Phase | Scope | Why first |
|---|---|---|
| **A. Foundation** | Editorial workflow, sources system, schema, IndexNow, news sitemap, E-E-A-T pages, affiliate/sponsored primitives, Search Console/GA settings | Everything else depends on it |
| **B. News + verification** (pillars 3 and 6) | Paid listings and sponsored flow, funding tags and roundup, founder verification outreach | Builds on what exists; first revenue |
| **C. AI directory + free tools** (pillars 5 and 4) | Tool profiles, task pages, health checks, the first 10 free tools | High search demand; tools earn links |
| **D. Jobs** (pillar 2) | ATS sync, job pages, Indexing API, "how to apply" guides for the top 30 companies | Huge Indian search volume |
| **E. AI news desk + founder profiles** (pillars 7 and 1) | Feed tracker, review queue, story timelines, founder profiles, net-worth policy | Needs the review muscle from A–D |

Each phase includes:
- local testing
- screenshots for your review
- an updated plugin zip
- a "what changed" note

## 7. Risks

| Risk | Mitigation |
|---|---|
| AI-drafted content flagged as low value | Human review, our own analysis, sources, and noindex below the quality bar |
| Defamation or misinformation about founders | Source-or-omit rule, founder verification, and a corrections log |
| Job spam penalties | Official sources only, expiry, and the Indexing API delete notification |
| Hostinger limits (cron frequency, PHP time, email volume) | Batch work, a 2-hourly cron, low email volume, and a VPS later if needed |
| Running costs | Claude API cap; free tools that need no AI make up most of the set |

## 8. Open questions (answer before build)

1. **Pillar 4:** does "AI tools that rank fast" mean free working tools on our site, or something else?
2. **AI drafting:** can we use the Claude API, with your key and a monthly cap, to draft content for human review?
3. **Payments:** which provider handles paid listings and sponsored articles?
4. **First phase:** which pillar(s) matter most to start with?
5. **Prices:** paid listing and sponsored article prices in INR and USD.
6. **Who reviews:** is it you, or will there be other editors or authors? This affects author profiles and permissions.
7. **Affiliate programs:** which do you already have (Amazon, Impact, AI tool programs)?
8. **Job companies:** which 30 companies come first for jobs and "how to apply" guides? (A default list will be proposed if you skip this.)

## 9. Approval

- [ ] Owner approves the scope and phase order
- [ ] Open questions answered
- [ ] Phase A starts
