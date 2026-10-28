---
name: write-tool-money-pages
description: Research a NEW Product Hunt launch and write its two money pages for 100xfounder.com, targeting "{tool} alternatives" and "{tool} free / coupon / discount / pricing" searches, with affiliate-ready links. Use when the owner says "/write-tool-money-pages <tool>", "alternatives page for X", "coupon page for X", or asks for pages that rank on alternatives, coupon or free keywords.
---

# /write-tool-money-pages <tool>

Write two money pages for a tool: an alternatives page and a pricing/free/coupon page. Read `CLAUDE.md` and `content/BRIEF.md` first; their rules apply. `content/SEMRUSH-BRIEF.md` is the long-form model (these pages are shorter).

**Scope (owner, 2026-10-21): new Product Hunt launches only. Never edit or retarget an existing article.** 1–2 tools per run, two pages each; they count toward the 4-posts-a-day pace and schedule through the same upload (`content/upload.py`).

**Two pages, not three.** "{tool} coupon" and "{tool} free" are one intent — pay less or nothing — so one page answers both. A coupon page with no real code is thin content that Google's site-reputation and scaled-content policies demote. Page 1 is about *other products*; page 2 is about *this product's price*. Keep them distinct and don't repeat content across them.

Every tool you name must be a real, reachable, working product. Every price, limit and claim comes from the vendor's own page, dated; if a pricing page won't render, write "See its pricing page". No undated prices — write "As of <date>; confirm on the pricing page."

## Page 1: `{tool}-alternatives`
Targets: {tool} alternatives, tools like {tool}, {tool} competitors, free {tool} alternatives, {tool} alternative for <use case>, open-source {tool} alternative.

- **Title** (55–65 chars): "{N} Best {Tool} Alternatives (Free & Paid), Compared". No year in the slug; a year in the title only when the page is refreshed that year.
- **First 60 words:** a direct answer naming the top 3 picks and who each suits.
- **Comparison table near the top:** tool, best for, free plan (yes/no/trial), starting price (as of <date>), standout feature.
- **One H3 per alternative, 7–12 of them:** what it is, who it's for, free plan and starting price (dated, from its own pricing page), 2 pros, 2 cons, when to pick it over {tool}.
- **Buyer-segment sections:** best free, best open-source, best for teams, best for India (INR/UPI only where the official page says so).
- **"When {tool} is still the right choice":** an honest section on when not to switch.
- **Internal links** to our startup listings for any alternative we list (`/startup/<slug>/`).

## Page 2: `{tool}-pricing-free-plan`
Targets: is {tool} free, {tool} free plan/trial, {tool} coupon / coupon code / discount / promo code, {tool} student discount, {tool} startup program, {tool} pricing.

- **Title** (55–65 chars): "Is {Tool} Free? Pricing, Free Plan, Trial and Discounts".
- **First 60 words:** a direct yes/no on free use, and what it costs.
- **Pricing table:** every plan, monthly and annual price, key limits, as of <date>, from the official pricing page.
- **Free plan:** what's included and its limits. **Free trial:** length, whether a card is needed, how to cancel (from official help docs).
- **"How to pay less for {tool}" — official routes only:** annual-billing saving (computed from official prices); student/education; nonprofit; startup programs (AWS Activate, Notion for Startups, etc., only if the official page exists); seasonal sales only if the official site currently shows one; regional/INR pricing if offered.
- **Coupons:** add real codes/deals to the post's `coupons` (the `_xf_coupons` meta; `includes/reviews.php` shows the coupon box only when one exists, with the affiliate disclosure). With no verified code the page says so: "There's no public {tool} coupon code right now; these are the official ways to get it cheaper."
- **Free alternatives:** a short list linking to page 1 (don't repeat it).
- **FAQ:** 8–12 People-Also-Ask questions.

## Affiliate links
- Every buy/sign-up link uses the placeholder href `{{AFF:<tool-slug>}}` with `rel="sponsored nofollow"`. The owner swaps placeholders for real URLs; an unswapped placeholder falls back to the official site.
- Put this disclosure box right under the intro, before the first affiliate link (FTC guides and ASCI require it): "We may earn a commission if you sign up through some links on this page, at no extra cost to you. It doesn't change what we recommend."
- `includes/external-links.php` exempts `rel="sponsored"` links from the external-link cap. Name every other source as plain text, as usual.

## Never
- **Invented coupon codes, fake "verified" or "% off" claims, countdown timers, "deal ends today" urgency.** Codes from coupon aggregators count as invented — unverified and usually expired.
- **"We tested" claims.** We haven't used the tool; attribute verdicts to official docs and dated user reviews (G2, Capterra, Reddit).
- **Ratings in schema** (G2, Product Hunt, anywhere). Show them as text with the source.
- **Undated prices. Promised rankings or results.**

## Minimums (owner rules)
- 1,200+ words (alternatives), 900+ (pricing) — well over the 500-word gate, and earning the length.
- 2+ images: original comparison graphics (`content/render-graphics.py` style: dark theme, Poppins, violet-to-blue gradient) or openly licensed images. Never the tool's own screenshots or logo.
- Every fact sourced, with sources listed at the end.

## Output and upload
- Write `content/drafts/money-{tool}-alternatives.json` and `content/drafts/money-{tool}-pricing.json` in the draft format from `content/BRIEF.md`. Category `"tools"`.
- On page 2 set the `review` meta: name, url, pricing_url, price, currency, billing, free_plan, checked.
- Upload/schedule with `content/upload.py` (≤4 posts a day across all routines).
- Add the tool to `content/money-pages.md`: tool, both URLs, affiliate-program URL (if any), date checked — this list tells the owner which affiliate links to sign up for. On upload, cross-link: add the two URLs to the profile's `profile.links` so the `/startup/<slug>/` profile's alternatives and pricing sections link out, and link each page back to the profile.
- **Refresh:** re-check both pages every 90 days and update the `checked` date.

## Picking tools (new Product Hunt launches only)
- **Source:** our own startup listings from the last 7 days (`/startups/`, filled by the daily PH import), so every page has a matching `/startup/<slug>/` profile.
- **Demand bar:** top 5 of the day, or 200+ upvotes, **and** a paid plan or a real launch deal. Skip free-only tools with nothing to compare on price.
- **Check `content/money-pages.md`** so no tool is done twice. Never touch an existing article.
- **Don't cannibalise the profile.** The profile is about the product; these pages are about choices and price.
- **Real coupons for new launches:** the Product Hunt launch offer if the PH page shows one (quote its terms and date seen; set `expires` since launch offers expire); or an exclusive founder code (outreach asks founders: "Want to offer our readers a launch code? We'll feature it on your pricing page."); if neither, the page says so plainly.
- **Affiliate:** new tools often run programs on Rewardful, PartnerStack or FirstPromoter, linked in the site footer. Note the link in `money-pages.md`.
