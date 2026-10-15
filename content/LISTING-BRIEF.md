# Brief: B2B manufacturer listing articles (lead generation)

Read `content/BRIEF.md` too; everything there applies unless this file says otherwise.

## Purpose
Buyers search "X manufacturers in India". The article gives them an honest, sourced shortlist plus a buyer's guide, and a quote form that sends their requirement to 100xFounder (we pass it to manufacturers).

## The list
- Title: "Top 20 {X} Manufacturers in India (2026): List With Contacts" (or Top 10/15 if fewer genuine, verifiable companies exist; never pad with weak entries).
- Include only real, operating businesses you can verify: an official website that works, and ideally a second signal (GST/registration shown on the site, IndiaMART/TradeIndia verified profile, trade-association membership, certifications, news coverage).
- For each company: name; city/state; what they make (specific products); who they serve (B2B/OEM/private label/export); MOQ or capacity **only if published**; certifications **only if published** (CDSCO licence, GMP, ISO, IFRA, BIS, etc.); official website; **official business contact as published on the company's own website or verified listing** (sales phone, sales/info email), with the page it came from in `sources`.
- **Never** publish personal mobile numbers or personal emails of individuals, or contacts found anywhere other than the company's own public pages. If a company publishes only a person's mobile number, link to its contact page instead of printing the number. Founders/MDs may be named with their public role only.
- Use a `<table>` summary (Company, City, Speciality, Website) near the top, then one H3 section per company (80–150 words, in our own words).
- Ordering: explain the criteria (e.g. range, certifications, export experience, verifiable track record). No paid placement; say "No company paid to be listed. Inclusion is not an endorsement; verify before you order."

## The buyer's guide (the part that makes it rank)
After the list: how to choose a manufacturer; regulatory/quality checks with official sources (e.g. CDSCO cosmetic manufacturing licence under the Drugs and Cosmetics Act and Cosmetics Rules 2020; IFRA standards for fragrance; load ratings/BIS and engineering certification for truss); MOQs and typical cost drivers (only sourced figures); questions to ask before signing; red flags. Then FAQ (5–6) and Sources.

## Lead capture
Put the shortcode `[xf_quote_form niche="<niche>" sub="<sub-niche>" title="Get quotes from {X} manufacturers"]` on its own line twice: once right after the summary table, once before the FAQ. (It renders as a form on the site.)

## Images
5 openly licensed images as in BRIEF.md (factory floors, products, process shots); never a company's own photos or logos unless clearly licensed.

## Output
`content/drafts/listing-<slug>.json`, category `"manufacturers"`, at least 15 sources (company pages count). 2,000–3,000 words. Final reply: file, title, number of companies listed, anything excluded and why.
