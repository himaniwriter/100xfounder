# Writing brief: Product Hunt tool reviews (October 2026)

One article = one product that launched on Product Hunt. Read `CLAUDE.md`, `docs/STYLE_GUIDE.md` and `content/BRIEF.md` first: **every rule in BRIEF.md applies** (sourcing, never ANI, own words, images, JSON format, allowed HTML, internal links, title/excerpt length) except where this file changes it.

## Pick the product (check before writing; swap if it fails)
- Launched on Product Hunt in the last ~3 weeks; its Product Hunt page loads.
- **Paid** (a public pricing page with at least one paid plan), so a coupon can be added later. Free-only and open-source-only tools are skipped.
- Its website and pricing page load today (`curl -sI` → 200/3xx). "Every tool listed must be verified working": if the site is down or the sign-up page is broken, drop it.
- Enough public material for an honest review: docs or help centre, pricing, terms/privacy, changelog or blog, the Product Hunt launch discussion, and at least 2 named alternatives with public pricing.

## What the article is (and is not)
- A **research review**: what the product does, who it's for, pricing in detail, how it compares with named alternatives, what users said on its launch, privacy and data terms, and limits. We **did not test it hands-on**. Say so plainly once, in the "How we scored it" section: "We have not used it ourselves; this review is based on the vendor's documentation, pricing and terms, and public user feedback, checked on <date>." Never write "we tried", "in our tests", "I found" or anything that implies first-hand use.
- Product Hunt comments and reviews: summarise them in your own words with attribution ("several commenters on its Product Hunt launch asked about…"). Quote at most one short line, attributed by display name. Don't present PH ratings as our rating.
- Facts about the maker (founders, funding, location) only if sourced. Never estimate revenue or users.

## Structure
- **Length 1,300–2,200 words.** Never pad.
- Opening 2–3 sentences: what it is, who it's for, the verdict in one line, the launch date.
- Then Key takeaways `<ul>` (3–5).
- H2s (sentence case), in roughly this order: What <Name> does; Key features; Pricing (a `<table>` of plans from the vendor page, with the date checked); <Name> vs alternatives (a `<table>` comparing 2–4 named alternatives on price and the main features, each sourced); What Product Hunt users said; Privacy and data; Who should use it (and who shouldn't); How we scored it; FAQ (4–6 Q&As, including "Is there a <Name> coupon or discount?", answered truthfully with what the vendor offers publicly, such as an annual discount, a free trial or a student plan, or "no public coupon as of <date>"); Sources.
- **Do not write a coupons section.** The page adds a coupons box automatically when the owner adds a code later. Never invent or guess a coupon code.
- **How we scored it**: a `<table>` with five criteria, each scored 1–5 with one line of reasoning from the sources: Features vs alternatives; Pricing and value; Ease of getting started (from docs, onboarding and free tier/trial); Privacy and data terms; Maturity and support (docs, changelog, support channels, company track record). The overall score is the average, to one decimal. It must equal `review.rating`.
- Title pattern: "<Name> review 2026: <what it does>, pricing and alternatives" (55–70 chars; shorten as needed). Category `ai-news` or `saas`. Tags include "<Name> review", "<Name> pricing", "<Name> alternatives", "Product Hunt".
- Internal links: `/launches/` (always), plus 1–3 relevant ones from BRIEF.md (an existing AI-tools guide on our site is fine if you know its slug from `content/drafts/`).

## Images
Still exactly 5, openly licensed, from Commons/Openverse (BRIEF.md rules). Product screenshots and logos are not openly licensed, so don't use them: use photos of the category (a laptop with code for a code tool, a microphone for a voice tool, a meeting room for a meeting tool, etc.). Captions must not claim to show the product.

## Extra JSON field: `review`
Add this object to the draft (the site shows it as the at-a-glance box and Product + Review schema, so it must match the article exactly):

```json
"review": {
  "name": "Product name",
  "url": "https://vendor-site/",
  "ph_url": "https://www.producthunt.com/products/…",
  "category": "BusinessApplication | DeveloperApplication | DesignApplication | MultimediaApplication | ProductivityApplication (schema.org applicationCategory style)",
  "os": "Web, macOS, Windows, iOS, Android, Chrome extension (only what the vendor states)",
  "pricing_url": "https://vendor-site/pricing",
  "price": "12",
  "currency": "USD",
  "billing": "per month",
  "free_plan": "yes | no | trial",
  "checked": "2026-10-06",
  "rating": "3.8",
  "verdict": "One sentence, same as the article's verdict.",
  "pros": ["3–5 short pros, each backed by the article"],
  "cons": ["3–5 short cons, each backed by the article"]
}
```
`price` is the cheapest paid plan, as a number, billed monthly if the vendor offers monthly billing (say which in `billing`).

## Self-check (in addition to BRIEF.md's)
- The site and pricing page answered today; the date is in the article and in `review.checked`.
- Every plan price in the table matches the vendor page; `review.price` matches the table.
- The score table averages to `review.rating`; pros/cons appear in the article text.
- No first-hand-use claims; no coupon codes; FAQ discount answer is truthful and dated.
- Save as `content/drafts/review-20261006-<slug>.json` and validate with `python3 -m json.tool`.
