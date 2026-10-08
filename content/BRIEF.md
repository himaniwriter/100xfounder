# Writing brief for 100xfounder.com long reads (batch of 100, October 2026)

Read this, `CLAUDE.md` and `docs/STYLE_GUIDE.md` before writing. Today is 4 October 2026.

## The site
100xfounder.com: startup and AI news, founder stories, jobs from official careers pages, and free salary tools. Audience: founders, operators and job seekers in India **and internationally** (US, Canada, UK, Germany/EU). Write so a global reader follows it; explain Indian terms (LPA, crore) once when used.

## Each article
- **Length:** 1,800–2,500 words of real substance. No padding, no repeated points, no generic filler intros ("In today's fast-paced world…").
- **Structure:** a 2–3 sentence opening that answers the search intent immediately; 5–9 sentence-case H2s; H3s where useful; a "Key takeaways" `<ul>` near the top (3–5 bullets); a "Why it matters" or "Bottom line" section; an FAQ H2 with 4–6 short Q&As (real questions people search); a final `<h2>Sources</h2>` `<ol>` listing every source as `Publisher, "Title", date` with a link (like news sites do).
- **Sourcing:** every number, date, quote, ranking, price and claim about a real person/company comes from a source you actually fetched. Inline attribution: "according to <a href=…>Publisher</a>". Prefer primary sources (company newsroom/blog/filings, regulators, official statistics, research reports), then reputable outlets (Reuters, Bloomberg, FT, TechCrunch, The Verge, Wired, CNBC, Economic Times, Mint, Business Standard, Moneycontrol, Inc42, Entrackr, The Ken, YourStory, Forbes India, Handelsblatt, Les Affaires, BetaKit, Sifted). **Never use ANI (aninews.in, ani.in) or sites that republish ANI copy.** No content farms. Never invent anything; if you can't source it, leave it out. Never estimate net worth, valuation or revenue; only quote published figures with their date and publisher. Write in your own words; quotes only short and attributed. Pricing and feature claims for tools must come from the vendor's own page, dated.
- **Internal links (2–5, relative hrefs, only where relevant):** `/jobs/`, `/jobs/company/<slug>/` (companies on our board: agoda, airbnb, anthropic, atlan, coinbase, cred, databricks, druva, elastic, elevenlabs, fampay, figma, gitlab, glean, groww, hevo-data, highradius, meesho, mindtickle, mongodb, new-relic, notion, observe-ai, okta, openai, paytm, rubrik, sarvam-ai, sigmoid, stripe, tekion, toast, vercel, zeta, zscaler), `/jobs/ai-ml-jobs/`, `/jobs/engineering-jobs-in-bengaluru/`, `/tools/in-hand-salary-calculator/`, `/tools/salary-hike-calculator/`, `/tools/notice-period-buyout-calculator/`, `/funding-tracker/`, `/launches/`, `/news/`.
- **Title:** 55–70 characters, specific, keyword first, no clickbait, include the year where it helps search. **Excerpt:** 140–160 characters. **Slug:** short, keyword-rich, lowercase-hyphenated.
- **Not advice:** for tax, legal, immigration or investment topics add one line telling readers to confirm with a qualified professional/official source.

## Images: exactly 5 per article, openly licensed only
Use Wikimedia Commons or Openverse. Accept only: Public domain, CC0, CC BY, CC BY-SA (any version). Reject NC/ND, "fair use", logos marked non-free, and anything without a clear licence. Never use photos from news sites, Getty, Shutterstock or company sites (unless an official press kit that grants media use; cite it).

Find them with Bash + curl (no key needed):
- Commons: `curl -s 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrsearch=QUERY&gsrlimit=10&prop=imageinfo&iiprop=url|extmetadata|size&iiurlwidth=1600&format=json'` → use `thumburl` (1600px) as `url`, `descriptionurl` as `source_page`, `extmetadata.LicenseShortName` as `license`, `extmetadata.Artist` (strip HTML) as the author.
- Openverse: `curl -s 'https://api.openverse.org/v1/images/?q=QUERY&license=by,by-sa,cc0,pdm&page_size=10'` → `url`, `foreign_landing_url` as `source_page`, `license` + `license_version`, `creator`.

Choose images that genuinely illustrate the section (place, product category, concept, person where a free photo exists). Image 1 is the featured image (landscape, ≥1200px wide). Write a descriptive `alt` (what's in the image) and a short `caption`. `credit` format: `Photo: <Author> / <Wikimedia Commons|Openverse source>, <licence>`.

In the content HTML, put the markers `<!-- xf-image-2 -->` … `<!-- xf-image-5 -->` on their own lines where images 2–5 belong (spread through the article, after a relevant paragraph). Image 1 is the featured image and gets no marker.

## Output: one JSON file per article
Save to `content/drafts/<batch>-<slug>.json` and validate with `python3 -m json.tool`:

```json
{
  "type": "post",
  "slug": "keyword-rich-slug",
  "title": "…",
  "excerpt": "…",
  "category": "one of: funding, startup-news, ai-news, fintech, ai-deeptech, ecommerce, consumer-d2c, saas, healthtech, ev-mobility, web3, spacetech, gaming, reports, careers-salary, global, founder-stories, in-depth",
  "tags": ["≤8 tags"],
  "content": "<p>…</p> … <!-- xf-image-2 --> … <h2>Sources</h2><ol>…</ol>",
  "images": [
    {"url": "https://upload.wikimedia.org/…", "alt": "…", "caption": "…", "credit": "Photo: … / Wikimedia Commons, CC BY-SA 4.0", "license": "CC BY-SA 4.0", "source_page": "https://commons.wikimedia.org/wiki/File:…"}
  ],
  "sources": [{"url": "…", "publisher": "…", "date": "YYYY-MM-DD", "claim": "what it supports"}]
}
```

Allowed HTML: `p, h2, h3, ul, ol, li, a, strong, em, blockquote (real quotes only), table, thead, tbody, tr, th, td`. At least 8 sources per article.

## Self-check before saving (fix anything that fails)
- Word count 1,800–2,500 (`python3 -c` on the stripped content).
- Every figure maps to a source in `sources`; no ANI; nothing copied.
- 5 images, all with an accepted licence, credit, alt and source_page; markers 2–5 present once each.
- Title 55–70 chars, excerpt 140–160 chars.

In your final reply list each file with title, word count, image count and anything you left out for lack of sources. Keep the reply short.
