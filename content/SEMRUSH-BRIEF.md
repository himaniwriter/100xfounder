# Brief: the Semrush money page (affiliate review, ~10,000 words)

Target: rank for commercial affiliate keywords around Semrush and genuinely help someone decide whether to buy. Read `content/BRIEF.md` and `CLAUDE.md` first; everything there applies unless stated below.

## Non-negotiables
- **Affiliate disclosure, clear and conspicuous**, in a box immediately under the intro, **before the first affiliate link**: that we earn a commission if you buy through our links, at no extra cost to you, and that it doesn't change our assessment. Required by the FTC endorsement guides and India's ASCI influencer guidelines.
- **Every affiliate link** carries `rel="sponsored nofollow"` and uses the placeholder href `{{SEMRUSH_AFF}}` (the owner swaps it once). Non-affiliate references to semrush.com use plain links.
- **No invented first-hand testing.** We have not run a 6-month trial. Where the page gives a verdict, it is explicitly based on (a) Semrush's own documented features, limits and pricing, (b) published independent reviews and user reviews (G2, Capterra, TrustRadius, Reddit threads), each attributed and dated. Never write "I tested", "we ran", "in our account" unless it is true.
- **Never promise rankings** or traffic outcomes. No "guaranteed #1".
- **Every price, limit and feature** from semrush.com (or a dated official source), captured with the date checked. Prices change: say "as of <date>" and tell readers to confirm on the pricing page.
- No fabricated discount codes. Only state a trial/offer if Semrush's own page shows it, quoted with its terms and date.

## Who it is for
Founders, marketers, SEO freelancers and small agencies, India + global. Indian readers care about the USD price in ₹ terms and GST; mention these only with a sourced rate or say the card is billed in USD.

## Structure (H2s; each must answer a real search query)
1. Verdict in 60 seconds — who it's for, who should skip it, the price to expect
2. What Semrush actually is (toolkits, how the credits/limits work)
3. Semrush pricing explained: Pro vs Guru vs Business (full table, every limit)
4. The add-ons that catch people out (extra users, Local, Trends, .Trends API, ContentShake, Social, AI toolkit) and what a realistic monthly bill looks like
5. The free plan and the free trial: exactly what you get, what expires, how to cancel
6. The tools that matter, one by one, with what each is good and bad at
   (Keyword Magic, Position Tracking, Site Audit, Backlink Analytics/Audit, Content/SEO Writing Assistant, Listing Management, Advertising, Social, AI/LLM visibility tooling)
7. Semrush vs Ahrefs — honest head-to-head on data, limits and price
8. Semrush vs Moz, vs SE Ranking, vs Mangools, vs Ubersuggest, vs Similarweb (short, decisive sections)
9. Is Semrush worth it for: a solo founder / a freelancer / a small agency / an ecommerce brand / a local business / an enterprise
10. Semrush for the Indian market: pricing in context, local data quality, GST and billing
11. What people complain about (sourced from reviews: price jumps, limits, data differences, cancellation)
12. How to get the most from it in month 1 (a concrete 30-day plan)
13. How to cancel or downgrade (exact steps from Semrush's help docs)
14. Alternatives if you shouldn't buy it (free/cheap stack that covers 80%)
15. FAQ — 15–20 real questions (People Also Ask style)
16. Sources

## Depth requirements
- 9,000–11,000 words. Never pad: every section must answer something.
- At least 6 comparison tables (pricing, plan limits, Semrush vs each rival, use-case fit).
- Answer the commercial queries directly and early: "is Semrush worth it", "Semrush price", "Semrush free trial", "Semrush vs Ahrefs", "Semrush discount", "how to cancel Semrush", "is there a Semrush free plan", "Semrush for beginners".
- At least 35 sources, mostly primary (semrush.com pages, help docs, investor filings for company facts; rivals' own pricing pages for comparisons).

## Images and video (10–12 visuals, 1–2 videos)
- **Original graphics we own** (preferred): pricing comparison, plan-limit matrix, "which plan should you pick" decision flow, realistic monthly-cost build-up, Semrush vs Ahrefs at a glance, 30-day plan timeline, keyword-research workflow. Produce these as HTML and tell the owner; they are rendered by `wordpress/design/build.py`'s pipeline (dark theme, Inter, purple gradient). Supply each as a self-contained HTML block in `content/semrush-graphics/<name>.html`, 1600x1000, using the same CSS variables as that script.
- **Photos** for section breaks: openly licensed only (Wikimedia Commons / Openverse), as in BRIEF.md.
- **Do not** screenshot or copy Semrush's interface, logo or marketing images into our site.
- **Videos:** reference 1–2 official Semrush YouTube videos by title and URL (we link or embed; no re-upload). Give the exact video title, channel and URL.
- Place `<!-- xf-image-N -->` markers for photos and `<!-- xf-graphic-NAME -->` markers where each original graphic belongs.

## Output
`content/drafts/money-semrush-review.json`, category `"in-depth"`, plus the graphics HTML files. Title 55–70 chars targeting the main commercial keyword. Excerpt 140–160.
