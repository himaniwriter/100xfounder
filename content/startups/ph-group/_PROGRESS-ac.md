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
