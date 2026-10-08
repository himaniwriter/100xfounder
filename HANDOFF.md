# 100xFounder handoff

Snapshot as of **4 October 2026**. Read this, then `CLAUDE.md` (the owner's standing rules) and `docs/PRD.md` (the full plan), before changing anything.

## 1. What this is

100xfounder.com is a startup launch directory and news portal for India (with global coverage). It runs on **WordPress on Hostinger shared hosting** (PHP only, no Node). All the product logic is in a custom plugin; the design is a custom theme. The Next.js app in the rest of the repo is legacy, kept for reference only.

The owner's seven content pillars (from `CLAUDE.md`):

1. Product Hunt founders: stories, news, net worth only when sourced
2. Jobs in India, plus "how to apply at X" guides
3. Startup and funding news, paid listings, sponsored articles
4. AI tools that rank fast (free on-site tools plus verified AI-tool pages)
5. "Which AI to use for what" directory
6. Founder verification outreach (email the article and sources for approval)
7. AI news tracking, reviewed by a person, then followed up

## 2. Live status

**Live since 4 Oct 2026** at https://100xfounder.com.

| Area | State |
|---|---|
| WordPress | Installed through the Hostinger API. PHP 8.3, SSL active (Hostinger lifetime cert), HTTPS redirect on. Timezone Asia/Kolkata, permalinks `/%postname%/`. |
| Plugin `100xfounder` | Active on live at `XF_DB_VERSION` 4. The repo is at 5 (12 more job feeds), **not deployed yet**; waiting for the owner's OK. |
| Theme `100xfounder-theme` | Active. `XFT_VERSION` 1.1.1. Purple animated gradient accent. |
| Jobs | Live: 645 open roles from 23 official careers feeds, synced daily. Repo: 35 feeds (1,145 roles in a local sync on 4 Oct), live after the next deploy. |
| Free tools | In-hand salary (FY 2025-26, new and old regime), salary hike, notice buyout calculators. |
| News, rounds, events, guides | Templates are live, but **nothing is published yet**. The home page leads with jobs and tools until there's news. |
| Product Hunt launches | The importer is live in no-token mode (public feed). **No launches imported yet**; the first run is tonight's cron. |
| Daily cron (hPanel) | `0 3 * * *` UTC (08:30 IST), uid `G2lAnsCGEp`. Calls `/wp-json/xf/v1/run?key=…` and runs every stage: import, contacts, replies, send, digest, events, jobs, indexing. |
| Structured data | Done and verified live. See section 6. |
| Sitemaps | `/wp-sitemap.xml`: pages, jobs, companies and a `landing` sitemap (64 tool and job pages). Users sitemap removed. `/news-sitemap.xml` covers news from the last 48 hours. robots.txt lists both. |
| Old static site | Removed from `public_html`. A full backup was sent to the owner as two zips (`100xfounder-old-site-pages-2026-10-04.zip`, `100xfounder-old-site-out-export.zip`). |
| WordPress sample content | The "Hello world!" post was trashed. |

### Accounts and access

- **WordPress admin:** user `xf_owner`, email creatorbusinesshub9@gmail.com. The password was shared in chat; the owner was told to change it. Never write it into a file.
- **Hostinger:** account `u840917216`, and 100xfounder.com is the main domain. **The same account hosts other sites** (bizformationindia.com, silverclosetshop.com, sanyamsapra.xyz, cheatdaytraveller.com, coachingreviews.org and others). Never touch them.
- **Hostinger API token:** it was used for the install. The owner said they'd revoke it after use. Assume it's gone, and ask for a fresh one (kept as an environment variable, never in chat or a file) if you need it.
- **SSH and FTP** from Claude cloud sessions are blocked (raw TCP). HTTPS, the Hostinger API and wp-admin work. The SSH password was shared in chat earlier; the owner was told to rotate it.

## 3. Repo map

```
CLAUDE.md                          Owner rules and decisions. Always read first.
HANDOFF.md                         This file
.mcp.json                          Claude Code → site MCP server (reads $XF_MCP_AUTH)
.claude/skills/write-news/         /write-news skill + xf.sh REST helper
.claude/skills/write-apply-guide/  /write-apply-guide skill
docs/PRD.md                        Full plan v0.3, phases A–E, status line in §6
docs/MCP.md                        How to connect Claude to the site
docs/WORDPRESS_SETUP.md            Setup, settings, deploy methods, AdSense checklist
docs/STYLE_GUIDE.md                How articles are written
wordpress/100xfounder/             The plugin (all logic). One module per file in includes/
wordpress/100xfounder-theme/       The theme (design from the owner's canvas)
wordpress/dist/*.zip               Built release zips (rebuild before every deploy)
wordpress/deploy/                  deploy-hostinger-api.py (API) and deploy-hostinger.sh (SSH)
wordpress/local/                   Local WordPress + SQLite runner (run-local.sh, router.php)
```

### Plugin modules (`wordpress/100xfounder/includes/`)

| File | What it does |
|---|---|
| `settings.php` | Defaults. Secrets can be set as wp-config constants instead: `XF_SMTP_PASS`, `XF_PH_TOKEN`, `XF_SMTP_USER`, `XF_GOOGLE_SERVICE_ACCOUNT`. |
| `schema.php` | Custom tables: contacts, messages, suppressions, ig_queue, subscribers, queue |
| `post-types.php` | `xf_startup`, `xf_spotlight`, industries and stages; noindex for thin listings |
| `producthunt.php` | The official API importer (token), plus a public Atom feed fallback (`xf_ph_import_feed`). Its entry point is `xf_ph_import_daily`. |
| `contacts.php`, `outreach.php` | Contact discovery and the outreach email sequence over Hostinger SMTP, with IMAP reply detection. Sending is **off** until a mailbox and postal address are set. |
| `spotlights.php`, `instagram.php` | Founder spotlight form, and Instagram slides rendered with GD |
| `pipeline.php` | The daily routine. Stages: import, contacts, replies, send, digest, events, jobs, indexing. |
| `jobs.php` | `xf_job` and the `xf_company` taxonomy. ATS sync (Greenhouse, Lever, Ashby), expiry, JobPosting schema, Google Indexing API (backfill, 190 a day), job alerts |
| `tools.php`, `guides.php` | Routing for the calculators, and the `xf_guide` post type |
| `events.php`, `rounds.php`, `submissions.php`, `engagement.php` | ICS event import, funding rounds, the submit form, subscribers and likes |
| `sources.php` | Required sources, the review checklist, and the sponsored label with rel="sponsored" |
| `seo.php` | Meta and OG tags; Organization, WebSite, NewsArticle and Event schema; news sitemap; IndexNow in batches; landing sitemap; `xf_all_public_urls()` |
| `schema-pages.php` | Breadcrumbs and CollectionPage/ItemList on lists; Organization on company and startup pages; Article on guides; About/Contact pages |
| `queue.php` | Content queue plus the REST API used by skills (`xf/v1/queue`, `drafts`, `recent`, `categories`) |
| `mcp.php` | MCP server at `xf/v1/mcp`. See section 5. |
| `adsense.php` | AdSense head script, ads.txt, legal and E-E-A-T pages |
| `redirects.php`, `importer.php` | Old Next.js URLs; optional import of legacy startups and posts |

## 4. How to work on it

- **Local site:** `bash wordpress/local/run-local.sh` serves http://localhost:8080 (admin/admin). WP-CLI:
  `php wordpress/local/.site/wp-cli.phar --path=wordpress/local/.site/wordpress --allow-root`
  The local database holds **test data** ("[LOCAL TEST]" posts, test rounds and events). It must never be exported to live.
- **Lint:** `php -l` on every changed PHP file.
- **Browser tests:** playwright-core with Chromium at `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`. In cloud sessions, add the proxy CA to Chromium's NSS store (`certutil -d sql:$HOME/.pki/nssdb -A -t "C,," …` for each cert in `/root/.ccr/ca-bundle.crt`) before testing https://100xfounder.com.
- **Releases (the owner approves first):**
  1. Rebuild the zips:
     ```
     cd wordpress && zip -qr dist/100xfounder.zip 100xfounder && zip -qr dist/100xfounder-theme.zip 100xfounder-theme
     ```
  2. Deploy, using one of these:
     - **wp-admin:** Plugins/Themes → Add New → Upload → *Replace current with uploaded*. This keeps the plugin or theme active.
     - **Hostinger API:** `HOSTINGER_API_TOKEN=… python3 wordpress/deploy/deploy-hostinger-api.py`
     - **SSH, from the owner's machine:** `wordpress/deploy/deploy-hostinger.sh`
  3. Bump `XFT_VERSION` (theme) after CSS/JS changes so browsers drop their cached copies.
  4. Bump `XF_DB_VERSION` (plugin) when new pages, categories, tables or seeds are needed. On the next request the plugin re-runs its creators on `init`.
- **Branch:** `claude/modest-heisenberg-reisvt`. Commit and push there. No PR has been opened.

### Gotchas we hit

- **Activation hook order:** the Hostinger plugin deploy activates the plugin after `init`, so anything activation creates must have its post types and taxonomies registered directly in `xf_activate()`. This is fixed for jobs; keep the pattern.
- **Jobs filter CSS:** `.opt` has a fixed 42px height for the jobs filter. Don't reuse it elsewhere without overriding `height` (it caused the home page overlap).
- **Product Hunt:** the redirect `producthunt.com/r/p/…` returns 403 to bots. Don't try to bypass it. Feed imports have no website and no votes until a token is set.
- **Product Hunt API IDs:** maker identities are redacted in the API, so founder contacts come from the product's own website.
- **Staging URLs:** `wp_http_validate_url` rejects localhost and odd ports, which matters for ICS feeds and image sideloading in local tests.
- **Cloud-session permission rules:** in this environment, auto mode blocked these and they need the owner's explicit OK:
  - creating WordPress users or application passwords on live
  - running admin actions on live (imports, indexing submissions)

  Deploying zips through wp-admin went through.

## 5. Claude ↔ site (MCP and skills)

- The **MCP server** is at `https://100xfounder.com/wp-json/xf/v1/mcp`. It uses Streamable HTTP with JSON responses, and authenticates with a WordPress Application Password over HTTP Basic.
  - **Tools:** site_overview, list_queue, add_to_queue, skip_queue_item, list_categories, recent_posts, search_content, get_post, create_draft, update_draft, set_featured_image, review_checklist, list_launches, list_jobs, list_companies, run_routine (admin), submit_all_for_indexing (admin).
  - **publish_post** only appears when Settings → Claude (MCP) → "Allow publishing through MCP" is on. It refuses posts without sources.
  - **Testing:** tested locally with `@modelcontextprotocol/sdk` 1.32. Live, it was only checked to return 401 without auth.
- **Not done yet (owner):** create a WordPress user `claude` (Author), give it an Application Password, and export `XF_MCP_AUTH=$(printf 'claude:<app-password>' | base64)`. Steps are in `docs/MCP.md`.
- **Skills:**
  - `/write-news` and `/write-apply-guide` research and write drafts. They use the MCP tools when connected, and otherwise `xf.sh` with `XF_SITE_URL`, `XF_WP_USER` and `XF_WP_APP_PASSWORD`.
  - Drafts always land as **Pending review**.
  - AI writing runs on the owner's Claude plan; **never call the Claude API or any paid AI API from the site**.

## 6. SEO and indexing

| Page | Schema |
|---|---|
| Home | Organization, WebSite (with SearchAction) |
| Article (`post`) | NewsArticle (with citations from sources), BreadcrumbList |
| Job | JobPosting, BreadcrumbList |
| Jobs board and role/city pages | CollectionPage + ItemList, BreadcrumbList. Pages with fewer than 5 roles are noindexed. |
| Company page | Organization, CollectionPage, BreadcrumbList |
| Tools hub / tool | CollectionPage / WebApplication, plus BreadcrumbList on both |
| Apply guide | Article (with citations, `about` the company), BreadcrumbList |
| Event | Event, BreadcrumbList |
| Startup | Organization, BreadcrumbList. Thin listings are noindexed. |
| News, blog, funding, launches, startups, events pages; categories | CollectionPage, BreadcrumbList |
| About / Contact / other pages | AboutPage / ContactPage / WebPage, BreadcrumbList |

- **IndexNow:**
  - It's on. Published and updated URLs are batched and sent a minute later.
  - The dashboard button **Submit all URLs for indexing** (or the `submit_all_for_indexing` MCP tool) sends everything at once, about 750 URLs. **It hasn't been pressed on live yet.**
- **Google Indexing API:**
  - It's used **only for job pages**, as Google allows.
  - It's inactive until the owner pastes a service-account JSON key into Settings → Jobs. That account's email must be an **Owner** in Search Console, and the project needs the Indexing API enabled.
  - After that, the daily `indexing` stage sends up to 190 un-notified job pages a day, and expired jobs send `URL_DELETED`.
- **Search Console:** the verification meta tag is live (saved in Settings → Search & social on 4 Oct).
- **Owner to-do:**
  - Click **Verify** in Search Console (URL-prefix property `https://100xfounder.com/`).
  - Submit `/wp-sitemap.xml` and `/news-sitemap.xml`.
  - Same in Bing Webmaster Tools.
  - Never promise rankings.

## 7. Open items, in priority order

1. **Owner security clean-up:**
   - Change the WordPress password.
   - Revoke the Hostinger API token.
   - Rotate the SSH password.
2. **Owner setup:**
   - Create the `claude` WP user and app password (MCP).
   - Click Verify in Search Console (the tag is already live) and submit the sitemaps.
   - The Google service-account key for job indexing.
   - The Product Hunt developer token (Settings).
   - The Hostinger mailbox and postal address for outreach (sending stays off until both are set).
   - Logo URL (Settings → Search & social) so Organization schema has a logo.
3. **Press "Run import" and "Submit all URLs for indexing" on the live dashboard**, or let tonight's cron run the import.
4. **Content:** publish the first 20–30 sourced articles (skills → Pending → owner reviews). AdSense applications should wait until then, because a thin site risks a "low value content" rejection.
5. **Phase C:** AI news desk and AI tool directory (pillars 7, 5, 4b). The rule: design the new pages on the owner's canvas first, get approval, then build.
6. **Phase D:** founders and verification. **Phase E:** revenue (listing tiers, sponsored posts, manual invoices).
7. **Small follow-ups:**
   - Write the first apply guides for the top companies on the board.
   - Deploy the 35-feed plugin (`XF_DB_VERSION` 5) once the owner approves. More feeds can be added the same way: confirm the board belongs to the company and lists India roles.
   - The `docs/SEO_GROWTH_PLAN.md` "undo" request from early on was never confirmed; ask before touching it.

## 8. Rules that never change (summary of `CLAUDE.md`)

- **Sources:** every fact about a real person or company needs one. Never estimate net worth, funding or revenue.
- **Human review** before anything AI-assisted is published.
- **Sponsored content** is labelled "Sponsored", and paid or affiliate links use `rel="sponsored"`.
- **Jobs** come only from official careers pages and ATS feeds. Never LinkedIn or Naukri.
- **Outreach** must be CAN-SPAM, GDPR and DPDP compliant: postal address, one-click unsubscribe, low volume, stop on reply.
- **No ads on thin or private pages.** Thin pages stay noindexed.
- **Secrets** go in env vars or wp-config constants, never in the repo or in chat.
- **Design:** the source of truth is the owner's canvas (https://claude.ai/artifact/1M6rZmasXRJJTQ7LxcreH8). The accent is now purple (owner's change on 4 Oct 2026). Never publish the canvas's sample content.

## 9. Security (checklist applied 8 Oct 2026)

| Check | State |
|---|---|
| SQL injection | All queries with outside input use `$wpdb->prepare()`; others only interpolate table names. |
| XSS | Theme and plugin output is escaped (`esc_html`/`esc_attr`/`esc_url`, JSON-LD with `JSON_HEX_TAG`); calculators write numbers only. |
| CSRF | Every admin action and public form checks a nonce and (for admin) a capability. |
| Auth | REST write routes need `edit_posts`; MCP needs an application password; the cron URL key is compared with `hash_equals`. |
| Brute force | `includes/security.php`: 5 failed logins in 15 min lock that IP for 30 min, for wp-login **and** application passwords (so the MCP server and skill API too). Generic login errors. |
| Rate limiting | Subscribe, job alerts, likes, submissions and the contact form are limited per visitor; the visitor key uses `xf_client_ip()` (Hostinger CDN aware). |
| Uploads | Images/PDF only, real file-type check, 5–8 MB caps, no SVG. |
| XML-RPC | Refused (403) in PHP and in `.htaccess`. |
| Info leaks | WordPress version tag removed; `readme.html`/`license.txt` return 403; admin author links go to /about/; anonymous REST users list removed; users sitemap removed. |
| Dashboard file editor | Disabled (`DISALLOW_FILE_EDIT`). |
| Headers | Hostinger sends HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy and its own CSP at the server level (it overrides the plugin's extra CSP directives). |
| Secrets | None in the repo; settings can live in wp-config constants. |

**Owner actions still open:** change the WordPress password, revoke the Hostinger API token, rotate the SSH password (all were shared in chat). WordPress core auto-updates minor releases (7.1.3 was pending on 8 Oct); keep plugins and core updated.
