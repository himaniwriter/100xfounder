# Structured data audit: 100xfounder.com (2026-10-20)

Score: **68 / 100**

Scope: home; 5 articles (groww-q2-results, dailyobjects-series-c-funding, apple-pay-india-launch, model-context-protocol-mcp-explained, best-ai-for-coding; plus desible-ai-funding-bfsi and in-hand-salary-from-ctc spot checks); startups askagents, caldera-2, crosswalk, dagmor, nitrostack, sellio, foley; jobs anthropic, toast, druva, elevenlabs; guide databricks; /tools/startup-100x-score/; /leaderboard/; author page. All JSON-LD, `@context` https://schema.org, valid JSON everywhere, no Microdata/RDFa, no parse errors. Dates ISO 8601 with offset, URLs absolute.

Not flagged (owner policy): site-wide Product block (#product); no ratings in schema (none present, OK); PH ratings absent; meter taps absent from schema (leaderboard ItemList carries no rating, OK). FAQPage is not emitted although articles show a visible FAQ: correct, no action.

## Detection summary
| Page | Types |
|---|---|
| Home | Organization, WebSite+SearchAction, Product |
| Articles | NewsArticle, BreadcrumbList, Product |
| Guide | Article, BreadcrumbList, Product |
| Startup (rich) | SoftwareApplication (AggregateOffer), BreadcrumbList, Product |
| Startup (thin/noindex) | Organization (name/description/url/sameAs only), BreadcrumbList, Product |
| Startup (Dagmor) | BreadcrumbList, Product only |
| Job | JobPosting, BreadcrumbList, Product |
| Tool | WebApplication, BreadcrumbList, Product |
| Leaderboard | WebPage, BreadcrumbList, ItemList, Product |
| Author URL | 301 to /about/ (AboutPage, BreadcrumbList, Product) |

## Findings

### 1. HIGH. Article author name contradicts the declared byline policy and the About page
Evidence: groww-q2-results and desible-ai-funding-bfsi emit `author.name` "Lovish Madaan" (and show it as the visible byline), while the other articles and /about/ say the byline is the pen name "Ishaan Vardhan" and that articles are not by an individual reporter. Schema matches visible text per page, but the site is inconsistent, and a real person's name is attached to desk copy.
Fix: set author for all desk articles to the pen name (or fix the post author assignment in WP). See example A.

### 2. HIGH. JobPosting lacks validThrough on all 4 jobs checked
Evidence: all have `datePosted` (16 Oct, 16 Oct, 16 Oct, 21 Sep) but no `validThrough`, so Google cannot expire them and removed jobs may linger in Google for Jobs. Expired status could not be verified from the page (all four rendered as live). Anthropic role posted 21 Sep is the oldest; check it is still on the Greenhouse feed.
Fix: emit `validThrough` (ATS closing date if given, else datePosted + 30 days, refreshed on each sync) and remove or 410 jobs when the source drops them (already the owner rule). See example B.

### 3. MEDIUM. JobPosting location and detail inconsistencies
- Druva: visible "Hyderabad, Andhra Pradesh, India" vs schema `addressRegion: Telangana`. Schema is the correct one; fix the visible text (state mapping).
- ElevenLabs: `jobLocationType TELECOMMUTE` with `applicantLocationRequirements` only India, but the visible location is "India, UAE" ("India or Dubai"). Add the UAE country.
- Toast: `hiringOrganization` has `sameAs` only, no `logo` (Anthropic, Druva, ElevenLabs have one). Recommended.
- `identifier` is a PropertyValue named after the company with an ATS id: valid.
- No `baseSalary` (fine unless the ATS provides it; never invent). No `directApply`.
- `description` is HTML: allowed.

### 4. MEDIUM. Evergreen guides and explainers typed as NewsArticle
Evidence: model-context-protocol-mcp-explained, best-ai-for-coding, in-hand-salary-from-ctc (category "Reports") are `NewsArticle`; the how-to-apply guide correctly uses `Article`.
Fix: use `Article` (or `BlogPosting`) for non-news posts; keep NewsArticle for funding/news only.

### 5. MEDIUM. dateModified earlier than datePublished on scheduled posts
Evidence: groww-q2-results published 2026-10-17T20:20 but modified 2026-10-15T11:38; dailyobjects 10-19 vs modified 10-15; desible 10-18 vs 10-15. Invalid chronology (also in `article:modified_time`).
Fix: `dateModified = max(post_modified, datePublished)`.

### 6. MEDIUM. HTML entities leak into JSON-LD strings
Evidence: guide headline `"How to Get a Job at Databricks India in 2026: Process, Rounds &#038; Tips"`; Consumer D2C article `articleSection: "Consumer &amp; D2C"`. JSON-LD should hold plain text ("&"). Also the Groww headline appears fine ("F&O").
Fix: `html_entity_decode( wp_strip_all_tags( $title ), ENT_QUOTES, 'UTF-8' )` before `wp_json_encode`.

### 7. MEDIUM. Duplicate/unlinked entities (no @graph)
- Full Organization object is re-embedded as `publisher` in every article, guide, WebPage and AboutPage, and the home page has a separate Organization with `@id` #organization. Should be `{"@id": "https://100xfounder.com/#organization"}` references.
- WebSite has no `@id` and no `publisher`; Organization and WebSite are not connected; no WebPage/CollectionPage nodes with `isPartOf`.
- Author Person nodes have no `@id` and `url` is /about/ (the author archive 301s to /about/, so there is no Person profile). Add a Person (or Organization for the desk) entity with `@id`.
- Organization has only one `sameAs` (Instagram); add other real profiles if they exist (no invention). No `contactPoint`.
See example C.

### 8. MEDIUM. Thin startup profiles emit weak Organization schema; one has none
- caldera-2, crosswalk, nitrostack: `Organization` whose `url` is the product site and whose only `sameAs` is Product Hunt; the page is about a listing, and `sameAs` for caldera-2/nitrostack/foley contains a PH tracking URL (`?utm_campaign=producthunt-api&utm_source=Application: claudescraper ...`). Strip the query string.
- dagmor (indexable) has no entity schema at all.
- These are noindex (except dagmor), so low impact, but when they turn rich the type must change.
Fix: use `SoftwareApplication` consistently with `url` = our page, `sameAs` clean URLs; skip Organization for non-companies. Dagmor: either add SoftwareApplication or noindex.

### 9. LOW. SoftwareApplication (rich startups) polish
Evidence (sellio, foley): good: offers, screenshots, applicationCategory, image. Gaps: `Offer` has no `availability`/`url`; `operatingSystem` is a prose sentence ("Browser; Mac app available, Windows app listed as coming soon"), should be a short list; `datePublished` is our listing date, not the app's; `author` is the Product Hunt maker linked to PH (acceptable but label as `creator` only if sourced); no aggregateRating (correct, under 3 votes). Foley's Pro description embeds a time-limited promo ("$4 for the first month") that will go stale.

### 10. LOW. Leaderboard ItemList points at noindex pages
askagents (noindex, follow) and others in the ItemList are noindex; list items of noindex URLs give no value. Also the WebPage lacks `@id`/`isPartOf`. Keep tap rankings out of ratings (currently correct).

### 11. LOW. Breadcrumbs
All BreadcrumbLists valid: positions sequential, absolute `item`, last crumb without item (allowed). Observations: MCP and best-ai-for-coding use "Best AI tools" (/ai-tools/) as parent while articleSection is "In Depth", fine. Startup breadcrumb uses an industry like "GitHub" (caldera-2) that is not an industry: taxonomy data problem. Funding articles use /funding-tracker/ rather than the category: fine and consistent with visible crumbs.

### 12. LOW. Home and tool page
- Home lacks `@id` on WebSite and a `CollectionPage`; SearchAction target `/?s={search_term_string}` is valid.
- Tool WebApplication: valid; add `image`, `inLanguage`, `isAccessibleForFree: true`, and a `publisher` reference. Offer price "0" fine.
- Author/About: AboutPage fine; add `mainEntity` Organization.

## Missing opportunities
1. Person/Organization entity for the editorial desk with `@id`, linked from every article's `author`. 
2. WebPage/CollectionPage with `isPartOf` WebSite on home, archives, leaderboard.
3. `ItemList` on /jobs/, /startups/, funding-tracker (carousel-eligible for articles only; others are structural).
4. Event schema check on /event/ pages (not in scope sample; home lists 36 events).
5. `Dataset` for funding tracker and `VideoObject` only if real embeds exist.
6. JobPosting: `directApply`, `baseSalary` when ATS supplies, `validThrough`.
7. `speakable`/`isBasedOn` unnecessary; citation already good (9 to 26 CreativeWork items per article, valid).
8. Article `wordCount`, `thumbnailUrl` optional; image has a single size; add 16:9, 4:3, 1:1 variants for Discover.

## Example JSON-LD fixes

### A. Article (non-news explainer) with desk author and linked entities
```json
{
  "@context": "https://schema.org",
  "@graph": [
    {"@type": "Organization", "@id": "https://100xfounder.com/#organization", "name": "100xFounder", "url": "https://100xfounder.com/",
     "logo": {"@type": "ImageObject", "url": "https://100xfounder.com/wp-content/plugins/100xfounder/assets/brand/logo-512.png"},
     "sameAs": ["https://www.instagram.com/100x.founder/"]},
    {"@type": "WebSite", "@id": "https://100xfounder.com/#website", "url": "https://100xfounder.com/", "name": "100xFounder",
     "publisher": {"@id": "https://100xfounder.com/#organization"},
     "potentialAction": {"@type": "SearchAction", "target": "https://100xfounder.com/?s={search_term_string}", "query-input": "required name=search_term_string"}},
    {"@type": "Person", "@id": "https://100xfounder.com/#ishaan-vardhan", "name": "Ishaan Vardhan",
     "description": "Pen name of the 100xFounder editorial desk.", "url": "https://100xfounder.com/about/", "worksFor": {"@id": "https://100xfounder.com/#organization"}},
    {"@type": "Article", "@id": "https://100xfounder.com/best-ai-for-coding/#article",
     "headline": "Best AI for coding in 2026: Claude Code vs Copilot, Cursor and Codex",
     "datePublished": "2026-10-04T14:58:47+05:30", "dateModified": "2026-10-12T01:59:57+05:30",
     "image": ["https://100xfounder.com/wp-content/uploads/2026/10/hands-typing-on-a-laptop-showing-code-in-an-editor-on-a-wooden-desk.jpg"],
     "author": {"@id": "https://100xfounder.com/#ishaan-vardhan"},
     "publisher": {"@id": "https://100xfounder.com/#organization"},
     "isPartOf": {"@id": "https://100xfounder.com/#website"},
     "mainEntityOfPage": "https://100xfounder.com/best-ai-for-coding/",
     "articleSection": "In Depth", "inLanguage": "en"}
  ]
}
```

### B. JobPosting with validThrough, logo and corrected remote location
```json
{
  "@context": "https://schema.org",
  "@type": "JobPosting",
  "title": "Executive Assistant – India & Middle East",
  "description": "<p>...</p>",
  "datePosted": "2026-10-16T11:10:33+05:30",
  "validThrough": "2026-11-15T23:59:59+05:30",
  "employmentType": "FULL_TIME",
  "directApply": false,
  "hiringOrganization": {"@type": "Organization", "name": "ElevenLabs", "sameAs": "https://elevenlabs.io/",
    "logo": "https://100xfounder.com/wp-content/uploads/2026/10/elevenlabs-company-logo.png"},
  "jobLocationType": "TELECOMMUTE",
  "applicantLocationRequirements": [
    {"@type": "Country", "name": "India"},
    {"@type": "Country", "name": "United Arab Emirates"}
  ],
  "identifier": {"@type": "PropertyValue", "name": "ElevenLabs", "value": "ashby:c4e0d704-c7eb-4d6d-b71b-23bfd86fe463"},
  "url": "https://100xfounder.com/job/elevenlabs-executive-assistant-india-middle-east-e79585/"
}
```

### C. Rich startup listing, clean sameAs
```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Foley",
  "url": "https://100xfounder.com/startup/foley/",
  "sameAs": ["https://foleyapp.com/", "https://www.producthunt.com/products/foley"],
  "applicationCategory": "ProductivityApplication",
  "operatingSystem": "macOS, Windows, iOS, Android, Web",
  "offers": {"@type": "AggregateOffer", "priceCurrency": "USD", "lowPrice": 0, "highPrice": 8, "offerCount": 2,
    "offers": [
      {"@type": "Offer", "name": "Foley (free)", "price": 0, "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": "https://foleyapp.com/pricing"},
      {"@type": "Offer", "name": "Foley Pro", "price": 8, "priceCurrency": "USD", "availability": "https://schema.org/InStock", "url": "https://foleyapp.com/pricing"}
    ]}
}
```

## Score rationale
Strong base (valid JSON, correct breadcrumbs, thorough `citation`, solid SoftwareApplication, ratings policy followed). Deductions: byline conflict (-6), missing validThrough and job location detail (-9), wrong article type, date order, entity escaping (-8), no entity graph/duplicate publisher (-5), thin-profile schema (-4).
