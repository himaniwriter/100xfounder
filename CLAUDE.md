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

- **AI writing uses Claude Code skills** (`.claude/skills/`) running on the owner's Claude plan limits. Don't use the Claude API or any paid AI API in the site or plugin.
- **Payments are a manual invoice** (no payment gateway).
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
- **Publishing review (changed by the owner on 2026-10-04):** the daily content routine (`/daily-content`, `content/BRIEF.md`) may publish 3–4 researched articles a day without a per-post human review. Its self-review gate stands in for that: every fact sourced, nothing copied, openly licensed images only, quality an editor would publish. Founder verification items and anything about a private person still need the owner's review. Never publish in bulk spikes; schedule a few per day (Google's scaled-content and AdSense low-value-content policies).
- **Sponsored content is labelled "Sponsored", and paid or affiliate links use `rel="sponsored"`.** Affiliate pages carry a disclosure.
- **Jobs come only from official sources**: company career pages and public ATS feeds (Greenhouse, Lever, Ashby and similar). Never scrape LinkedIn or Naukri. Remove expired jobs promptly.
- **Outreach email must comply with CAN-SPAM, GDPR and the DPDP Act**: postal address, one-click unsubscribe, a low daily volume through Hostinger SMTP, and stop on reply.
- **No ads on thin or private pages.** Thin pages stay noindexed until they have real content.
- **Credit and link sources.** Don't republish other outlets' articles; summarise in our own words with attribution.
- **Never promise rankings.** Good indexing practice (sitemaps, IndexNow, the Indexing API for jobs only) speeds up discovery but doesn't guarantee rankings.

## Working conventions

- **Local dev:** `bash wordpress/local/run-local.sh` starts http://localhost:8080 (admin/admin). Test there before every release.
- **Live site:** WordPress on Hostinger since 2026-10-04 (admin user `xf_owner`; the owner logs in through hPanel's one-click WordPress admin or a password reset). Hostinger's shared hosting blocks SSH/FTP from cloud sessions; HTTPS and the Hostinger API work.
- **Releases:** the owner approves first. Then run `HOSTINGER_API_TOKEN=… python3 wordpress/deploy/deploy-hostinger-api.py` (token from hPanel → profile → API, kept only in the environment, revoked afterwards), or upload `wordpress/dist/*.zip` through WP admin.
- **MCP server:** the plugin serves MCP at `/wp-json/xf/v1/mcp` (see `docs/MCP.md`; `.mcp.json` reads `XF_MCP_AUTH`). Prefer its tools (`create_draft`, `update_draft`, `list_queue`, …) over `xf.sh` when connected. Drafts are Pending review unless auto-publishing is enabled (Settings → Claude (MCP) → *Allow publishing through MCP*), which the daily routine uses to schedule posts via `content/upload.py`; outside the routine, `publish_post` needs the owner's approval in chat.
- **Indexing:** IndexNow gets every published/updated URL in batches; Google's Indexing API is used **only for job pages** (daily backfill within the 190/day cap) once a service-account key is saved in Settings → Jobs. Indexing speeds discovery; it never guarantees rankings.
- **Plugin code style:** procedural WordPress PHP with an `xf_` prefix and one module per file in `includes/`. Escape all output, use nonces and capability checks, and prepare all SQL.
- **Development branch:** `claude/modest-heisenberg-reisvt`.
