# Shark Tank India brands: research progress

Started 2026-10-14. Owner decision (2026-10-14): **no separate section**. Shark Tank brands are ordinary
`xf_startup` listings in the /startups/ directory, filed under their real business category (an existing
`xf_industry` term, never a "Shark Tank" term). Shark Tank shows only as a badge, a "Shark Tank India: at the
pitch vs now" panel on the listing, and a "Shark Tank India" checkbox filter in the directory.

Code: `wordpress/100xfounder/includes/shark-tank.php` (meta `_xf_shark_tank`, REST `/xf/v1/shark-tank`).
Upload: `XF_WP_USER=author XF_WP_APP_PASSWORD="$(security find-generic-password -s 100xfounder-wp -w)" python3 content/upload-shark-tank.py --status pending content/shark-tank/season-N`
(`--check <dir>` validates files offline; `--dry-run` needs credentials for slug/term lookups). Brand files live at `content/shark-tank/season-N/<slug>.json` (see SCHEMA.md).

**2026-10-14:** code built (not deployed). Research run stopped by the owner before any brand file was written; daily research moved to 12:30 IST from 2026-10-15. Complete brand files: 0.

## Rules (from CLAUDE.md)
- Every number carries a source. Never estimate revenue, valuation or funding: leave the field out and the page says "not publicly disclosed".
- Pitch facts: official SonyLIV/Sony pages or major outlets' episode recaps (Economic Times, Moneycontrol, Mint, Business Standard, Indian Express, India Today, NDTV, YourStory, Inc42, Entrackr). Cite each.
- "Now" facts: filings as reported by Entrackr / Inc42 / ET / Moneycontrol / YourStory / Business Standard, official company announcements, or MCA-based reports. Each number has its own source and date. On conflicts, prefer the most recent filing-based figure and say so in `notes`.
- Write `pitch_summary`, `content` and every `notable_since_show[].text` in our own words. No copied sentences.
- `industry` must be a slug from `_industries.json` (the live site's terms). Pick what the company actually does. Only propose a new term (as `industry_new: "Name"`) if nothing fits.
- No ratings anywhere.
- A brand uploads as **published** only when the core pitch facts are sourced: season, episode or air_date, ask_amount, ask_equity, deal.made, and at least one pitch source. Otherwise it stays a draft.

## Brand file shape (`content/shark-tank/<slug>.json`)
```json
{
  "slug": "brand-slug",               // reuse the live listing's slug if one exists (check /wp-json/wp/v2/xf_startup?search=)
  "name": "Brand", "website": "https://…", "tagline": "one line, our words",
  "industry": "food-drinks",
  "excerpt": "1–2 sentences, our words",
  "content": "<p>150–300 words, our words: what the company does, the pitch, what happened after. No unsourced numbers.</p>",
  "shark_tank": {
    "season": 1, "episode": 4, "air_date": "2021-12-23",
    "ask_amount": 5000000, "ask_equity": 5, "ask_valuation": 100000000,          // INR, percent, INR
    "deal": {"made": true, "amount": 7500000, "equity": 15, "implied_valuation": 50000000,
             "sharks": ["Aman Gupta", "Peyush Bansal"], "terms": "plus ₹x debt at y% (only if reported)"},
    "pitch_revenue": {"value": 30000000, "period": "FY21", "label": "Sales"},     // only if stated on the show and reported
    "founders": ["…"], "city": "…", "category": "Snacks",
    "pitch_summary": "2–3 sentences, our words",
    "sources": [{"label": "Outlet: headline", "url": "https://…"}]
  },
  "now": {
    "status": "operating | acquired | shut down | unknown",
    "status_source": {"label": "…", "url": "…"},
    "latest_revenue":   {"value": 1000000000, "fiscal_year": "FY24", "label": "Operating revenue", "date": "2024-11-02", "source": {"label": "…", "url": "…"}},
    "latest_funding":   {"round": "Series A", "amount": 250000000, "date": "2024-03", "source": {"label": "…", "url": "…"}},
    "latest_valuation": {"value": 3000000000, "date": "2024-03", "source": {"label": "…", "url": "…"}},
    "notable_since_show": [{"date": "2023-05", "text": "our words", "source": {"label": "…", "url": "…"}}],
    "checked_date": "2026-10-14"
  },
  "notes": "internal only, not published: conflicts, deals that did not close, gaps"
}
```
All money is in rupees as a plain number (₹1 crore = 10000000, ₹1 lakh = 100000). Leave a field out rather than guess.

## Status
See the table below (updated by each research batch). Columns: pitch facts sourced (of 6: season, episode/date, ask amount, ask equity, deal made, deal terms), now fields sourced (status, revenue, funding, valuation), uploaded.

| slug | S | Ep | pitch /6 | now /4 | uploaded |
|---|---|---|---|---|---|
