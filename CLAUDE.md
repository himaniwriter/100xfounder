# 100xFounder: project memory

Read this first in every session. It records what the owner has decided about the product. Change it only when the owner changes direction.

## What the site is

100xfounder.com is a startup and AI discovery site, aimed mainly at an Indian audience with global coverage. It runs on **WordPress on Hostinger** (shared plan, PHP only, no Node.js) through the custom plugin in `wordpress/100xfounder/`. The Next.js app in the rest of the repo is legacy and kept only for reference; don't build new features there. Earn money from **Google AdSense** (publisher `ca-pub-4106130565884060`), paid startup listings, sponsored articles and affiliate links.

## The content pillars (owner-defined, 2026-10-04)

1. **Founders.** Product Hunt founders and their stories, news and (only when sourced) net worth.
2. **Jobs in India.** Marketing, AI, tech and big-company jobs, plus "how to apply at X" guides.
3. **Startup and funding news.** New innovative startups, paid startup listings and sponsored articles.
4. **AI tools that rank fast.** Pages people actually use, and every tool listed must be verified working.
5. **AI tool and product recommendations, "which AI to use for what".** Modelled on theresanaiforthat.com.
6. **Founder verification outreach.** When we publish about a founder, email them the article and its sources, and ask them to approve it or request a correction.
7. **AI news tracking.** Monitor major AI news, queue it for human review, then publish and keep following the story.

The full plan is in `docs/PRD.md`. Its open questions and approval status are tracked there.

## Owner decisions

- **AI writing uses Claude Code skills** (`.claude/skills/`) running on the owner's Claude plan limits. **Exception (2026-10-12):** the in-dashboard AI module (`includes/ai-*.php`: translations into 10 languages and thin-page drafts) may call the Claude API, under a hard total budget of $90 enforced in code; drafts and translations need the owner's approval before they are indexed or published. **Extended 2026-10-14:** the same budget-guarded client also personalises outreach emails and writes up to two follow-ups (owner approval before AI-written emails send is on by default). **Extended 2026-10-15:** the dashboard "Research & refresh" tool (`includes/ai-research.php`) may use the same budget-guarded client, with web search, to research startup listings; its results are drafts that go live only after the owner approves them. No other paid AI API use.
- **Payments are a manual invoice** (no payment gateway).
- **Byline (2026-10-04):** articles publish under the pen name **Ishaan Vardhan** (author slug `ishaan-vardhan`). The bio says openly that it is the editorial desk's pen name. Never give it invented credentials, a fake photo or claimed first-hand experience.
- **Newsletter:** signups are stored in WordPress (no sender yet).
- **Events:** imported from public ICS calendar feeds (Luma, Meetup and others), then reviewed. Never scraped.
- **Launch ranking:** Product Hunt votes, plus our own "likes" count shown separately.
- **Build order is growth-first**: foundation, then jobs and calculators, then AI news and the AI directory, then founders and verification, then revenue features.

## UI design

- **Source of truth:** the owner's design canvas, https://claude.ai/artifact/1M6rZmasXRJJTQ7LxcreH8 ("100Xfounder Revamp"). It's a dark editorial portal:
  - colours: `#0b0b0c` background, `#f2f2ef` text, violet accent `#b07cff` (owner switched from orange on 2026-10-04)
  - type: Inter, plus Geist Mono for labels
  - signature: an animated purple gradient (`#7c5cff → #b07cff → #ff6ad5 → #6a7bff`) on the hairline divider, accent labels, ticker and progress bar; it stops under `prefers-reduced-motion`
- **Build:** a custom WordPress theme (`wordpress/100xfounder-theme/`) that matches it closely. The plugin holds the logic.
- **New pages:** design them on the same canvas first and get approval, then build.
- **Sample content:** never publish the canvas's sample headlines or numbers. Live pages show only real, sourced content.

## Non-negotiable rules

- **Every factual claim about a real person or company carries a source.** Never invent or estimate net worth, funding, revenue or personal details. If there's no reliable source, leave it out.
- **Publishing review (changed by the owner on 2026-10-04):** the daily content routine (`/daily-content`, `content/BRIEF.md`) may publish 3–4 researched articles a day without a per-post human review. Its self-review gate stands in for that: every fact sourced, nothing copied, openly licensed images only, quality an editor would publish. Founder verification items and anything about a private person still need the owner's review. Never publish in bulk spikes; schedule a few per day (Google's scaled-content and AdSense low-value-content policies). **Pace (owner, 2026-10-06): four posts a day at random times, 07:00–22:30 IST.**
- **Sponsored content is labelled "Sponsored", and paid or affiliate links use `rel="sponsored"`.** Affiliate pages carry a disclosure.
- **Jobs come only from official sources**: company career pages and public ATS feeds (Greenhouse, Lever, Ashby and similar). Never scrape LinkedIn or Naukri. Remove expired jobs promptly.
- **Outreach email must comply with CAN-SPAM, GDPR and the DPDP Act**: postal address, one-click unsubscribe, a low daily volume through Hostinger SMTP, and stop on reply.
- **Minimum length and images (owner, 2026-10-15):** nothing shorter than 500 words, or with fewer than 2 images (featured image counts), is published: articles, guides, startup profiles and Shark Tank pages alike. `includes/sources.php` enforces it for posts and guides by moving a failing post to Pending review; the routines check profiles before publishing.
- **Thin pages noindexed, new pages drip-fed (owner, 2026-10-15):** `includes/index-control.php` overrides the 2026-10-09 'index everything' rule. Articles, guides and spotlights under 500 words, startup listings that aren't rich (`_xf_indexable`), and thin archives get noindex,follow and leave the sitemap. New guides and spotlights, and listings that become rich (new profiles, Research & refresh), are released to Google at most 20 a day (08:00–22:00), each pinged to IndexNow when due. News articles aren't dripped.
- **No ads on thin or private pages.** Thin pages stay noindexed until they have real content.
- **Credit sources.** Don't republish other outlets' articles; summarise in our own words with attribution. **External links (owner, 2026-10-15):** each page keeps only 0, 1 or 2 clickable external links (a fixed mix per URL); every other source, alternative or Product Hunt reference is named as plain text. `includes/external-links.php` enforces it at render time on all front-end pages; `rel="sponsored"` links, image links and share buttons are exempt. Write sources into content as usual; don't work around the cap.
- **Never promise rankings.** Good indexing practice (sitemaps, IndexNow, the Indexing API for jobs only) speeds up discovery but doesn't guarantee rankings.

## Working conventions

- **Work on the live site (owner, 2026-10-15):** changes go straight to 100xfounder.com, but every deploy first runs `python3 wordpress/deploy/backup-live.py`. That makes a server backup (database dump plus plugin and theme zip, newest 7 kept in `wp-content/xf-backups/`, web access denied; `includes/backup.php`) and downloads a local copy to `backups/<id>/` (gitignored, newest 14 kept). If the backup fails, don't deploy. Hostinger's own daily backups still cover uploads/media. Local WordPress (`bash wordpress/local/run-local.sh`, http://localhost:8080, admin/admin) is optional for testing risky changes.
- **Live site:** WordPress on Hostinger since 2026-10-04 (admin user `xf_owner`; the owner logs in through hPanel's one-click WordPress admin or a password reset). Hostinger's shared hosting blocks SSH/FTP from cloud sessions; HTTPS and the Hostinger API work.
- **Releases:** the owner approves first. Then run `HOSTINGER_API_TOKEN=… python3 wordpress/deploy/deploy-hostinger-api.py` (token from hPanel → profile → API, kept only in the environment, revoked afterwards), or upload `wordpress/dist/*.zip` through WP admin.
- **MCP server:** served by the separate **Claude Connector** plugin (`wordpress/xf-claude-connector/`) at `/wp-json/xf-claude/v1/mcp`, authenticated by one Bearer token bound to one WordPress user (see `docs/MCP.md`; `.mcp.json` reads `XF_MCP_TOKEN`). The old app-password endpoint `/xf/v1/mcp` is closed while the connector is active. Never weaken its checks (token-only auth, tool groups, HTTPS, origin check, rate limits, log). Prefer its tools (`create_draft`, `update_draft`, `list_queue`, …) over `xf.sh` when connected. Drafts are Pending review unless auto-publishing is enabled (Settings → Claude (MCP) → *Allow publishing through MCP*), which the daily routine uses to schedule posts via `content/upload.py`; outside the routine, `publish_post` needs the owner's approval in chat.
- **Indexability (owner, 2026-10-09):** every public page is indexable; only `/tag/` archives are `noindex, follow` (and out of the sitemap). Enforced last in `includes/indexing.php`, so it overrides older thin-page rules. Removed old-site URLs return 410 Gone, not redirects to generic pages.
- **Submissions need email OTP (owner, 2026-10-09):** submit-form posts stay unverified drafts until the 6-digit emailed code is entered; only then are they Pending and the editors notified. Unverified ones are deleted after 24 h.
- **Indexing:** IndexNow gets every published/updated URL in batches; Google's Indexing API is used **only for job pages** (daily backfill within the 190/day cap) once a service-account key is saved in Settings → Jobs. Indexing speeds discovery; it never guarantees rankings.
- **Request indexing (owner, 2026-10-07):** the scheduled task `100xfounder-request-indexing` asks Search Console to index new articles, guides and profiled startups six times a day, while the owner's computer is on (`content/indexing-queue.py` tracks what is done; roughly ten requests a day is Google's limit). It clicks only by element, never by coordinates.
- **URLs (owner, 2026-10-07):** article and guide slugs are 2–6 words, keyword first, and never contain a year. Event slugs keep the edition year because it is part of the event's name. Old dated URLs 301 to the new ones.
- **Startup pages:** `single-xf_startup.php` shows a researched profile (`_xf_profile`, see `includes/startup-profile.php`) with pricing, alternatives, reviews, community and FAQ. **Star ratings come only from real visitor votes** (footer box, `includes/ratings.php`; schema appears after 3 votes and matches the visible figures). Never hard-code, seed or default a rating, and never put another platform's rating (Product Hunt, G2) into our schema: show it as text with its source. A made-up or borrowed rating breaks Google's structured-data rules and misleads readers. Use `/write-startup-profile`.
- **Signup popup (owner, 2026-10-09):** `includes/popup.php` collects an email (newsletter) and an optional WhatsApp number (founders-community invite), each with its own unticked consent box; the wording is stored with every record (Leads) and the email also goes to Subscribers. Never pre-tick, bundle or reword consent without updating the stored text; never show it on forms or legal pages, in the first seconds, or full-screen on first arrival (Google's intrusive-interstitial rule). The invite link lives in 100xFounder → Settings (`founders_community_url`). Leads and Subscribers both have CSV downloads.
- **Gated lists (owner, 2026-10-12):** `[xf_reveal]…[/xf_reveal]` (`includes/gated-list.php`) hides part of an article until the reader fills a short form; the hidden part never appears in the page HTML, feed or public REST API. Consent stays split: one required box for the request itself, separate optional boxes for partner contact and the newsletter, all stored on the lead (Leads, niche from the shortcode). Articles that feature Digihandler run as normal editorial without a Sponsored label, but carry a one-line note next to Digihandler that it manages the 100xFounder website (Digihandler is the agency that runs this site for its owner, not the owner; decided 2026-10-12; ASCI and Google spam policies need the connection disclosed). Hidden entries are real, researched businesses, never filler.
- **Auto-approval (decided in chat, 2026-10-14):** founder launch submissions (`includes/launch.php`), reader reviews (`includes/startup-reviews.php`) and AI-written outreach emails publish/send on their own 10 minutes after arriving if nobody has reviewed them, each behind a settings checkbox (default on) and only after the built-in safeguards pass (reachable https site, no duplicate domain, no blocked terms, no disposable email, no links/contacts in reviews, no self-reviews, no mock copy). Claims/updates of existing listings always wait for manual approval. Founder Q&A answers are the founder's own words, published with their recorded consent. Anything that fails a safeguard stays pending and is flagged. This is a deliberate exception to the per-item human review in "Publishing review" above.
- **Plugin code style:** procedural WordPress PHP with an `xf_` prefix and one module per file in `includes/`. Escape all output, use nonces and capability checks, and prepare all SQL.
- **Development branch:** `claude/modest-heisenberg-reisvt`.
