# Monthly routine: "Breakout startups" on the 100X Meter

Runs on the 1st of each month at 09:00 IST (scheduled task `100xfounder-monthly-breakout`, cron `0 9 1 * *`), on the owner's Claude plan. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md` and `content/BRIEF.md` first. Every BRIEF rule applies; this file only adds what is specific to this piece.

## 1. Get last month's breakouts
```
curl -s "https://100xfounder.com/wp-json/xf/v1/meter-breakouts?month=YYYY-MM"
```
`YYYY-MM` is last month (leave `month` out and the endpoint uses last month). It returns the published startups whose 100X Meter first crossed 50X that month: `name`, `url` (our listing), `website`, `tagline`, `crossed_50x_at`, `reached_100x_at`, `level_now`, `stage_now`, `taps_30d`, `taps_total`. It is public and cached for an hour.

**Stop and report, writing nothing, if `count` is 0 or 1.** One startup is a listing, not a roundup. Never fill the piece with startups that did not cross 50X.

## 2. What the meter is (say it plainly in the article)
The 100X Meter counts reader taps on a startup's 100xFounder listing over the last 30 days, one tap per reader per day. It measures reader buzz on our site, **not quality, traction, revenue or a rating**. Write it that way in the opening section and once more near the end. Never call a startup "top-rated", "best" or "most successful" because of its meter level. Never put meter figures into rating schema or compare them with Product Hunt, G2 or app-store ratings.

The meter figures (level, taps, the date it crossed 50X) come from the endpoint above; cite it as "100xFounder 100X Meter data, <month>" in the Sources list.

## 3. Research each startup
For every startup in the list:
- Start from our listing (`url`) and the company's own website (`website`): what it does, who it is for, pricing from its own pricing page (dated).
- Add what reputable outlets have published (BRIEF's source list; never ANI). Funding, founders, customers and numbers only when a fetched source says so, with publisher and date. If there is nothing reliable beyond the company's own site, describe the product from the site and leave everything else out.
- Founders: names only when the company's site or a reputable outlet names them. Nothing about private life. No net worth, valuation or revenue estimates.

## 4. Write
- **Title:** "Breakout startups of <Month YYYY> on the 100X Meter" or a sharper variant, 55–70 characters. **Slug:** `breakout-startups-<month>` (for example `breakout-startups-october`). The month is part of the piece's name, so it stays; never add a year to the slug. Category: `startup-news`.
- **Length:** follow BRIEF. Aim for its 1,800–2,500 words when the research supports it; with only a few startups and thin coverage, write less rather than pad, but **never under 500 words**. Below 500 sourced words, stop and report instead of publishing.
- **Structure:** a short opening that names the startups and the month; a "How the 100X Meter works" section (see 2); one H2 per startup (what it does, who it's for, pricing, what's been reported, its meter figures); "Key takeaways", FAQ (4–6 questions) and the Sources list as BRIEF describes. Internal links: each startup's listing, `/launches/`, and the meter explainer `/100x-meter/` if it is live.
- **Images:** BRIEF's rules (Wikimedia Commons or Openverse; PD, CC0, CC BY, CC BY-SA only). Use 5 when good ones exist, **never fewer than 2**. Company logos and screenshots from company sites are not openly licensed: don't use them. The startups' 100X share cards (`/wp-json/xf/v1/meter-card/<id>.png`) are ours and may be used as images 2–5, credited "Image: 100xFounder".
- **No sponsorship:** a meter level can't be bought. If a startup in the list has a paid listing or sponsored article with us, say so in one line next to it.

## 5. Self-review gate (BRIEF's, plus these)
- Every startup in the article is in the endpoint's list for that month, and every one in the list is in the article (or you say why it was left out).
- Meter figures match the endpoint's output exactly.
- Every other fact maps to a fetched source in `sources`. Nothing copied.
- 500+ words, 2+ openly licensed images with credits, valid JSON (`python3 -m json.tool`).
- Would a careful editor publish it as is? If not, don't.

## 6. Publish
Save as `content/drafts/monthly-breakout-YYYYMM-<slug>.json` (BRIEF's JSON format) and schedule it with the daily routine's uploader, which slots it into the four-a-day pace:
```
python3 content/upload_rest.py --per-day 4 content/drafts/monthly-breakout-YYYYMM-*.json
```
Report the title, word count, image count, the startups covered and anything left out for lack of sources.
