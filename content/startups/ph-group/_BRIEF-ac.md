# Brief for part-ac profile writers (read fully before starting)

Repo: /Users/lovishmadaan/100xfounderoct. Read CLAUDE.md "Non-negotiable rules" and `.claude/skills/write-startup-profile/SKILL.md`.
Shape: top comment of `wordpress/100xfounder/includes/startup-profile.php`. Finished examples: `content/startups/foley.json` (deep format, copy its structure) and `content/startups/launchreel.json`.
Today is 2026-10-14. Use `/usr/bin/python3` (plain `python3` is broken on this Mac).

## Inputs per product
- `content/startups/ph-group/_ph-ac/<ph-slug>.json` — already extracted from the Product Hunt launch page: product (name, tagline, description, websiteUrl, reviewsCount/reviewsRating, followers, social links), launch (featuredAt = launch date in PT, dailyRank, points = upvotes, commentsCount, makers, media = gallery image uuids + official video url), comments (author, text, `ai` = PH's AI-detection confidence, `badges` contains "maker" for makers; comment link = `https://www.producthunt.com/products/<product.slug>?comment=<id>`).
- If the file has no product name, re-run `/usr/bin/python3 content/startups/ph-group/ph_extract.py <url> <out>` once (PH rate-limits: 429 → wait 60s; never more than 1 request per 10s). If `launch` is empty, try `https://www.producthunt.com/products/<product.slug>/launches/<ph-slug>`. If still empty, use only what the product block gives and say less.
- PH alternatives: try `curl` of `https://www.producthunt.com/products/<p>/alternatives` (same UA as ph_extract.py) and read names; otherwise pick 2–3 well-known like-for-like tools yourself. Only set `ph_url` for alternatives you saw linked.

## Per product
1. Official site: WebFetch the homepage, /pricing, /about, /contact, /faq, /privacy or /terms (for company name, postal country, contact email). Pricing ONLY from the startup's own site. If none: `"starts_at": "Pricing not published"` and a pricing block with that intro and no plans. Give `amount` only to plans buyable today.
2. Alternatives (2–3): quote prices only from each alternative's own pricing page; if it won't render, "See its pricing page". PH ratings as text fields `ph_rating`/`ph_reviews` only if you saw them.
3. Gallery: up to 4 `media` images of type image. Download `https://ph-files.imgix.net/<uuid>?auto=format&fit=max&w=800` with curl to the scratch dir and LOOK at each with Read before writing alt text. Skip ones showing real people's photos or that you can't read. Gallery url format: `https://ph-files.imgix.net/<uuid>?auto=format&fit=max&w=1400`, add `"credit": "Image: <Product> on Product Hunt"`, `w`,`h`.
4. `video_url` only if media has a YouTube/Vimeo/Loom url.
5. `launch_story`: the maker's first comment in our own words (2 short paragraphs), attribution "<Name>, maker, on Product Hunt", url = that comment link.
6. `opinions`: themes liked/asked/criticised from real comments; 2–3 quotes ≤25 words, skip any comment with `ai` ≥ 0.5 or obviously generic praise; author + comment url. Include maker reply in `community.quotes[].reply` when informative.
7. `team`: PH makers [{name, role (from their PH headline, kept factual), url: https://www.producthunt.com/@<username>}]. Founder photos (`photo`, `photo_credit`, `photo_source_type`): ONLY from the startup's own site/about/team page or official company social account, or a CC licence allowing commercial reuse. Never LinkedIn, personal X/Instagram avatars, PH avatars, news photos, stock. If none, omit.
8. X: one WebSearch with allowed_domains ["x.com"] for the product; link only posts truly about it; else `"none": "We found no posts about <Product> on X yet."` plus search_url.
9. `ph`: {rank: dailyRank as int (null if none), votes: points, comments: commentsCount, followers, launched: YYYY-MM-DD from featuredAt, as_of: "2026-10-14"}. `reviews`: {count: product.reviewsCount, rating: reviewsRating only if count>0 else null, url: .../reviews, as_of}. PH ratings are text only — never add aggregateRating or any schema rating.
10. FAQ 5–7 answering what commenters asked plus price/what-is/alternatives. `sources`: every page you fetched that a fact came from.
11. `content`: 3–4 `<p>` paragraphs (what it does, who made it + PH launch result, closing `<em>We have not tested X ourselves…</em>`). `excerpt` ≤ 160 chars. Plain, specific, no hype, British-neutral simple English. Never invent facts (funding, founding year, location, user counts) — if not on a fetched page, leave it out. Name people only as public pages name them.

## Output
Write `content/startups/ph-group/profiles/<ph-slug>.json` = {"slug": "<ph-slug>", "ph_url": "<input PH url>", "existing_listing_slug": null, "website": "<official url>", "excerpt", "content", "profile": {...}}. existing_listing_slug is null for all of part-ac (checked 2026-10-14 via the WP REST search) unless you find otherwise. Validate with `/usr/bin/python3 -m json.tool <file> >/dev/null`.

## Contact email
A public BUSINESS email that the company itself publishes (its site contact/about/press/support page, privacy policy, terms, imprint, or its own docs). Not guessed patterns, no people-search tools, no LinkedIn, no names/phones from any WhatsApp chat. Record which page it came from. Skip it if the email already appears in `content/startups/outreach-campaign.csv`, `outreach-campaign-producthunt.csv` or any `content/startups/ph-group/contacts-*.csv`.
Do NOT write to contacts-ac.csv yourself. Instead, in your final report give one line per product:
`<ph-slug> | <email or NONE> | <source page url> | <first name of first PH maker or blank> | <Startup name>`

## Do not
Upload, publish, or call any 100xfounder.com write endpoint. Do not edit files outside `content/startups/ph-group/profiles/` (and your scratch dir).
