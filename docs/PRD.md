# 100xFounder Content and SEO Platform: PRD

**Status:** **Approved by owner 2026-10-04 (v0.3). Phase A in progress.**
**Version:** 0.3 (2026-10-04)
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

## 2a. UI design (owner-supplied, 2026-10-04)

**Source of truth:**
- Design canvas "100Xfounder Revamp": https://claude.ai/artifact/1M6rZmasXRJJTQ7LxcreH8
- The PDF export `100Xfounder_Revamp.pdf`, 17 pages

The canvas holds six desktop pages at 1440px, each with a 390px mobile version.

**Design system:**

| Token | Value |
|---|---|
| Background, surface | `#0b0b0c`, `#121214` |
| Lines | `#232326`, `#303035` |
| Text | `#f2f2ef`, secondary `#a6a6a2`, tertiary `#8c8c88` |
| Accent | `#ff6a3d` (category labels, active tab, "Breaking", founder-story tags) |
| Signature divider | 1px gradient hairline `#ff6a3d → #c56bff → #4aa8ff` |
| Type | **Inter** 400–700 for UI and headlines (tight tracking, around −0.05em on display); **Geist Mono** for kickers, labels, timestamps, numbers and prices |
| Shape | Max width 1240px, 10px button radius, 6px image radius |
| Behaviour | Sticky blurred header; rise-in animations that respect reduced motion; buttons are either primary (light) or ghost |

**Implementation decision:** a custom classic **WordPress theme, `100xfounder-theme`**, built pixel-close to the canvas (header, footer with the giant wordmark, templates per page). The `100xfounder` plugin keeps all data and logic. The theme only renders. Fonts are self-hosted for speed and privacy.

**Page-by-page mapping:**

| Design page | WordPress template | Data (pillar) |
|---|---|---|
| **Home** | `front-page.php` | See the list below |
| **Launches and founders** | `/launches/` | Hero; founder of the day (latest published spotlight, verified badge from pillar 6); **leaderboard** of Product Hunt imports with Today / Yesterday / This week and category chips; **upvotes**; founder stories; Instagram grid; "Launching soon?" CTA |
| **Jobs board** | `/jobs/` + single job | "What / Where" search; function filter with counts; stage chips; Full-time / Remote / Hybrid tabs; job rows (initials avatar, salary in mono, age, **save**, Apply to the official URL); "Founder replies fast" tag (set by the employer); **Morning job alerts** (email) |
| **News, events & long reads** | `/news/` | Lead story, latest list with thumbnails, upcoming events, most read, newsletter box, load more |
| **Article page** | `single.php` | Centred headline, author and read time, hero image with credit, **"In this story" table of contents**, share, pull quotes, tags, **"Original reporting" link (plus our Sources block)**, keep reading |
| **Submit story** | `/submit/` | Five types: Article, Press release, Event news, Product launch, Job post. Each sets the form fields. Files and Instagram opt-in go to the review queue (manual invoice for paid types) |

**Home** (`front-page.php`) pulls together:
- a date / city / social top bar
- the category bar
- a **breaking ticker**
- a "Today in Indian & US startups" strip with live counts: Launched, Raised, Hiring, Happening, Worth reading
- latest, lead story and most read
- a **funding tracker table**
- the recently funded spotlight
- the Instagram grid
- a block per category
- events and startups hiring
- the blog
- contribute
- a footer with the wordmark

**New features the design adds to scope:** Events (a calendar post type), the Funding tracker (a structured funding-round post type that feeds the home table and `/funding-tracker/`), a breaking ticker, a newsletter ("The 8AM brief"), launch upvotes, saved jobs and job alerts.

**Pages not in the canvas yet:** these will be designed in the same system and added to the canvas for your approval before they're built:
- AI tools directory and tool profile (pillar 5)
- Free tools hub and tool page (pillar 4)
- AI news tracker and story timeline (pillar 7)
- Founder profile (pillar 1)
- How-to-apply guide (pillar 2)

**Content rule for the design's sample data:** the canvas uses illustrative headlines and numbers (for example the funding amounts and "Claude Frontier Academy"). None of these get published. Live pages show only real, sourced content, and empty states until it exists.

## 3. Shared foundation (built first, used by every pillar)

| Component | What it does |
|---|---|
| **Editorial workflow** | Statuses: *Idea → Draft → In review → Published → Needs update*. Shows the assigned reviewer and a review checklist (sources present, facts checked, no thin content). Uses WordPress's built-in Pending/Draft plus a checklist panel. |
| **Sources system** | A meta box on every post type that holds a repeatable list of sources (URL, publisher, date, supported claim). It renders a "Sources" block with `citation` schema. Publishing a founder or company article with no sources is blocked. |
| **Content-writing skills (no API credits)** | Articles are written by **Claude Code skills that run on your Claude plan's daily limits**, not on paid API credits (owner decision). The plugin exposes a **content queue** and a **draft inbox** over the WordPress REST API, using a built-in Application Password over HTTPS. The skills read the queue, research with web search, write with inline sources, self-check, and upload each draft as **Pending review**. You review and publish in WordPress. See section 4a. |
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

**Payments (owner decision): manual invoice.**
1. The order form creates an *Order* (pending) and emails you and the buyer.
2. You send the invoice and mark the order *Paid* in admin.
3. That unlocks the listing or sponsored article.

No payment gateway in v1.

**Acceptance criteria:**
- Paid items can't skip review.
- All sponsored content is labelled.
- An order moves Pending → Paid → Published only by an admin action, and the buyer is emailed at each step.

### Pillar 4: AI tools that rank fast and actually work

**Owner decision: both of the following.**
- **(a) Free working tools hosted on our site.** People use them, they earn links, and long-tail tool keywords rank quickly.
- **(b) Fast-ranking, verified pages about AI tools.** These come from the pillar 5 directory, with a daily check that each tool still works.

**Initial set:**
- 6 that need no AI and have no running cost:
  - startup equity dilution calculator
  - SAFE/convertible calculator
  - in-hand salary calculator (India, new and old tax regime)
  - CTC to in-hand calculator
  - notice-period buyout calculator
  - startup name and domain checker
- 4 writing helpers built **without any AI API**, since there are no API credits:
  - LinkedIn headline builder
  - referral and cold-email builder
  - resume bullet builder
  - pitch one-liner builder

  These use templates and rules (role, skills and achievement fields combined with proven formulas). Each offers a **"Copy as prompt"** button that hands a ready-made prompt to the visitor's own ChatGPT or Claude, so they work for free and never break.

**"Must be working":** every tool has an automated test, run daily, plus uptime monitoring. A broken tool is hidden automatically and the admin is alerted.

**Pages:** `/tools/` hub and `/tools/{tool}/`. Each tool page has the tool, a how-to section, worked examples, a FAQ and `SoftwareApplication` schema.

**Acceptance criteria:**
- Tools load in under 2s on mobile.
- No paid APIs, so tools have no running cost and nothing to rate-limit.

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

## 4a. Content-writing skills (Claude Code, using your plan limits)

The skills live in the repo under `.claude/skills/`, so they're available in every Claude Code session: terminal, desktop, web or a scheduled routine. Usage counts against your Claude plan's limits, not API credits.

| Skill | Writes | Input from the site queue |
|---|---|---|
| `/write-news` | Startup and funding news and the weekly funding roundup | Queued stories from the news desk |
| `/ai-news-desk` | AI news stories and **updates to existing story timelines** | Significant stories from the feed tracker |
| `/write-founder` | Founder profiles (sources required; net worth only when sourced) | Founder stubs from Product Hunt imports and spotlights |
| `/write-apply-guide` | "How to apply at {company}" guides | Your company list |
| `/write-ai-tool` | AI tool profiles, "AI for {task}" pages and alternatives | Directory candidates and task pages under 5 tools |

**How each skill works:**
1. Pull the next N items from `GET /wp-json/xf/v1/queue?type=…`.
2. Research with web search and web fetch, keeping a source list with URL, publisher, date and the claim it supports.
3. Write to the page-type template and style guide (`docs/STYLE_GUIDE.md`): structure, length, tone and internal links.
4. Self-check:
   - every number and claim has a source
   - nothing invented
   - no copied passages
   - title and meta length are right
5. Upload with `POST /wp-json/xf/v1/drafts` as **Pending review**, with category, tags, sources, schema fields and the featured-image source.
6. Report the edit links for you to review.

**Scheduling:** a Claude Code **routine** can run, for example, `/ai-news-desk` every morning and `/write-news` at noon. These use your plan, and the drafts wait for your review. For a cloud routine to reach the site, the environment's network must allow 100xfounder.com.

**Security:**
- A dedicated WordPress user with the **Author** role that can only create pending posts.
- An Application Password (revocable) stored as a secret in the environment, never in the repo.

## 5. Information architecture (top navigation)

**News** (Startup · Funding · AI News) · **Founders** · **Jobs** · **AI Tools** (Directory · Free Tools) · **Startups** (Directory · Launches · Submit) · **Advertise**

## 6. Roadmap: growth-first order (owner asked for the fastest-growing combination)

The reasoning:
- **Jobs** (Google for Jobs and the Indexing API) plus **salary and CTC calculators** reach India's largest search audience fastest, and each feeds the other.
- **AI news plus the AI tool directory** brings daily fresh content (Google News and Discover) and evergreen long-tail traffic.
- **Monetisation and founder pillars** come once there's traffic to sell.

| Phase | Scope | Growth lever |
|---|---|---|
| **A. Foundation (slim)** | **Theme `100xfounder-theme` built to the canvas (header, footer, home, news, article, submit)**, sources system, review checklist, schema, IndexNow, news sitemap, E-E-A-T pages, Search Console/GA settings, **content queue and draft API, plus the first skill** | Required by everything |
| **B. Jobs engine + calculators** (pillars 2 and 4a) | Jobs board exactly as designed (filters, save, alerts), ATS sync, job and city/role pages, Indexing API, expiry; in-hand salary, CTC and notice-buyout calculators; `/write-apply-guide` for the top 30 companies | Fastest indexing (hours) and the biggest Indian volume |
| **C. AI news desk + AI tool directory** (pillars 7, 5 and 4b) | Canvas designs for the new pages first, then the feed tracker, review queue, story timelines, `/ai-news-desk`; tool profiles, task pages, health checks, `/write-ai-tool`; writing-helper tools | Daily freshness plus long-tail evergreen |
| **D. Founders + verification** (pillars 1 and 6) | Launches page as designed (leaderboard, upvotes, founder of the day), founder profiles, sourced net worth, `/write-founder`, verification emails, corrections log | Trust (E-E-A-T) and backlinks |
| **E. Revenue** (pillar 3) | Funding tracker, events and newsletter, submit-startup tiers, sponsored articles, manual-invoice orders, affiliate manager, funding roundup | Monetise the traffic |

AdSense runs from day one. Apply once 20–30 quality articles are live, likely during phase B or C.
## 7. Risks

| Risk | Mitigation |
|---|---|
| AI-drafted content flagged as low value | Human review, our own analysis, sources, and noindex below the quality bar |
| Defamation or misinformation about founders | Source-or-omit rule, founder verification, and a corrections log |
| Job spam penalties | Official sources only, expiry, and the Indexing API delete notification |
| Hostinger limits (cron frequency, PHP time, email volume) | Batch work, a 2-hourly cron, low email volume, and a VPS later if needed |
| Running costs | Claude API cap; free tools that need no AI make up most of the set |

## 8. Decisions and remaining questions

**Decided (2026-10-04, UI round):**
- **Newsletter:** collect signups in WordPress only for now; choose a sender later.
- **Events:** fetched automatically from public event calendars. An admin adds **iCal/ICS feeds**, for example Luma calendars and Meetup groups, or any organiser's public `.ics`. Imported events land as *pending* for review, are credited to the organiser, and link to the original registration page. No scraping of sites without a public feed.
- **Launch votes:** rank by real Product Hunt votes, plus a separate "100x likes" count from visitors (one per browser, rate-limited, no login).

**Decided (2026-10-04):**
- **Pillar 4:** both free on-site tools and verified AI-tool pages.
- **AI writing:** Claude Code skills on your plan's limits, with no API credits.
- **Payments:** manual invoice.
- **Order:** growth-first (section 6).

**Still open. Defaults are used if you don't answer:**

1. **Prices:** paid listing and sponsored article prices. Default: Fast-track ₹2,999 / $49, Featured ₹7,999 / $129 a week, Sponsored article ₹14,999 / $249.
2. **Who reviews:** default is you, the admin, only.
3. **Affiliate programs:** default is none at launch; the affiliate manager is built for adding later.
4. **First 30 companies for jobs and apply guides:** default is a mix of big tech (Google, Microsoft, Amazon, Meta, Adobe, Salesforce), Indian unicorns (Flipkart, Swiggy, Zomato, Razorpay, CRED, Zepto, PhonePe, Meesho, Groww, Zerodha, Paytm) and AI-first companies (OpenAI, Anthropic, NVIDIA, Sarvam AI, Krutrim), subject to each having a public job feed or careers page.

## 9. Approval

- [x] Owner approves the scope and phase order (2026-10-04)
- [x] Key questions answered (defaults apply to the rest)
- [x] Phase A started
