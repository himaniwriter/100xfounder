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
- **Build order is growth-first**: foundation, then jobs and calculators, then AI news and the AI directory, then founders and verification, then revenue features.

## Non-negotiable rules

- **Every factual claim about a real person or company carries a source.** Never invent or estimate net worth, funding, revenue or personal details. If there's no reliable source, leave it out.
- **A human reviews before publishing** any AI-assisted article, founder profile or news item. We don't run unattended mass publishing; Google's scaled-content and AdSense low-value-content policies would penalise it.
- **Sponsored content is labelled "Sponsored", and paid or affiliate links use `rel="sponsored"`.** Affiliate pages carry a disclosure.
- **Jobs come only from official sources**: company career pages and public ATS feeds (Greenhouse, Lever, Ashby and similar). Never scrape LinkedIn or Naukri. Remove expired jobs promptly.
- **Outreach email must comply with CAN-SPAM, GDPR and the DPDP Act**: postal address, one-click unsubscribe, a low daily volume through Hostinger SMTP, and stop on reply.
- **No ads on thin or private pages.** Thin pages stay noindexed until they have real content.
- **Credit and link sources.** Don't republish other outlets' articles; summarise in our own words with attribution.
- **Never promise rankings.** Good indexing practice (sitemaps, IndexNow, the Indexing API for jobs only) speeds up discovery but doesn't guarantee rankings.

## Working conventions

- **Local dev:** `bash wordpress/local/run-local.sh` starts http://localhost:8080 (admin/admin). Test there before every release.
- **Releases:** package `wordpress/dist/100xfounder.zip` and upload it through WP admin. The owner approves before anything goes live.
- **Plugin code style:** procedural WordPress PHP with an `xf_` prefix and one module per file in `includes/`. Escape all output, use nonces and capability checks, and prepare all SQL.
- **Development branch:** `claude/modest-heisenberg-reisvt`.
