# Shark Tank India brand file: schema

One JSON file per brand at `content/shark-tank/season-N/<slug>.json`. Plain JSON (no comments).
Check files without uploading (no credentials needed):

    python3 content/upload-shark-tank.py --check content/shark-tank/season-2

The check prints, per file, which pitch and "now" fields are sourced and whether the file meets the
publishing bar. It exits non-zero if any file is malformed.

## Shape

```
{
  "name": "Brand name",                         // required
  "slug": "brand-slug",                         // optional; defaults to existing_listing_slug, else the name slugified
  "existing_listing_slug": null,                // slug of an existing xf_startup listing on 100xfounder.com, or null
  "website": "https://brand.com",
  "tagline": "One line in our words",
  "industry_term": "food-drinks",               // required: an existing xf_industry slug (see _industries.json)
  "industry_new": "Name",                       // only when no existing term fits; then industry_term is the new slug
  "excerpt": "1-2 sentences, our words",
  "content": "<p>150-300 words, our words. No number that isn't in the fields below with a source.</p>",
  "shark_tank": {
    "season": 1,                                // required
    "episode": 4,                               // episode or air_date required
    "air_date": "2021-12-23",                   // YYYY-MM-DD
    "ask_amount": 5000000,                      // INR, plain number
    "ask_equity": 5,                            // percent
    "ask_valuation": 100000000,                 // INR (ask_amount / ask_equity * 100)
    "deal": {
      "made": true,                             // required: true or false
      "amount": 7500000,                        // INR (equity part only)
      "equity": 15,                             // percent
      "implied_valuation": 50000000,            // INR
      "sharks": ["Aman Gupta", "Peyush Bansal"],
      "terms": "Plus ₹25 lakh debt at 12% interest"   // debt, royalty or conditions, as reported
    },
    "pitch_revenue": {"value": 30000000, "period": "FY21", "label": "Sales"},  // optional, only if reported
    "founders": ["Name"],
    "city": "Pune",
    "category": "Snacks",                       // free text shown on the panel; the directory category is industry_term
    "pitch_summary": "2-3 sentences, our words",
    "sources": [{"label": "Outlet: headline", "url": "https://..."}]   // required for the pitch facts
  },
  "now": {
    "status": "operating",                      // operating | acquired | shut down | unknown
    "status_source": {"label": "...", "url": "..."},
    "latest_revenue": {"value": 1000000000, "fiscal_year": "FY24", "label": "Operating revenue", "date": "2024-11-02", "source": {"label": "...", "url": "..."}},
    "latest_funding": {"round": "Series A", "amount": 250000000, "date": "2024-03", "source": {"label": "...", "url": "..."}},
    "latest_valuation": {"value": 3000000000, "date": "2024-03", "source": {"label": "...", "url": "..."}},
    "notable_since_show": [{"date": "2023-05", "event": "Our words", "source": {"label": "...", "url": "..."}}],
    "checked_date": "2026-10-14"
  },
  "notes": "Internal only, never published: conflicts between sources, deals that did not close, gaps."
}
```

Money is rupees as a plain number: ₹1 crore = 10000000, ₹1 lakh = 100000. A `source` may be an object
`{"label", "url"}` or a bare URL string. Accepted aliases: `industry` for `industry_term`, `text` for
`event`, `existing_id` alongside `existing_listing_slug`.

## Rules

- **Leave a field out rather than guess.** Revenue, valuation and funding are never estimated; the page says
  "Not publicly disclosed" where a field is missing.
- Every `now` number has its own `source` and date. Pitch facts are covered by `shark_tank.sources`.
- A number shown on the page without its own source is dropped: `latest_*` without a `source` is ignored.
- `pitch_summary`, `content`, `excerpt`, `tagline` and every `event` are our own words.
- No ratings of any kind.
- **Publishing bar** (core pitch facts sourced): `season`, `episode` or `air_date`, `ask_amount`, `ask_equity`,
  `deal.made` and at least one `shark_tank.sources` entry with a URL. Files below the bar import as drafts.
- **Until 1 November 2026 nothing is published** (owner): the importer's default `--status pending` creates
  pending listings and keeps the badge, panel and filter hidden.


## Founder photos (owner, 2026-10-14)
media.founder_photos may come from: the brand's own website/press kit or official company social accounts (credit "Photo: {Brand}"); Wikimedia Commons / Creative Commons with a licence that allows commercial reuse (credit author + licence); or photos the founder sends us. Never news-agency/newspaper photos, LinkedIn or personal social profile photos, broadcast screenshots or stock. Store source_type with each photo.

## Listing extras (added 2026-10-14 by the shark-tank-research-daily run)

Optional top-level fields that feed the rest of the listing panel. Leave any of them out rather than guess.

```
"deal_closed": {"status": "closed",            // closed | not closed | partly closed | unknown
                "detail": "Our words, e.g. founders said post-show that only two sharks completed",
                "source": {"label": "...", "url": "..."}},
"pitch_video": {"youtube_id": "abc123XYZ",     // ONLY uploads by Shark Tank India / Sony LIV / SET India channels
                "channel": "Shark Tank India", "title": "...", "url": "https://www.youtube.com/watch?v=...",
                "upload_date": "2022-01-10"},
"sonyliv_url": "https://www.sonyliv.com/shows/shark-tank-india-.../...",   // official episode page; linked nofollow
"media": {
  "logo":    {"url": "...", "credit": "Logo: Brand", "source_url": "page it came from", "source_type": "brand_site"},
  "gallery": [{"url": "...", "alt": "...", "credit": "Photo: Brand", "source_url": "...", "source_type": "brand_site"}],
  "founder_photos": [{"url": "...", "name": "...", "credit": "...", "source_url": "...", "source_type": "brand_site"}]
},                                              // source_type: brand_site | press_kit | official_social | commons | founder_sent
"social": [{"platform": "instagram", "url": "...", "followers_text": "1.2M followers", "checked_date": "2026-10-14"}],
"where_to_buy": [{"label": "Official store", "url": "..."}],          // linked nofollow
"prices": [{"product": "...", "price": 499, "currency": "INR", "date": "2026-10-14", "source_url": "..."}],
"shark_quotes": [{"shark": "Aman Gupta", "quote": "25 words max, as reported", "source": {"label": "...", "url": "..."}}],
"faq": [{"q": "Is X still in business?", "a": "Our words, only sourced facts"}],   // HTML only, no FAQPage schema
"lessons": ["2-4 points: our analysis, labelled as such on the page"],
"related_pitches": ["other-brand-slug"]
```

No broadcast screenshots, stock photos, news-agency photos or personal-profile photos in `media`.
A file is **complete** when it meets the publishing bar above and also names the sharks (if a deal was made)
and the founders, all covered by `shark_tank.sources`.
