# Brief: startup profile writers, 2026-10-15

Repo: /Users/lovishmadaan/100xfounderoct. Read CLAUDE.md "Non-negotiable rules", `.claude/skills/write-startup-profile/SKILL.md`, and the shape at the top of `wordpress/100xfounder/includes/startup-profile.php`. Copy the structure of `content/startups/foley.json` (deep format). Today is 2026-10-15. Use `/usr/bin/python3`.

## Inputs
- `content/startups/_ph-2026-10-15/<listing-slug>.json`: Product Hunt data already extracted (product, launch with dailyRank/points/commentsCount/featuredAt/makers/media, comments with `ai` = PH's AI-detection confidence; comment link = `https://www.producthunt.com/products/<product.slug>?comment=<id>`).
- Existing listing: `https://100xfounder.com/startup/<listing-slug>/` (read-only; its text is in `content/backups/startup-<listing-slug>-2026-10-15.json`).
- PH alternatives/makers pages: `curl -sL -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36" https://www.producthunt.com/products/<p>/alternatives` and read names/ratings from the server-rendered data; at most 1 PH request per 10 s, on 429 wait 60 s. Only set `ph_url`/`ph_rating` for alternatives you actually saw.

## Depth (owner's benchmark: a Product Hunt product page)
1. **Pricing**: only from the company's own pages: exact plans, amounts, currency, `checked: "2026-10-15"`, `url`. If none: `starts_at: "Pricing not published"` and a pricing block with that intro and no plans. `amount` only on plans buyable today.
2. **Gallery**: up to 8 `media` images (type image). Download `https://ph-files.imgix.net/<uuid>?auto=format&fit=max&w=800` to your scratch dir and LOOK at each with Read before writing alt text. Skip images of real people's photos or anything unreadable. Item: `{"url": "https://ph-files.imgix.net/<uuid>?auto=format&fit=max&w=1400", "alt", "credit": "Image: <Product> on Product Hunt", "w", "h"}`. `video_url` only if a media item is an official YouTube/Vimeo/Loom url.
3. **launch_story**: the maker's first comment in our own words (2–3 short paragraphs), attribution "<Name>, maker, on Product Hunt", url = comment link.
4. **opinions**: themes liked/asked/criticised from real comments + 4–6 quotes ≤25 words each (never whole comments), skipping comments with `ai` ≥ 0.5 and makers' own comments; author + comment url. If fewer genuine comments exist, use fewer and say nothing more. Put informative maker replies in `community.quotes[].reply`.
5. **pros / cons**, **use_cases**, **audience {fit, not_fit}**.
6. **team**: PH makers [{name, role (factual, from PH headline), url: https://www.producthunt.com/@<username>}]. Founder photos only from the company's own site/official accounts or commercial-reuse CC; else omit. For big-company feature launches (Google, Perplexity) list only the PH hunters/makers shown, don't research employees.
7. **ph**: {rank, votes, comments, followers, launched: YYYY-MM-DD, as_of: "2026-10-15"}. **reviews**: only when the PH product IS this product. For feature launches under a parent product page (e.g. `perplexity-ai`, `google`) do NOT include `reviews` at all: that rating belongs to the whole company.
8. **alternatives**: 3–5 items, each `{name, url, what (tagline), tags: [category tags], starts_at (from its OWN pricing page or "See its pricing page"), ph_rating, ph_reviews, ph_url (text only, only if seen), difference}`. If we already have a listing for an alternative (check `curl -s "https://100xfounder.com/wp-json/wp/v2/xf_startup?search=<name>&_fields=slug,title"` and confirm the title matches), set `url` to `https://100xfounder.com/startup/<slug>/`.
9. **community**: ph_url + X: one WebSearch with allowed_domains ["x.com"]; link only posts truly about the product; else `"none": "We found no posts about <Product> on X yet."` plus `search_url`.
10. **faq** 5–7 from what commenters actually asked plus price/what-is/alternatives. **sources**: every page a fact came from.
11. `content`: 3–4 `<p>` paragraphs (what it does, who made it + PH launch result, closing `<em>We have not tested <Product> ourselves…</em>`). `excerpt` ≤ 160 chars. Plain, specific, no hype. Never invent facts (funding, founding year, location, user counts). Never mention Digihandler or Lovish Madaan. Links to the startup's own site are rendered nofollow by the theme; don't add tracking params.

## Length rule (owner, 2026-10-15)
The rendered profile (content + all profile text fields) must be at least 500 words, and logo + gallery at least 2 images. Reach it with real, sourced detail only — never filler. Report your word count (count words of `content` stripped of tags plus every string value in `profile` except urls/credits/sources). If it can't honestly reach 500 or 2 images, say so.

## Output
Write `content/startups/<listing-slug>.json` = {"slug": "<listing-slug>", "excerpt", "content", "profile": {..., "checked": "2026-10-15"}}. Validate with `/usr/bin/python3 -m json.tool`. Do NOT upload, publish, or call any 100xfounder.com write endpoint; do not edit other files. Final report: per slug, word count, gallery count, pricing found or not, anything uncertain.
