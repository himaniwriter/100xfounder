---
name: write-startup-profile
description: Research a startup listing on 100xfounder.com (pricing, who it is for, alternatives, Product Hunt reviews and comments, X posts, screenshots) and publish it as a profile page. Use when the owner says "/write-startup-profile", "profile the startups", or asks to enrich startup pages.
---

# /write-startup-profile

Turns a thin startup listing into a researched page, like https://100xfounder.com/startup/launchreel/. Do **3–5 startups per run** (owner's credit limit). Read `wordpress/100xfounder/includes/startup-profile.php` (top comment) for the JSON shape, and `content/startups/launchreel.json` for a finished example.

## Per startup
1. **Get the right Product Hunt page.** The listing page (`https://100xfounder.com/startup/<slug>/`) links to the exact PH product. Names repeat on Product Hunt (LaunchReel exists twice), so use that link, never a guess from the name. Check the PH page title and tagline match the listing's tagline.
2. **Read three PH pages in the built-in browser** (`get_page_text`): `/products/<slug>`, `/products/<slug>/reviews`, `/products/<slug>/alternatives`. Take the day rank, points, follower count, comment count, review count and rating from what the page *displays*. The embedded JSON contains other products' ratings and misleads. Get the gallery image ids with JavaScript (`img[alt$="gallery image"]`), download each from `https://ph-files.imgix.net/<id>?auto=format&fit=max&w=1400`, and **look at each one** before writing its alt text. Screenshots stay on Product Hunt's host with credit; do not copy them.
3. **Official site**: fetch it (it may redirect to a new domain); take pricing, plans, limits, requirements, FAQ. Note the date you checked.
4. **Alternatives**: use the products PH lists plus any closer open-source or like-for-like tool you find by search. For each, fetch its own pricing page and quote only what that page states. If a page does not render, leave the price out ("See its pricing page"). Include PH's rating and review count for each alternative. If a tool is listed under "Built with", it is a component, not a rival.
5. **Community**: pick 2–3 genuine PH comments (skip ones PH labels "Likely AI"), quote briefly with the author's name, add the maker's reply when it is informative. For X, search with `allowed_domains: ["x.com"]`; link only posts that are truly about the product. If there are none, say so; related posts must be labelled as not about the product.
6. **Write** `content/startups/<slug>.json` ({slug, excerpt, content, profile}). Plain, specific, no hype. Say plainly that we have not tested the product. Every fact comes from a page you fetched; list those pages in `profile.sources`.
7. **Never invent a rating.** `reviews.count` is the real number of PH reviews; leave `rating` null when there are none. The uploader refuses a rating without reviews. Do not add aggregateRating by any other route.
8. **Upload**: `XF_WP_USER=… XF_WP_APP_PASSWORD=… python3 content/upload-startup-profile.py content/startups/<slug>.json`. The profile travels base64-encoded because Hostinger's firewall rejects some ordinary JSON.
9. **Logo**: `python3 content/fetch-startup-logos.py` (skips listings that already have one).
10. Verify the live page: all sections present, no stars, mobile has no sideways scroll. The `100xfounder-request-indexing` routine asks Google to index it.

## Never
Publish a star rating you cannot source, copy long passages, name a person beyond what a public page says about them, or attach a screenshot you have not looked at.

## Founder photos (owner, 2026-10-14)
For each team member, look for a founder photo and store it as `team[].photo` with `photo_credit` and `photo_source_type`. Allowed sources only:
1. The startup's own website (About/Team page, press kit) or the company's official social accounts. Credit "Photo: {Company}".
2. Wikimedia Commons or other Creative Commons images whose licence allows commercial reuse. Credit the author and licence.
3. Photos the founder sends us.
Never use news-agency or newspaper photos (PTI, ANI, Getty, Reuters, publication sites), LinkedIn or personal Instagram/X profile photos, or stock images. If no allowed photo exists, leave `photo` empty; the templates fall back to the product image.
