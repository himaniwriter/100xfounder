---
name: write-startup-profile
description: Research a startup listing on 100xfounder.com (pricing, who it is for, alternatives, Product Hunt reviews and comments, X posts, screenshots) and publish it as a profile page. Use when the owner says "/write-startup-profile", "profile the startups", or asks to enrich startup pages.
---

# /write-startup-profile

Turn a thin startup listing into a researched page like https://100xfounder.com/startup/launchreel/. **3–5 startups per run** (owner's credit limit).

Before writing, read `wordpress/100xfounder/includes/startup-profile.php` (top comment) for the `profile` JSON shape, and `content/startups/launchreel.json` for a finished example.

## Non-negotiables
- **Every fact comes from a page you actually fetched.** List those pages in `profile.sources`. No invented or estimated figures.
- **Ratings come only from real reviews.** `reviews.count` is the real number of PH reviews; set `rating` to null when there are none. The uploader refuses a rating without reviews — never add `aggregateRating` by any other route, and never put another platform's rating (Product Hunt, G2) into our schema. Show a borrowed rating as plain text with its source only.
- Plain, specific, no hype. State plainly that we have not tested the product.
- Don't copy long passages, don't name a person beyond what a public page says, don't attach a screenshot you haven't looked at.

## Per startup
1. **Find the exact PH product.** Use the link on `https://100xfounder.com/startup/<slug>/` — names repeat on PH (LaunchReel exists twice), so never guess from the name. Confirm the PH title and tagline match the listing.
2. **Read three PH pages via `get_page_text`:** `/products/<slug>`, `/products/<slug>/reviews`, `/products/<slug>/alternatives`. Take day rank, points, followers, comment count, review count and rating from what the page *displays* — the embedded JSON holds other products' ratings and misleads. Get gallery image ids with JavaScript (`img[alt$="gallery image"]`), download each from `https://ph-files.imgix.net/<id>?auto=format&fit=max&w=1400`, and look at each before writing its alt. Screenshots stay on PH's host with credit; don't copy them.
3. **Official site:** fetch it (may redirect to a new domain); take pricing, plans, limits, requirements, FAQ. Note the date checked.
4. **Alternatives:** PH's list plus any closer open-source or like-for-like tool found by search. Fetch each one's pricing page and quote only what it states (if it won't render, leave price out: "See its pricing page"). Include each alternative's PH rating and review count. A tool under "Built with" is a component, not a rival.
5. **Community:** 2–3 genuine PH comments (skip ones PH labels "Likely AI"), quoted briefly with the author's name, plus the maker's reply when informative. For X, search with `allowed_domains: ["x.com"]` and link only posts truly about the product; if there are none, say so, and label any related post as not about the product.
6. **Write** `content/startups/<slug>.json` (`{slug, excerpt, content, profile}`).
7. **Upload:** `XF_WP_USER=… XF_WP_APP_PASSWORD=… python3 content/upload-startup-profile.py content/startups/<slug>.json` (the profile is base64-encoded in transit because Hostinger's firewall rejects some plain JSON).
8. **Logo:** `python3 content/fetch-startup-logos.py` (skips listings that already have one).
9. **Verify the live page:** all sections present, no stars, no sideways scroll on mobile. The `100xfounder-request-indexing` routine asks Google to index it.

## Founder photos (owner, 2026-10-14)
For each team member, store a photo as `team[].photo` with `photo_credit` and `photo_source_type`. Allowed sources only:
1. The startup's own site (About/Team, press kit) or its official social accounts — credit "Photo: {Company}".
2. Wikimedia Commons / Creative Commons images whose licence allows commercial reuse — credit the author and licence.
3. Photos the founder sends us.

Never use news-agency or newspaper photos (PTI, ANI, Getty, Reuters, publication sites), LinkedIn or personal Instagram/X profile photos, or stock images. If no allowed photo exists, leave `photo` empty; the templates fall back to the product image.
