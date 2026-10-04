# 100xFounder → Startup Launch Directory: Rebrand Plan

_Last updated: 2026-10-04_

## Decisions so far

| Question | Decision |
|---|---|
| Model | **Launch/submit directory**: founders submit their startup and get a listing, a backlink and launch-day traffic. Think BetaList or a lighter Product Hunt. |
| Market | **Global**: English only, USD pricing |
| Revenue | Paid fast-track listings, featured/sponsored spots, newsletter sponsorship, jobs board |
| Old content | **Keep the blog**. Cut the guest-post marketplace, interview questionnaire, Instagram and newsroom extras, and add 301 redirects so their SEO value isn't lost. |

## Where we are today

- **The site is down.** 100xfounder.com returns HTTP 503.
  - The app expects Supabase project `hybfbbtzswtxgqlgkpuk`, which isn't in the current Supabase account.
  - The README describes a DigitalOcean droplet running PM2 behind Caddy. That server is likely stopped or misconfigured.
- **About 70% of a directory already exists:**
  - 1,258 seeded startups (`lib/founders/*-seed.*`)
  - Company pages (`app/company/[slug]`) and filters (`components/founders/filter-sidebar.tsx`)
  - SEO pages: `app/startups/{industry,location,funding-round,investor,jobs}`, sitemaps and JSON-LD
  - Claim flow, admin panel, search and a command palette
- **The site can run without a database.** With no `DATABASE_URL`, it serves the seed data (`lib/founders/store.ts`, `loadFounderDirectoryBaseUnfiltered`). That makes it fast to get back online.

---

## Phase 0: Get it back online (day 1–2)

1. Deploy to **Vercel**. A `100xfounder` project already exists there and suits Next.js 14 better than managing a droplet.
2. Get `next build` passing. The README notes TypeScript errors at `lib/founders/store.ts:367` and `:388`.
3. Launch in **seed-only mode** with no database, so the site is up while we rebuild.
4. Create a new Supabase project (free tier) and run `supabase/migrations/*`. Then set `DATABASE_URL`, `AUTH_SECRET` and the admin credentials.
5. Point 100xfounder.com's DNS at Vercel. Confirm `/sitemap.xml` and `robots.txt` resolve.

## Phase 1: Rebrand and reposition (week 1)

**Positioning:** "The launchpad for ambitious startups. Get discovered by early adopters, investors and talent."

Tagline options to choose from:
- "Launch your startup to 100x more people."
- "Where 100x founders launch."
- "Discover tomorrow's startups, today."

Changes:
- **Homepage** (`app/page.tsx`, `lib/content/homepage-content.json`):
  - Hero copy with a **Submit your startup** call to action
  - "Launching this week" feed, featured row and category chips
  - Newsletter signup
- **Metadata** (`app/layout.tsx`): change the title from "Founder Intelligence and Startup Newsroom" to the new positioning. Drop the India/US wording.
- **Navigation:** Startups · Categories · Jobs · Blog · Submit (button)
- **Visual refresh:** logo wordmark, OG image and favicon. Update `actions/branding-safety-check.mjs` for the new name.
- **Primary entity:** the startup becomes the main thing on the site. Founder profiles become a section on the startup page.
- **Cuts with 301 redirects** (in `next.config.mjs`):
  - `/guest-post-marketplace`, `/guest-post-order`, `/interview-questionnaire` → `/submit`
  - `/newsroom/*` → `/blog/*` (migrate the posts worth keeping)
  - `/about-newsroom`, `/contact-newsroom` → `/about`
  - `/feature-now`, `/get-featured` → `/pricing`
- **Pricing:** switch from INR to USD everywhere (`app/pricing`, the `FeaturedFounderRequest` plans).

## Phase 2: The core loop, submit → review → launch (weeks 2–3)

This is the heart of a launch directory.

1. **`/submit` form.** Fields:
   - name, URL, one-line tagline, description
   - logo, screenshots, category or tags, pricing model
   - founder(s) and socials, launch date preference

   Rebuild it from `components/featured/get-featured-client.tsx` and `react-hook-form` + `zod`.
2. **Schema changes.** Extend `FounderDirectoryEntry`, or add a `Listing` model, with:
   - `status` (`pending | scheduled | live | rejected`)
   - `launchDate`, `plan` (`free | fasttrack | featured`), `linkRel` (`nofollow | dofollow`)
   - `tagline`, `logoUrl`, `screenshots[]`, `upvotes`, `submittedBy`
3. **Admin review queue.** Extend `app/admin/*`. Actions: approve, schedule into a launch slot, reject with a reason, or request edits.
4. **Weekly launch cohorts.** Every Monday, a batch of about 20–30 startups goes live. They get a "Launched this week" homepage feed and a page at `/launches/2026-w42`. A weekly rhythm is easier to keep up than daily launches, and it fits the newsletter.
5. **Upvotes and "Top this week".** Upvotes need a login, which already exists (`lib/auth/*`). They create engagement and something founders can share.
6. **Embeddable "Featured on 100xFounder" badge.** Founders put it on their site, which gives us free backlinks and referral traffic. A dofollow link back to them can require the badge on the free tier.
7. **Seeded startups.** Keep the 1,258 as "unclaimed" listings. The existing claim flow becomes an upsell: claim your listing, then fast-track or feature it.
8. **Email notifications** through Resend: submission received, approved, launch-day "you're live, share it", and a weekly stats summary.

## Phase 3: Monetization (weeks 3–4)

| Product | Suggested price | What they get |
|---|---|---|
| Free listing | $0 | Waits in the queue (about 4–8 weeks). Nofollow link, or dofollow if they display our badge. |
| **Fast-track** | $29–49 one-time | Live within 48h and a dofollow link. Priority slot in the next weekly cohort. |
| **Featured** | $99–199 / week | Pinned on the homepage, on its category page and in the newsletter. |
| **Sponsor** | $299+ / week | Sitewide banner, newsletter headline slot and a top-of-search placement. |
| **Job post** | $49–99 / 30 days | Listed on `/jobs`, linked from the startup page, included in the newsletter. Builds on the existing `app/jobs` and `app/startups/jobs/*`. |
| **Newsletter sponsor** | priced once there are about 1k subscribers | One slot per issue |

**Payments:**
- Recommended: **Stripe Checkout**, or **Lemon Squeezy / Paddle** as merchant of record. A merchant of record handles global VAT/GST. That matters if the business is India-based, since Stripe India onboarding is restricted.
- Payment webhooks set `plan` and `linkRel` on the listing automatically.
- This replaces the current WhatsApp and n8n hand-off.

## Phase 4: Growth engine (ongoing)

- **Weekly newsletter**, "This week's 100x launches", sent with Resend. The signup form goes on every page.
- **Programmatic SEO.** The existing pages already cover industry, location, funding round and investor. Add:
  - "Best {category} startups 2026"
  - "{Startup} alternatives"
  - "Startups using {tech}" (built on the `techStack` field)
- **Blog:** launch guides for founders, e.g. "How to launch on Product Hunt" and "50 places to submit your startup". These attract exactly our customers.
- **Distribution:**
  - Post each weekly cohort on X and LinkedIn, tagging the founders
  - Get listed on other directory lists
  - Reach out to founders in indie hacker communities
- **Analytics:** Clarity is already set up. Add tracking for submission funnel conversion and plan purchases.

---

## Open questions for the next round

1. **Name styling:** "100xFounder", "100Xfounder" or "100x Founder"? Do we need a new logo?
2. **Final prices:** confirm the prices above.
3. **Payment provider:** Stripe or a merchant of record. This depends on where the business is registered.
4. **Launch cadence:** weekly (recommended) or daily?
5. **Upvotes:** include them at launch, or add them later?
6. **Old Supabase project:** do you still have access to the account that owns `hybfbbtzswtxgqlgkpuk`? Recovering it would bring back any real submissions and users.

## Suggested first PR

Phase 0 and Phase 1 together: get the build green, deploy in seed-only mode, apply the new branding, homepage and nav, and add the redirects. That gets the domain earning trust and traffic again within days. Phase 2 can then be built on a live site.
