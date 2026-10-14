# part-ac profiles: progress (started 2026-10-14)

Brief for writers: `_BRIEF-ac.md`. PH data extracted by `ph_extract.py` into `_ph-ac/<slug>.json`.
Listing check (WP REST search, 2026-10-14): none of the part-ac products has a listing on 100xfounder.com, so `existing_listing_slug` is null throughout.
No PH-slug overlap with part-aa / part-ab. Nothing uploaded or published.

## Assignment
- Main run: pazi-2 … routines-by-databox (18)
- Helper A: schole-learn-by-building … visibai (18)
- Helper B: vokal-4 … zinley, teachoo-2 (15)

## Merged duplicates (same product, same domain)
- portfolio-lab + portfolio-lab-2 → profile `portfolio-lab-2` (the `portfolio-lab` launch page no longer loads)
- pushary-4 + pushary-5 → profile `pushary-5`
- unabyss + unabyss-for-claude → profile `unabyss-for-claude`

## Done
- pazi-2: profile written; contact support@pazi.ai (pazi.ai/contact)
- peakroutine: profile written; contact info@peakroutinehealth.com (site contact page)
- perfai-security: profile written; contact support@perfai.ai (perfai.ai/contact)
- pollyreach: profile written; contact support@pollyreach.ai (site footer)
- portfolio-lab-2 (covers portfolio-lab): profile written; contact support@portfoliolab.ai (portfoliolab.ai/contact)
- powabase: profile written; contact hello@powabase.ai (privacy policy/terms)
thumbmagic: privacy-contact only, excluded from outreach (owner rule: no privacy/legal inboxes)
- prefactor: profile written; contact hello@prefactor.ai (prefactor.tech/contact)
- prelint: profile written; contact hello@prelint.com (site footer/pricing page)
- propane: profile written (founder photos from usepropane.ai/about); contact hello@usepropane.ai (pricing page)
- proxy-tester-by-scrapeops: profile written; contact info@scrapeops.io (terms of service)
- pushary-5 (covers pushary-4): profile written (launch stats via launches page; no PH comments); contact business@pushary.com (site footer)
- receiptor-ai-agent-mode: profile written (launch stats via launches page; no PH comments); contact info@receiptor.ai (site 'Contact Us' link)
- recordmeeting: profile written; contact support@recordmeeting.com (site footer)
- referent-2: profile written; contact contact@referent.law (site: 'General: contact@referent.law')
- reso-ai-2: profile written; contact hello@resollm.ai (terms and privacy pages; general hello@ inbox)
- rindler: profile written (home page now promotes Maxxwell; product pages still live); contact founders@rindler.ai (site footer)
- robynn-ai-self-improving-websites-2: profile written; contact press@robynn.ai (robynn.ai/press)
- routines-by-databox: SKIPPED (duplicate domain databox.com, already profiled by another batch as artifacts-by-databox). Draft kept in _skipped-ac/ for reference; no contact row.

## Helper A products (schole … visibai)
Profiles written by helper A's sub-agents. Those lacking Product Hunt launch data were flagged `"ph_data_missing": true`.
- vidaya-2, visibai: PH data arrived later; enriched by the main run (ph stats, team, gallery checked by eye, launch story, opinions); flag removed.
- Multi-launch products don't server-render their launch block on PH. `ph_extract.py … --fallback` reads the product's launches page (rank, upvotes, comments, date) and makers page; gallery then comes from the product's PH screenshots (`product.screenshots`). No comments are available that way, so those profiles carry `ph_data_partial` instead of quotes.

## Tools
- `ph_extract.py <ph-url> <out.json> [--fallback]` — PH data from server-rendered Apollo JSON (curl; PH rate-limits at ~1 req/10–20s, back off 3 min on 429).
- `_fetch-ac.sh` (refetch missing extracts), `_fallback-ac.sh <slugs…>` (launches/makers fallback).

## Final status (2026-10-14)
- 55 URLs in part-ac → 49 profiles in `profiles/`, 4 launches merged into a sibling profile (portfolio-lab→portfolio-lab-2, pushary-4→pushary-5, unabyss→unabyss-for-claude, veltrix-ai-for-e-commerce→veltrix-ai-2), 2 skipped as cross-batch domain duplicates (routines-by-databox = databox.com, already artifacts-by-databox; warmintro = tools.crustdata.com, already investorfinder).
- Existing listings on 100xfounder.com: 0 (all `existing_listing_slug: null`).
- `ph_data_missing` flags remaining: 0. 13 profiles carry `ph_data_partial` (launch stats + makers from PH launches/makers pages, gallery from product screenshots, no PH comment quotes): pushary-5, receiptor-ai-agent-mode, schole-learn-by-building, tencent-edgeone-makers, testsprite-3-0, thumbmagic-5 (no gallery: every image shows people), typeahead-2-0, unabyss-for-claude, velo-3-0, veltrix-ai-2, weave-router-2-0, wobo-2-0, zenabm-create-linkedin-ads-with-ai.
- Contacts: `contacts-ac.csv` (no header, same format as outreach-campaign.csv). No email for Tencent EdgeOne (phone only), Thumbmagic (only a privacy/opt-out inbox, excluded), Teachoo (none published), plus the two skipped items.
- Helper notes to re-check before publishing: Semos credit renewal, Scholé free-plan limit, Unabyss annual vs monthly price, Thumbmagic refund wording (pricing vs terms), Velo yearly prices, EdgeOne Personal plan price; Zaro and Yansu have pivoted since launch (profiles say so); Rindler's home page now promotes Maxxwell.
- Nothing uploaded or published.

## Fact-check 2026-10-15
Official sites only (curl; Product Hunt not fetched). Profiles edited locally, JSON checked with `python3 -m json.tool`. No ratings added to schema fields. Nothing uploaded, published or emailed.
- semos-ai-manager-agents: credit renewal. Pricing page heads every plan "/ 30 days" but labels Free and Pro credits "one-time" and Power "credits/month". Home page says "Self-serve, monthly". Service terms say paid plans auto-renew each billing period and Boost credits never expire. Nothing says whether free credits come back. Plan details, notes, FAQ and a con now quote each page, and the terms are added as a source. Sources: https://semos.ai/pricing/, https://semos.ai/, https://semos.ai/terms_of_manager_ai_agent_service/
- schole-learn-by-building: free-plan limit. The Free card says "Try any 2 lessons" and the comparison table says "1 Lesson" / "1 Total". Both are kept and attributed. Teams $95 is shown against a struck-through $119. The billing note now quotes the FAQ ("Plans are annual, billed monthly") next to the monthly/yearly toggle, and the refund FAQ is added. Source: https://schole.ai/pricing
- unabyss-for-claude: annual vs monthly. The site's plan data and the struck-through card prices confirm Pro $13 annual / $15 monthly, Max $79 / $89 and Team $39 / $49 per seat. Price strings, intro, note, FAQ, starts_at and the body are updated. Source: https://unabyss.com/#pricing
- velo-3-0: yearly prices are Pro $41 and Ultra $167 a month (toggle and FAQ). Credits have also changed: Free 500, Pro 1,000 (12,000/yr), Ultra 6,000 (72,000/yr), and Ultra now covers about 30–60 minutes. The old 1,500/3,000/30,000 figures and the 150 credits/min claim are removed. The page claims "save 20%", but the real saving is about 16–17%; the note says both. Body and FAQ updated. Source: https://www.usevelo.ai/pricing/
- tencent-edgeone-makers: the Personal plan is $1.4/month, with $4.2 struck through (CSS line-through on the "discount" element). The page gives no end date for the discount. Plan, note, FAQ, con and body updated. Source: https://edgeone.ai/pricing
- thumbmagic-5: both refund statements are now quoted with their page. Pricing page: "No setup fees • Cancel anytime • 30-day money-back guarantee". Terms §7 (TURBO STUDIO S.A.S.): "All monthly and annually purchases are non-refundable." Also added: the pricing page offers "3 free thumbnails" and a Monthly/Yearly toggle ("Save 40%"). Monthly prices aren't in the served HTML, so the profile says "see the official pricing page". FAQ, cons, not_fit, starts_at and body updated. Sources: https://app.submagic.co/thumbnail-generator/pricing, https://www.thumbmagic.co/terms-of-use
- zaro: the current site (enterprise "make your company AI-ready" context layer, no public pricing; /pricing redirects home) matches the profile. The body now states the change from the June 2026 launch pitch (build self-updating apps from your Gmail/Slack/notes, free options), and a "Has Zaro changed" FAQ is added. Sources: https://zaro.ai/, https://zaro.ai/platform
- yansu: the current site matches the profile (prices unchanged). The pivot claim is confirmed and now specific: introduced Nov 2025 as "the serious coding platform", launched on PH May 2026 as AI that turns how you work into software, and now a proactive desktop AI. An FAQ and the Isoform blog source are added. Sources: https://yansu.app/, https://isoform.ai/blog/introducing-yansu-the-serious-coding-platform, https://x.com/i/status/1986101253903208829
- rindler: the home page now only promotes Maxxwell ("the IDE for optimal tokenmaxxing", a free desktop app for managing coding agents at maxxwell.dev). Pricing/About/FAQ pages are still live and unchanged. Body, pricing note and a new FAQ say so and advise confirming the service is still sold. Maxxwell is added as a source. Sources: https://rindler.com/, https://rindler.com/pricing, https://maxxwell.dev/
- recordmeeting: consent wording made neutral. Recording laws vary by country and US state; some allow one-party consent, others require every participant's consent. Removed the blanket "illegal in many places". Body, FAQ, con, not_fit and the criticised theme updated (commenter wording checked against the local PH extract `_ph-ac/recordmeeting.json`). Source: https://recordmeeting.com/
- pollyreach: pricing is now published. Star $20, Pro $40, Max $100 a month (2,000/4,000/10,000 credits), or $17/$34/$85 billed yearly ("Save 15%"). The page doesn't say what a credit buys. Plans, intro, URL, FAQ, not_fit, starts_at, body and a source are updated. Source: https://pollyreach.ai/pricing.html
- peakroutine: still no prices on the site (/pricing is 404). The intro now mentions the FAQ's Free vs Pro split. Source: https://www.peakroutinehealth.com/
- referent-2: still no prices (/pricing is 404). The site is a private beta, and the apply page says plans and trial terms are discussed on the call. Intro updated and the apply page added as a source. Sources: https://referent.law/, https://referent.law/apply/
