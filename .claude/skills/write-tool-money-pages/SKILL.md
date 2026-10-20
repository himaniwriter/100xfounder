---
name: write-tool-money-pages
description: Research a NEW Product Hunt launch and write its two money pages for 100xfounder.com, targeting "{tool} alternatives" and "{tool} free / coupon / discount / pricing" searches, with affiliate-ready links. Use when the owner says "/write-tool-money-pages <tool>", "alternatives page for X", "coupon page for X", or asks for pages that rank on alternatives, coupon or free keywords.
---

# /write-tool-money-pages <tool>

**Only new Product Hunt launches (owner, 2026-10-21). Never edit or retarget existing articles.** Two pages per tool, **1–2 tools per run** (they count toward the 4 posts a day pace in `content/BRIEF.md`, and are scheduled through the same upload). Read `CLAUDE.md` and `content/BRIEF.md` first; their rules apply. `content/SEMRUSH-BRIEF.md` is the long-form model; these pages are shorter.

## Why two pages, not three
"{tool} coupon" and "{tool} free" are the same intent: how do I pay less, or nothing. One strong page answers both. A coupon-only page without a real code is thin content, and Google's site-reputation and scaled-content policies demote coupon pages with nothing behind them. Keep each page distinct: page 1 is about other products, page 2 is about this product's price.

## Page 1: `{tool}-alternatives`
Targets: {tool} alternatives, tools like {tool}, {tool} competitors, free {tool} alternatives, {tool} alternative for <use case>, open-source {tool} alternative.
- **Title** (55–65 chars): "{N} Best {Tool} Alternatives (Free & Paid), Compared". No year in the slug. The title may carry a year only if the page is refreshed that year.
- **First 60 words:** a direct answer naming the top 3 picks and who each one suits.
- **A comparison table** near the top: tool, best for, free plan (yes/no/trial), starting price (as of <date>), standout feature.
- **One H3 per alternative, 7–12 of them.** Each covers what it is, who it's for, its free plan and starting price from its own pricing page (dated), 2 pros, 2 cons and when to pick it over {tool}. Every price and limit is quoted from the official page. If a pricing page won't render, write "See its pricing page".
- **Sections:**
  - best free alternative
  - best open-source alternative
  - best for teams
  - best for India (INR billing or UPI, where the official page says so)
- **"When {tool} is still the right choice":** an honest section on when not to switch.
- **Links:** internal links to our startup listings for any alternative we list (`/startup/<slug>/`).

## Page 2: `{tool}-pricing-free-plan`
Targets: is {tool} free, {tool} free plan, {tool} free trial, {tool} coupon, {tool} coupon code, {tool} discount, {tool} promo code, {tool} student discount, {tool} startup program, {tool} pricing.
- **Title** (55–65 chars): "Is {Tool} Free? Pricing, Free Plan, Trial and Discounts".
- **First 60 words:** a direct yes/no answer on free use, and what it costs.
- **Pricing table:** every plan, its price monthly and annual, and its key limits, as of <date>, from the official pricing page.
- **Free plan:** exactly what's included and its limits. **Free trial:** its length, whether a card is needed, and how to cancel (from the official help docs).
- **"How to pay less for {tool}", official routes only:**
  - annual billing saving (computed from the official prices)
  - student or education plans
  - nonprofit plans
  - startup programs (e.g. AWS Activate, Notion for Startups, HubSpot for Startups), only if the official page exists
  - seasonal sales, but only if the official site currently shows one
  - regional or INR pricing, if the official site offers it
- **Coupons:** add real codes or deals to the post's `coupons` (the `_xf_coupons` meta; `includes/reviews.php` shows the coupon box only when one exists, with the affiliate disclosure). If there is no verified code, the page says so: "There's no public {tool} coupon code right now; these are the official ways to get it cheaper."
- **Free alternatives:** a short list that links to page 1. Don't repeat page 1.
- **FAQ:** 8–12 People-Also-Ask style questions.

## Affiliate links
- Use the placeholder href `{{AFF:<tool-slug>}}` for every link to buy or sign up, with `rel="sponsored nofollow"`. The owner swaps placeholders for real affiliate URLs; a placeholder left in place falls back to the official site.
- Put this disclosure box right under the intro, before the first affiliate link: "We may earn a commission if you sign up through some links on this page, at no extra cost to you. It doesn't change what we recommend." The FTC endorsement guides and ASCI require it.
- The external-link cap in `includes/external-links.php` exempts `rel="sponsored"` links. Name every other source as plain text, as usual.

## Never
- **Invented coupon codes, fake "verified" or "% off" claims, countdown timers, or "deal ends today" urgency.** Codes copied from coupon aggregators count as invented: they're unverified and usually expired.
- **"We tested" claims.** We haven't used the tool; say verdicts are based on official documentation and attributed user reviews (G2, Capterra, Reddit), with dates.
- **Ratings in schema** from G2, Product Hunt or anywhere else. Show them as text with the source.
- **Undated prices.** Write "As of <date>; confirm on the pricing page."
- **Promised rankings or results.**

## Minimums (owner rules)
- 1,200+ words for alternatives pages and 900+ for pricing pages: well above the 500-word gate, and they still need to earn their length.
- 2+ images: original comparison graphics (`content/render-graphics.py` style: dark theme, Inter, purple gradient) or openly licensed images. Never the tool's own screenshots or logo.
- Every fact sourced, with the sources listed at the end.

## Output and upload
- Write `content/drafts/money-{tool}-alternatives.json` and `content/drafts/money-{tool}-pricing.json` in the draft format from `content/BRIEF.md`.
- Category: `"tools"`. Set `review` meta on page 2: name, url, pricing_url, price, currency, billing, free_plan, checked.
- Upload and schedule them with the daily pipeline (`content/upload.py`), at most 4 posts a day across all routines.
- Add the tool to the list in `content/money-pages.md`: the tool, both URLs, its affiliate program URL (if one exists) and the date checked. That list tells the owner which affiliate links to sign up for.
- **Refresh:** prices go stale. Re-check both pages every 90 days, and update the `checked` date.

## Picking tools (new Product Hunt launches only)
- **Source:** our own startup listings from the last 7 days (`/startups/`, filled by the daily PH import), so every page has a matching `/startup/<slug>/` profile.
- **Pick launches with demand:** top 5 of the day, or 200+ upvotes, **and** a paid plan or a real launch deal. Skip free-only tools that have nothing to compare on price.
- **Check `content/money-pages.md`** so no tool is done twice. Never touch an existing article.
- **Don't cannibalise the profile.** The `/startup/<slug>/` profile is about the product itself, and these two pages are about choices and price. Each page links to the profile, and the profile's alternatives and pricing sections link back (add the URLs to `profile.links` when you upload).
- **Real coupons for new launches:**
  - the Product Hunt launch offer, if the PH page shows one. Quote it with its terms and the date seen. Launch offers expire, so set `expires` on the coupon.
  - an exclusive code from the founder. When outreach emails a founder about their profile, ask: "Want to offer our readers a launch code? We'll feature it on your pricing page."
  - if neither exists, the page says so plainly.
- **Affiliate:** new tools often run affiliate programs on Rewardful, PartnerStack or FirstPromoter, linked in the site footer. Note the link in `money-pages.md`.
