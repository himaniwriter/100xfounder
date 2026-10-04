# Semrush — primary-source fact pack

**All facts checked 4 October 2026** unless a different date is stated. Every fact is followed by `[source URL, date]`.
Sources are limited to semrush.com (marketing pages, pricing pages, Knowledge Base, legal pages, newsroom), SEC EDGAR filings by Semrush Holdings (CIK 0001831840), and Adobe's official newsroom.

---

## 0. READ THIS FIRST — three things that invalidate older Semrush research

### 0.1 Pro / Guru / Business are no longer the public plan names
The public pricing page now sells **Free, SEO, Starter, Pro+, Advanced** and **Semrush for Enterprise**. The legacy Pro/Guru/Business names survive only in some Knowledge Base articles and in stale FAQ copy on the pricing page itself.
[https://www.semrush.com/prices/ , 4 Oct 2026]

Price constants embedded in the pricing app show the new "SEO" tier is priced off the **legacy Pro** price point, and that legacy Guru/Business prices still exist in the codebase:

```
toolkits.semrush_one: starter {monthly:199, annualPerMonth:165.17}
                      pro_plus {monthly:299, annualPerMonth:248.17}
                      advanced {monthly:549, annualPerMonth:455.67}
toolkits.seo:         pro {monthly:139.95, annualPerMonth:117.33}
                      guru {monthly:249.95, annualPerMonth:208.33}
                      business {monthly:499.95, annualPerMonth:416.66}
```
[https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

**Accuracy note:** the page *displays* the SEO tier as "$139" but the underlying price is **$139.95** — the renderer truncates the decimal (`Math.trunc`). Write $139.95, or write "$139" and attribute it to the page display.
[https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

### 0.2 There is an active pricing experiment
The pricing app ships with `expSimplePricing: 2` and `expSimplePricingUI: 2` in its server-rendered props. These are experiment flags, so **a reader may legitimately see a different pricing layout or different plan names from the ones captured here.** The page must tell readers to confirm on semrush.com.
[https://www.semrush.com/prices/ , server-rendered JSON props, 4 Oct 2026]

### 0.3 Semrush is no longer an independent public company
Adobe **completed** its acquisition of Semrush on **28 April 2026**. Semrush is now a wholly owned Adobe subsidiary, delisted from the NYSE, and deregistered with the SEC. See §8.
[https://news.adobe.com/news/2026/04/adobe-completes-semrush-acquisition , 28 Apr 2026]

---

## 1. Current plan pricing

Checked on **4 October 2026** at https://www.semrush.com/prices/ (canonical: https://www.semrush.com/pricing/seo-ai-search/).

### 1.1 The core plans ("SEO + AI Search", marketed as Semrush One)

| Plan | Monthly billing | Annual billing (per month) | Annual total (12 × annual rate) | Saving vs monthly |
|---|---|---|---|---|
| Free | $0 | $0 | $0 | — |
| SEO | $139.95 (displayed "$139") | $117.33 | $1,407.96 | 16.2% |
| Starter (SEO + AI Search) | $199 | $165.17 | $1,982.04 | 17.0% |
| Pro+ (SEO + AI Search) | $299 | $248.17 | $2,978.04 | 17.0% |
| Advanced (SEO + AI Search) | $549 | $455.67 | $5,468.04 | 17.0% |
| Semrush for Enterprise | "Custom pricing available" / "Let's talk" | — | — | — |

[https://www.semrush.com/prices/ , 4 Oct 2026] and [https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

**Annual-saving claim, verbatim on the billing toggle:** "Annually **save up to 17%**"
[https://www.semrush.com/prices/ , 4 Oct 2026]

**KB restates it:** "Yes, annual plans are more cost-effective. Annual billing saves up to 17% compared to monthly billing." and "An annual subscription means you pay for the entire year upfront. It isn't a monthly payment plan spread over 12 months."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

**Legacy tiers still documented in the KB with their own prices:**
- "SEO Toolkit Pro … **$139.95/month** … Best for freelancers, small business owners and SEO beginners"
- "SEO Toolkit Guru … **$249.95/month** … Best for growing agencies and teams ready to scale"
- "SEO Toolkit Business … **$499.95/month** … Best for established agencies and large businesses"
[https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , 4 Oct 2026]

### 1.2 Currency and region — no INR shown

- **Official FAQ answer, verbatim: "All prices are in US dollars."**
[https://www.semrush.com/prices/ FAQ "What is the pricing currency?", answer string in https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]
- The server-rendered props returned `currencyInfo: {"currency": "usd", "rate": 1}` on this check. **The string "INR" and the ₹ symbol appear nowhere** in the pricing page HTML or in any of its JavaScript chunks.
[https://www.semrush.com/prices/ , 4 Oct 2026]
- A currency toggle component does exist in the page markup (`igc-ui-kit-*-currency-toggle`) and the formatter special-cases JPY for decimal places, so **Semrush can serve non-USD prices to some visitors**. On this US-routed check it served USD only. **Not verified: whether an India-routed visitor is shown INR.** Treat INR pricing as unconfirmed.
[https://www.semrush.com/prices/ and https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

### 1.3 India: GST is added on top

- "Goods and Services Tax (GST) is collected for customers in Australia, New Zealand, **India**, Singapore, and Canada."
- "**India** — GST rate we collect is **18%**. GST number format to be added to your Billing Info page: 15 digits alpha-numeric. Format Example: 22AAAAA0000A1Z5. Note: Business Number name on invoices and receipts is **GSTIN**."
[https://www.semrush.com/kb/1400-gst-taxes , 4 Oct 2026]
- Semrush collects "Value Added Tax (VAT), Goods and Services Tax (GST), the US Sales Tax and the Canadian indirect taxes."
[https://www.semrush.com/kb/251-taxes-collected , 4 Oct 2026]

**So an Indian buyer on Pro+ annual pays $248.17/mo + 18% GST, billed in USD.** The card is charged in US dollars; any rupee figure is the reader's bank's conversion. Do not publish a ₹ price without a sourced FX rate and its date.

### 1.4 Payment methods

- "All major credit cards including Visa, Mastercard, Discover, American Express, and UnionPay"
[https://www.semrush.com/prices/ FAQ, 4 Oct 2026]
- KB adds: "**Check orders** are available for annual subscriptions **in the US only**. Eligibility depends on account value… **Wire transfers** are available worldwide for **annual subscriptions only**."
- **Virtual cards are rejected:** "you're trying to pay with a virtual card, and we don't accept such a payment method".
- "**Itemized invoices are not currently available.** Downloaded PDF invoices do not provide an itemized breakdown of all products included in a combined charge."
[https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]

---

## 2. Full limits per plan

Extracted from the pricing page's own comparison table (the "Compare Plans" / "Expand details" grid), which is defined in the page's JavaScript bundle.
[https://www.semrush.com/prices/ and https://www.semrush.com/pricing/static/seo-ai-search.chunk.060cbe34d269a0846a57.js , 4 Oct 2026]

### 2.1 Website monitoring (Projects)

| Limit | SEO | Starter | Pro+ | Advanced |
|---|---|---|---|---|
| Websites to monitor | 5 | 5 | 15 | 40 |
| Keywords to track (daily updates) | 500 | 500 | 1,500 | 5,000 |
| Mobile data | Yes | Yes | Yes | Yes |
| Share of Voice | No | No | No | Yes |
| Keyword Cannibalization report | No | No | Yes | Yes |
| Pages to crawl per month | 100,000 | 100,000 | 300,000 | 1,000,000 |
| Pages to crawl per monitored website | 20,000 | 20,000 | 20,000 | 100,000 |
| JavaScript rendering | No | No | Yes | Yes |
| Sharing with Viewer or Editor access | Yes | Yes | Yes | Yes |

Tooltips, verbatim: "Number of pages you can crawl to check Site Health and AI Search Health across all monitored websites." / "Number of pages that you can crawl per audit."

### 2.2 Domain and Keyword Analytics

| Limit | SEO | Starter | Pro+ | Advanced |
|---|---|---|---|---|
| Results per report | 10,000 | 10,000 | 30,000 | 50,000 |
| Backlinks | Yes | Yes | Yes | Yes |
| Historical data | No | No | Yes | Yes |
| Reports per day | 3,000 | 3,000 | 5,000 | 10,000 |
| Keyword metric updates per month | 250 | 250 | 1,000 | 5,000 |
| Topics | No | No | Yes | Yes |
| API access | No | No | No | **Yes** |
| Migration from third-party tools | No | No | No | Yes |
| MCP Access | Yes | Yes | Yes | Yes |

Tooltips, verbatim: "Maximum number of data rows in a report." / "Number of times you can get fresh metrics for your target keyword in keyword analytics tools." / "Import your historical position tracking data from other tools into Semrush, so you keep your ranking history instead of starting fresh."

**Note the units mismatch to flag for readers:** keyword **metric updates** are *per month* (250 / 250 / 1,000 / 5,000), whereas **reports per day** are *per day* (3,000 / 3,000 / 5,000 / 10,000). Older reviews often conflate these.

**Historical data depth** is stated on the Traffic & Market tab as: "Website traffic data dating back to **2012**" (marketing page) while the KB's Traffic & Market plan description says "historical data dating back to **2017**". These two primary pages disagree — quote whichever you cite and name it.
[https://www.semrush.com/pricing/traffic-and-market/ and https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

### 2.3 AI Analysis (bundled AI-visibility quota)

| Limit | SEO | Starter | Pro+ | Advanced |
|---|---|---|---|---|
| Custom prompts (daily AI rankings) | No | 50 | 100 | 200 |
| AI reports per day | No | 300 | 300 | 300 |
| AI Visibility Overview | No | Yes | Yes | Yes |
| AI share of voice analysis | No | Yes | Yes | Yes |
| AI-powered brand visibility tracking | No | Yes | Yes | Yes |
| AI brand sentiment analysis | No | Yes | Yes | Yes |
| AI audience insights | No | Yes | Yes | Yes |
| AI-generated business strategy recommendations | No | Yes | Yes | Yes |

KB confirms the SEO tier's gap, verbatim: "This plan doesn't include the full AI visibility feature set — **no dedicated prompt-tracking quota, AI-ready Site Audit, or per-domain AI brand performance**."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

Starter's AI coverage, verbatim: "AI Visibility covers **Google Search, ChatGPT, Perplexity, and Gemini**, with 50 prompts tracked daily, 1 domain for AI brand performance, 300 AI visibility reports per day, and an AI-ready Site Audit."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

### 2.4 Teams and reporting

| Limit | SEO | Starter | Pro+ | Advanced |
|---|---|---|---|---|
| Included users | **1** | **1** | **1** | **1** |
| Base reports | 3 | 3 | 3 | 3 |
| Report sharing | Yes | Yes | Yes | Yes |
| Looker Studio integration | No | No | Yes | Yes |

Tooltip, verbatim: "**Each plan includes one user with full access to all features.**"
[https://www.semrush.com/pricing/static/seo-ai-search.chunk.060cbe34d269a0846a57.js , 4 Oct 2026]

### 2.5 Cost per extra user — the single biggest hidden cost

Price constants: `addons.users = {pro: 45, guru: 80, business: 100, noSeo: 20}`
[https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

| Situation | Price per additional user / month |
|---|---|
| Plan includes the SEO Toolkit, SEO/Pro tier | **$45** |
| Plan includes the SEO Toolkit, Pro+/Guru tier | **$80** |
| Plan includes the SEO Toolkit, Advanced/Business tier | **$100** |
| No SEO Toolkit (Social, Local, Content, Advertising, AI PR only) | **$20 flat** |
| Traffic & Market Toolkit | "Each additional user starts at **$289** per month. Without the SEO Toolkit, the total per user is **$309** ($289 base plus $20). With the SEO Toolkit, user pricing follows your SEO plan tier" |

The pricing page displays this as "Additional Users — Starting at **$45**/mo" on the SEO + AI Search tab and "**$20**/mo" on the Local / Content / Social / Advertising / AI PR tabs.
[https://www.semrush.com/prices/ , https://www.semrush.com/pricing/local/ , 4 Oct 2026]

KB, verbatim: "Plans that include the SEO Toolkit: Additional user pricing **starts at $45 per month and scales with your plan tier**. Plans without the SEO Toolkit: Additional users for toolkits such as Social, Local, or Content cost a **flat rate of $20 each, regardless of plan tier**." and "**View-only access to folders is free for any user.**"
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

Two further documented tooltips confirm users are charged **per toolkit**, not once:
- "**AI Visibility needs to be purchased separately for each user.**"
- "Cost per extra team member for AI Visibility Toolkit access, **in addition to the user cost**."
- "Cost per extra team member for SEO Classic Toolkit access."
[https://www.semrush.com/pricing/ i18n strings, 4 Oct 2026]
**Not verified:** the dollar amount of the AI Visibility per-user surcharge. It is referenced by tooltip but no price constant for it was found. Do not publish a number.

Trial perk for added users: "Each account can **add up to 3 additional users**. Added users receive **7-day free access** to all toolkits included in the main account subscription, **except the Traffic & Market Toolkit**."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

### 2.6 Legacy Pro / Guru / Business limits (still published in the KB)

| Limit | Pro ($139.95/mo) | Guru ($249.95/mo) | Business ($499.95/mo) |
|---|---|---|---|
| Websites to monitor | 5 | 15 | 40 |
| Keywords to track | 500 | 1,500 | 5,000 |
| Pages to crawl per month | 100,000 | 300,000 | 1,000,000 |
| Results per report | 10,000 | 30,000 | 50,000 |
| Keyword metric updates per month | 250 | 1,000 | 5,000 |
| **SEO Ideas per month** | **500** | **800** | **2,000** |
| Scheduled PDF reports | 3 | 3 | 3 |
| Adds over lower tier | — | SEO Writing Assistant, Topic Research, Historical Data, Multi-targeting in Position Tracking, Looker Studio reporting integrations | SEO Share of Voice tracking, API Access |

[https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , 4 Oct 2026 — no "last updated" date shown on the page]

The **SEO Ideas per month** limit (500 / 800 / 2,000) appears only in this KB article, not on the new pricing table. Useful detail no competitor review carries.

### 2.7 Content tools by tier
- Content optimization and SEO Writing Assistant / Topic Research are **Pro+ and above** on the new table ("Topics: No / No / Yes / Yes"; "Content optimization" listed under Pro+). On the legacy table they are **Guru and above**.
[https://www.semrush.com/prices/ and https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , 4 Oct 2026]
- The full content-production suite is a **separate paid toolkit** — see §3.

### 2.8 API

- **API access requires the Advanced tier** (legacy: Business). "API access — No / No / No / Yes".
[https://www.semrush.com/prices/ , 4 Oct 2026]
- Developer docs, verbatim: "When you purchase an API unit package **in addition to your Business subscription**, you'll have a limited number of API units to make calls."
[https://developer.semrush.com/api/v3/get-started/api-units-balance/ , 4 Oct 2026]
- API unit packages are sold in **2,000,000 / 5,000,000 / 10,000,000 / 20,000,000** unit sizes, bought under Subscription info → API Units → Buy.
[https://developer.semrush.com/api/v3/get-started/api-units-balance/ , 4 Oct 2026]
- Unit consumption example: "one line of response in the Domain Organic Search Keywords report costs **10 API units for live results and 50 API units for historical data**."
[https://developer.semrush.com/api/v3/analytics/ , 4 Oct 2026]
- "The purchased units are included in your recurring subscription and renew on the same day as your plan. **Unused units will expire** instead of being added to the renewed amount."
[https://developer.semrush.com/api/v3/get-started/api-units-balance/ , 4 Oct 2026]
- **Not verified: the dollar price of any API unit package.** Semrush does not publish it; the docs direct buyers to sales@semrush.com for "custom API options and pricing". Do not publish an API price.
- `https://www.semrush.com/kb/1042-api-units` returned **HTTP 404** on this check. `https://www.semrush.com/api-analytics/` **301-redirects** to developer.semrush.com.

### 2.9 Where a buyer checks their own limits
"Check your limits, API units, billing info, and payment history under the **Subscription Info** tab." The **Toolkits & Units** section lists purchased toolkits; "Select **View units** to see the limits across all your purchased toolkits"; "Select **Compare plans** at the top of the Toolkits & Units section to compare the features, limits, and prices… You can switch between monthly and annual billing and subscribe to a different plan from the comparison window."
[https://www.semrush.com/kb/1011-subscriptions and https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]

---

## 3. Every paid add-on, with price

Semrush's model is now explicitly modular. KB, verbatim: "Choose a plan for SEO and AI visibility, then subscribe to the specialist toolkits you need… **Add or remove specialist toolkits at any time** as your priorities shift… **Pay only for the tools you use.**"
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

### 3.1 Specialist toolkits (bought on top of a plan, or standalone)

| Toolkit / add-on | Tier | Price (monthly = annual; no annual discount shown) | Requires an SEO plan? |
|---|---|---|---|
| **AI Visibility** | Base | **$99/mo per domain** | No — sold standalone per domain |
| **Traffic & Market** (the old ".Trends") | Pro | **$289/mo** | No |
| **Local** | Base | **$30/mo per location** | No |
| **Local** | Pro | **$60/mo per location** | No |
| **Local** | Business | "Let's talk" / custom | No |
| **Content** (ContentShake-lineage writing tools) | Base | **$60/mo** | No |
| **Social** | Base | **$20/mo** | No |
| **Social** | Pro | **$40/mo** | No |
| **Social** | Business | **$250/mo** | No |
| **Advertising** | Base | **$99/mo** | No |
| **Advertising** | Pro | **$220/mo** | No |
| **AI PR** | Base | **$149/mo** | No |
| **AI PR** | Pro | **$279/mo** | No |
| **AI PR** | Business | **$499/mo** | No |

[https://www.semrush.com/pricing/ai/ , /local/ , /content/ , /social/ , /advertising/ , /pr/ , /traffic-and-market/ , 4 Oct 2026] and price constants at [https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

**Important:** for every specialist toolkit the monthly and annual-per-month constants are **identical** (e.g. `local.pro {monthly:60, annualPerMonth:60}`). **The "save up to 17%" annual discount applies only to the core SEO + AI Search plans, not to the specialist toolkits.** That is a genuinely useful finding for a buying guide.
[https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

**Local pricing is per location**, and plans "can be added to any Semrush subscription **or purchased separately**".
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

### 3.2 Cross-toolkit add-ons (shown on every pricing tab)

| Add-on | Price | What it is (verbatim bullets) |
|---|---|---|
| **Additional Users** | from **$45/mo** (SEO plans) / **$20/mo** (non-SEO) — see §2.5 | "Add colleagues to your Semrush account • Collaborate across shared projects • Keep your account secure with individual logins" |
| **Lead Generation** (Agency Partners Platform) | **$90/mo** | "Branded profile on the Semrush Agency Partners platform • Semrush verified badge for your marketing channels" |
| **Base Report** (My Reports) | **$10/mo per report** | "Data from 20+ Semrush tools • Google Analytics and Google Search Console integrations • Monthly/Weekly/Daily scheduling • PDF export • Sharing with Semrush users" |
| **Pro Report** (My Reports) | **$20/mo per report** | "All Base Report features • 20+ external integrations • Delivery at a specific time • Branding and white-labeling • AI-generated summaries • Sharing by link" |

[https://www.semrush.com/prices/ , 4 Oct 2026]

KB confirms the per-report pricing: "Base Report… Available at **$10 per month per report**." / "Pro Report… Available at **$20 per month per report**." / Agency Partners Platform listing "available at **$90 per month**."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

### 3.3 Other add-on price constants found in the pricing bundle

```
addons.local.advances      = 60     (Local "Advanced"/Pro level, $60)
addons.trends              = 289    (Traffic & Market / .Trends, $289)
addons.smm.socialContentAI = 29.99  (Social Content AI, $29.99/mo)
addons.smm.socialAIStarter = 20     (Social AI Starter, $20/mo)
addons.leadGen             = 90
addons.baseReport          = 10
addons.proReport           = 20
```
[https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js , 4 Oct 2026]

Note **Social Content AI at $29.99/mo** and **Social AI Starter at $20/mo** are real price constants but are **not rendered on the public Social pricing tab** as of this check. Treat them as code-level evidence, not as a published price; say so if you cite them.

### 3.4 Things the brief named that no longer exist under that name

| Brief's name | Current status |
|---|---|
| **Local Basic / Local Advanced** | Now **Local Base ($30) / Local Pro ($60) / Local Business (custom)**, per location. The code still calls the $60 tier `local.advances`. [https://www.semrush.com/pricing/local/ , 4 Oct 2026] |
| **Trends / .Trends** | Now the **Traffic & Market Toolkit**, Pro at **$289/mo**. The code constant is still `addons.trends = 289`. [https://www.semrush.com/pricing/traffic-and-market/ , 4 Oct 2026] |
| **ContentShake AI** | Folded into the **Content Toolkit**, single plan **Content Base $60/mo**. [https://www.semrush.com/pricing/content/ , 4 Oct 2026] |
| **AI toolkit / AI visibility** | Now the **AI Visibility Toolkit**, Base **$99/mo per domain**; a reduced AI quota is also bundled into Starter/Pro+/Advanced. [https://www.semrush.com/pricing/ai/ , 4 Oct 2026] |
| **Agency Growth Kit** | **No page, price or KB article found under this name on semrush.com on 4 Oct 2026.** The closest live products are the **Agency Partners Platform / Lead Generation add-on ($90/mo)** and the **My Reports** white-labeling in Pro Report ($20/mo). **Do not state an Agency Growth Kit price.** |
| **API units** | Sold in 2M/5M/10M/20M packages, **price not published** — see §2.8. |

---

## 4. Free plan and free trial

### 4.1 Free plan — what you actually get

Pricing page, verbatim: "**Free. $0/mo** — For trying out the platform. **No credit card required.** Explore • **1 demo project** • **10 reports per day across all vital tools** • Help Center & Basic Onboarding • AI Visibility features"
[https://www.semrush.com/prices/ , 4 Oct 2026]

KB, verbatim: "**Free:** For trying out the platform, with no credit card required. Includes **1 demo project, 10 reports per day across all vital tools**, and a limited set of AI Visibility features."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

Per-tool free limits, from Semrush's own blog article (last updated 10 December 2025):

| Tool | Free limit |
|---|---|
| Domain Overview | 10 queries/day |
| Keyword Research | 10 queries/day |
| Competitor Research | 10 queries/day |
| Backlinks | 10 queries/day |
| Site Audit | 100 pages |
| Position Tracking | 10 keywords |
| On-Page SEO Checker | 10 pages or keywords (single campaign) |
| SEO Writing Assistant | one piece of content |
| Map Rank Tracker | 50 free credits per month |
| Social Content AI | 27 content ideas |
| Free AI writing tools | three free uses per day (up to 300 words) |

[https://www.semrush.com/blog/what-can-i-do-with-a-free-account-from-semrush/ , article last updated 10 Dec 2025, checked 4 Oct 2026]

Cross-confirmed in the KB:
- Site Audit: "**Without SEO Toolkit: 100 pages per month**", and 100 pages maximum per single audit. Paid: 100,000 / 300,000 / 1,000,000 per month; max per single audit 20,000 / 20,000 / 100,000.
[https://www.semrush.com/kb/31-site-audit , 4 Oct 2026]
- Position Tracking: "**Without SEO Toolkit — 10 keywords across 1 website to monitor**".
[https://www.semrush.com/kb/32-position-tracking , 4 Oct 2026]
- Simultaneous Site Audits: **1** on free; Pro and Guru **2**; Business **5**.
[https://www.semrush.com/kb/681-site-audit-troubleshooting , 4 Oct 2026]
- PDF reports: free users can add up to **3 recipients** and **cannot include links** in custom email messages; paid users up to **30 recipients** with links allowed. Free plan has **1 Base report**.
[https://www.semrush.com/kb/34-my-reports , 4 Oct 2026]

Stale FAQ copy on the pricing page gives the free limit in a different frame, with both old and new plan names in two variants of the same string:
- "The maximum number of requests made to the Analytics reports per day is limited to only **10** (**Pro** users have access to **3,000** searches, **Guru** — **5,000**, **Business** — **10,000**)."
- "…(**SEO** users have access to 3,000 searches, **Pro+** — 5,000, **Advanced** — 10,000)."
"As a free user, you can create and monitor only **one website** and track **10 keywords** in Position Tracking."
[https://www.semrush.com/prices/ FAQ i18n strings, 4 Oct 2026]

**Unresolved conflict to flag, not to resolve:** the KB says "10 reports per day **across all vital tools**" (one shared pool) while the blog lists "10 queries/day" **separately per tool**. Two primary Semrush pages disagree. Say so rather than picking one.

### 4.2 Free trial

| Question | Documented answer |
|---|---|
| Length | **7 days.** "Try Semrush free for **seven days**. Cancel anytime." [https://www.semrush.com/prices/ , 4 Oct 2026] |
| Which plans | "**SEO + AI Search plans, Traffic & Market, Local, Content, Social, Advertising, and AI PR Toolkits: 7-day free trial available for all plans**" [https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026] |
| Agency Partners add-on | **14-day free trial** [same] |
| Card required? | **Yes for a trial.** The Free plan "requires no credit card". [https://www.semrush.com/kb/1011-subscriptions and https://www.semrush.com/prices/ , 4 Oct 2026] |
| What hits the card | "Our system sends over a request to your issuing bank for a **$1 (or an equivalent of a $1) authorization** to verify that the card exists… **the authorization transaction is not a charge**, and, eventually, it will disappear from your statement. In most cases, it is reversed almost immediately, but depending on your bank's internal policies, **it can take up to several weeks**." [https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026] |
| Pricing page wording | "We will charge a nominal amount to your credit card to check its validity; once confirmed, it will be immediately refunded. **Until your Semrush trial period ends you won't be charged.**" [https://www.semrush.com/prices/ FAQ, 4 Oct 2026] |
| One per account | "you can use the option to get a free trial **only once**. All the following attempts will lead to the purchase of a monthly plan, and you will be charged accordingly." [https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026] Per-toolkit: "**Each toolkit trial can be activated once per account.**" [https://www.semrush.com/kb/1011-subscriptions] |
| How it converts | "After your 7-day trial, your account **converts to the plan you selected unless you cancel**. You can cancel any time during the trial period at no charge. If you continue, you're billed at the standard rate for the plan you chose." [https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026] |
| ToS wording | "at the end of a trial period for Paid Services, you will be **automatically charged the Fees** for the Paid Services as set forth in the Subscription Plan." [https://www.semrush.com/company/legal/terms-of-service/ , Last Updated 25 Aug 2026, checked 4 Oct 2026] |
| Limits during trial | "**exporting data is disabled during the trial period.** This restriction applies across trial subscriptions, even if exports are normally included in the paid version of the plan." [https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026] |
| Trial → paid and refunds | **Trial-to-paid conversions are NOT eligible for the 7-day money-back guarantee.** [https://www.semrush.com/kb/252-cancelling-your-account , 4 Oct 2026] |
| Virtual cards | Rejected: "Sorry, the credit card you entered cannot be used for this payment. Please provide a different card" [https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026] |
| Local trial quirk | "Add a Local trial while your SEO or Traffic & Market trials are active, and Local limits match the remainder of those trials. **Once those trials finish, you can't add a Local trial, even if you've never tried it.**" [https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026] |
| SEO / Traffic & Market exception | "If you currently have, or previously had, a trial or paid subscription for one or more toolkits, you **aren't eligible for free access to the SEO or Traffic & Market Toolkits.**" [same] |
| Extension | "Trial upgrade and extension options are limited. Contact Customer Support to check what may be available for your account." [same] |
| Free demo/training | "Once you sign up for a Semrush free trial, request a free training session here. After your demo, you will be assigned a dedicated point of contact." [https://www.semrush.com/prices/ FAQ, 4 Oct 2026] |

### 4.3 Other free/discount routes Semrush documents
- **Semrush for Education:** "Semrush doesn't offer individual subscription plans for students. Eligible accredited colleges and universities can join the **Semrush for Education** program, which provides educators and their students with **free access to Semrush for 3 months**."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]
- **No lifetime deal:** "No, Semrush doesn't offer a lifetime plan."
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]
- **No published coupon or discount code** was found on any semrush.com pricing or legal page on 4 Oct 2026. The only published discount is annual billing (up to 17%). Do not publish a code.

---

## 5. Cancellation, downgrade and refunds

### 5.1 Documented steps to cancel

Primary source: [https://www.semrush.com/kb/252-cancelling-your-account , 4 Oct 2026 — no "last updated" date shown on the page]

1. While logged in, "submit a request through the **Cancellation Form**" at **https://www.semrush.com/cancel/**.
   - Alternative route: go to **Subscription Info**, find "**Recurring: Active**", and click the **Contact us** link, which leads to the Cancellation Form.
2. "**Complete all questions in the Cancellation Form.**"
3. Semrush emails a cancellation confirmation. **The link inside is valid for 24 hours.**
4. **Click the link in that email to finalize.** Semrush Support then creates a case and sends a completion email.
   - For App Center apps, cancellation is done from the **My Apps** page via **Settings**.

**Which item to select in the form:** the specific Toolkit name; for legacy Pro/Guru/Business select "**SEO Toolkit**"; to end everything select "**All Semrush subscriptions**".

**Critical and worth a callout box in the article: if the email confirmation link is not clicked, the cancellation does not complete.**

**When it takes effect:** auto-renewal is off once Subscription Info shows "**Recurring: Inactive**" at the top of the page. ToS: "Cancellations of subscriptions to Paid Services shall **take effect at the end of your pre-paid subscription period**" — access continues to the end of the paid term, with no mid-term refund by default.
[https://www.semrush.com/company/legal/terms-of-service/ , Last Updated 25 Aug 2026, checked 4 Oct 2026]

Pricing-page FAQ: "Yes, you can cancel your subscription, downgrade or upgrade your plan at any time, **unless you have custom terms and a signed agreement with us**."
[https://www.semrush.com/prices/ , 4 Oct 2026]

### 5.2 Downgrade

- **There is no self-service downgrade.** "simply **contact Support**, and we'll take care of it."
[https://www.semrush.com/kb/252-cancelling-your-account and https://www.semrush.com/kb/support/ , 4 Oct 2026]
- "**no restrictions on the number of downgrades**."
[https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]
- **Data on downgrade:** website / Website Monitoring data is kept for **30 days** after downgrading, so re-upgrading within 30 days restores it. Downgrading to the **free plan** keeps data for **one month**; thereafter only the oldest folder's data is retained.
[https://www.semrush.com/kb/252-cancelling-your-account and https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]
- **Pausing is not offered:** "**Subscriptions can only be canceled.**"
[https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]
- Expired card warning: "If the payment fails, your subscription may become inactive, and your account may be downgraded. **SEO Website monitoring data stored by Semrush may be deleted if the subscription is not reactivated within 30 days.**"
[https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]

### 5.3 Refund policy

Official page: [https://www.semrush.com/company/legal/refund-policy/ , **Last Updated 20 August 2025**, checked 4 Oct 2026]

- **Window: 7 calendar days** from the initial purchase.
- It is a "**one-time, 7-day money-back guarantee**, limited to (1) initial subscription" with a term of **12 months or longer**, and to **initial add-on purchases**.
- Applies **only to credit card purchases made directly on Semrush.com**.
- **Month-to-month subscriptions are explicitly excluded** — not refundable.
- **Non-refundable:** renewals; mid-term cancellations where no refund was requested inside the 7-day window; month-to-month plans. Trial-to-paid conversions are also excluded per kb/252.
- **How to request:** submit the Cancellation Form at https://www.semrush.com/cancel/ **with the refund request stated in the comments**, or use the support form supplying name, transaction ID, last 4 digits of the card, billing date, email and login.
- **Processing: within 30 calendar days**, to the original payment method.
- Signed enterprise agreements are governed by their own terms, not this policy.
- ToS baseline: "Except as otherwise set forth in the Cancellation Policy, **all payment obligations are non-cancellable and all Fees paid are non-refundable**." Exception: if Semrush cancels without cause it will "refund any prepaid but unused Fees."
[https://www.semrush.com/company/legal/terms-of-service/ , Last Updated 25 Aug 2026]

**Counter-intuitive nuance worth stating plainly:** annual plans are **not** categorically non-refundable — they are in fact the **only** plans eligible for the money-back guarantee (12-month-or-longer terms), within 7 days of the initial purchase. Monthly plans get nothing.

### 5.4 Auto-renewal and notice

- ToS: "your subscription will **automatically renew for the same period on the then-current terms**." Failure to cancel in time means renewal "at the **then-applicable rate**."
- Notice: "You may prevent renewal of the subscription by sending us a notice of non-renewal through the form located at https://www.semrush.com/kb/support/ **before the last day of your then-current Subscription Term**."
**So there is no fixed advance-notice period** (no "30 days' notice"). Any specific number of days would be unsourced.
[https://www.semrush.com/company/legal/terms-of-service/ , Last Updated 25 Aug 2026, checked 4 Oct 2026]
- Annual plans auto-renew like monthly ones; "you pay for the entire year upfront. It is not a monthly payment plan." Mid-term additional purchases are aligned to the same renewal date.
[https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]
- Failed payment recovery: "There will be several attempts from our side to make the transaction… the transaction will be processed automatically in a week." A "**Renew now**" 1-click button appears on Subscription Info.
[https://www.semrush.com/kb/1013-billing-faq , 4 Oct 2026]

### 5.5 Fetch failures in this section
| URL | Result |
|---|---|
| https://www.semrush.com/kb/998-subscription-limits | **404** — substituted kb/1547, kb/31, kb/32 |
| https://www.semrush.com/kb/538-position-tracking-limits | **404** — substituted kb/32 |
| https://www.semrush.com/company/legal/cancellation-policy/ | **404**, although the ToS links to a "Cancellation Policy". Live equivalent is /company/legal/refund-policy/ |
| https://www.semrush.com/kb/998-what-is-included-in-my-subscription | **404** |
| https://www.semrush.com/kb/1042-api-units | **404** |

**No Knowledge Base article read for this pack displayed a "last updated" date.** The only dated primary sources are the Refund Policy (20 Aug 2025), the Terms of Service (25 Aug 2026), and the free-account blog article (10 Dec 2025).

---

## 6. Toolkits and flagship tools

### 6.1 The current toolkits

KB, verbatim: "Semrush's toolkits each focus on a specific area of marketing. They include the following: **SEO Toolkit, AI Visibility Toolkit, Traffic & Market Toolkit, Local Toolkit, Content Toolkit, Social Toolkit, Advertising Toolkit, AI PR Toolkit**" — plus the cross-toolkit **My Reports Suite**, the **Agency Partners Platform**, and standalone apps in the **App Center**.
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

**"Semrush One"** is the brand name for the combined SEO + AI Visibility subscription — `https://www.semrush.com/pricing/semrush-one/` resolves to the same `seo-ai-search` pricing route. Marketing line: "The leading platform that **unifies SEO authority and AI visibility**." KB: "Semrush plans **combine the SEO Toolkit and the AI Visibility Toolkit in a single subscription**."
[https://www.semrush.com/pricing/semrush-one/ and https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

The site's product navigation groups tools as: **Discover** (Keyword Research, Competitor Analysis, AI Visibility, Prompt Research, Local SEO, Market Analysis) · **Create and optimize** (Content Creation, Technical Site Health, Digital PR) · **Track** (Rank Tracking, Marketing Reports, AI Brand Sentiment, Backlink Analysis).
[https://www.semrush.com/prices/ site navigation, 4 Oct 2026]

The SEO Toolkit's KB sidebar lists its tools as: SEO Dashboard, Site Audit, Position Tracking, Domain Overview, Organic Rankings, Top Pages, Compare Domains, Keyword Gap, Backlink Gap, Keyword Overview, Keyword Magic Tool, Keyword Strategy Builder, SEO Writing Assistant, Topic Research, Backlinks, Referring Domains, Backlink Audit, Sensor, SEOquake, Semrush Rank, On Page SEO Checker, Organic Traffic Insights.
[https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , 4 Oct 2026]

### 6.2 Toolkit descriptions, verbatim from the KB

[all quotes: https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]

- **SEO Toolkit:** "Uncover competitor strategies, discover high-converting keywords, and track your rankings. Identify exactly what's holding your site back, with clear fixes and AI-powered recommendations."
- **AI Visibility Toolkit:** "shows how AI platforms such as **ChatGPT, Google AI, and Gemini** feature your brand and competitors. Analyze AI visibility, audience sentiment, and competitor positioning across your niche, and get recommendations."
- **Traffic & Market Toolkit:** "shows how any business performs online and how it compares to the market. It combines traffic analysis, audience insights, benchmarking, and market trends in one view." Pro plan: "full access to core dashboards, tracking for up to **100 competitors**, analysis of trends across **190+ countries**, daily traffic insights, and historical data dating back to **2017**."
- **Local Toolkit:** "covers local search across Google, AI-driven results, maps, directories, and review platforms." Base: "the **GBP AI Agent**, which generates and publishes posts, replies to reviews, uploads photos on schedule, and enhances your business description automatically… **Map Rank Tracker**… local heatmap reports." Pro adds: "**Listing Management** to distribute and maintain business information across **70+ authoritative directories** (availability varies by country), automated review generation and management, centralized monitoring, alerts, and competitor review analytics… increased Map Rank Tracker credits, advanced GBP management… and **API access for reporting and integrations**." Business adds: "full personalization of Semrush Local and **API access for Listing Management**."
- **Content Toolkit:** "finds topic ideas with **Topic Finder**, generates briefs with **SEO Brief Generator**, creates full articles with **Article Generator**, and optimizes your drafts to boost visibility." Single plan, Content Base: "Create **unlimited SEO-friendly articles**, and generate **5 SEO-boosted pieces per month** with advanced SERP analysis… Chrome browser extension, send articles directly to your CMS, and create content **in your brand voice**."
- **Social Toolkit:** "includes **Social Tracker** for monitoring competitor strategies and social media trends, tools to find influencers, and **social listening** for brand conversations." Base: "Manage **5 profiles**, schedule **50 posts per month**, and track **10 competitors**." Pro: "unlimited post scheduling with expanded limits, **10 profiles**, and **20 tracked competitors**." Business: "**influencer discovery and analytics for Instagram, TikTok, YouTube, and Twitch**, and social listening across major platforms and the wider web."
- **Advertising Toolkit:** "Reveal competitor ad tactics with **Advertising Research**, and launch campaigns with the AI-powered **Ads Launch Assistant**." Base: "**Advertising Research, PLA Research**, and the Ads Launch Assistant." Pro: "full access to **AdClarity** for competitive insights across display, video, and social ads. Includes advanced reporting, historical data, and market comparisons across **30+ global regions**."
- **AI PR Toolkit:** "Find media outlets that **LLMs cite** in your niche, research contributing journalists, and use AI to create emails and press releases." Base: "**500 email sends**." Pro: "**1,250 email sends**", Media Monitoring, contact exports, follow-ups. Business: "**50,000 media mentions to monitor per month**."
- **My Reports Suite:** "generates reports using data from across your Semrush tools and other marketing solutions."

### 6.3 Documented tool limits from the pricing tabs

| Tool / limit | Value |
|---|---|
| Social Poster — profiles for posting | Base 5, Pro "10 (more upon request)", Business "10 (more upon request)" |
| Social Poster — posts to schedule per month | Base 50, Pro unlimited, Business unlimited |
| Social — profiles to track | Base up to 10, Pro up to 20 |
| AI Visibility — AI Analysis reports per day | 300 |
| AI Visibility Base — custom prompts | "Track **25 custom prompts** (daily AI rankings)", "1 domain for Brand Performance analysis" |
| AI Visibility Base — platforms | "Mentions from **ChatGPT, Google AI, Gemini, and Perplexity**" |
| AI PR — contacts from media database per month | Base 250, Pro 500, Business 1,000 |
| Local Base — Map Rank Tracker | **375 credits** |
| Local Pro — Map Rank Tracker | **1,225 credits** |
| Content Base | "**10,000 articles/mo**", "**5 SEO content boosts/mo**", "Create content in 7 languages: English, Dutch, French, German, Italian, Portuguese, Spanish" |
| Traffic & Market | "Benchmark your performance against up to **100 competitors**", "Website traffic data dating back to **2012**", "See historical data and keep your collected data for up to **2 years**" / "**24 months**" |
| Advertising | "Analyze up to **3 months** of historical advertising data", "Data going **60 days** back from the day of your campaign setup" |
| AdClarity (Advertising Pro) | "Real-time display, video, and social ad occurrences across **650 thousand publishers** from **51 global markets**" |
| Advertising Base | "Unlimited ad spend", "Unlimited ad creative generation", "Unlimited Google Ads exports" |

[https://www.semrush.com/pricing/social/ , /ai/ , /pr/ , /local/ , /content/ , /traffic-and-market/ , /advertising/ , 4 Oct 2026]

### 6.4 Site Audit — documented limits
- Pages per month: free 100; Pro 100,000; Guru 300,000; Business 1,000,000.
- Maximum pages per single audit: free 100; Pro 20,000; Guru 20,000; Business 100,000.
- Simultaneous audits: free 1; Pro 2; Guru 2; Business 5.
- JavaScript rendering: "Allow a web crawler to render JavaScript content of your website" — **Pro+ and Advanced only** on the new table.
[https://www.semrush.com/kb/31-site-audit , https://www.semrush.com/kb/681-site-audit-troubleshooting , https://www.semrush.com/prices/ , 4 Oct 2026]

### 6.5 Position Tracking — documented limits
- Keywords / websites: free 10 keywords across 1 website; SEO 500/5; Starter 500/5; Pro+ 1,500/15; Advanced 5,000/40.
- Multi-location and device tracking: **Pro+ and above** (legacy: "Multi-targeting in Position Tracking", Guru and above).
- SEO Share of Voice: **Advanced only** (legacy: Business only).
[https://www.semrush.com/kb/32-position-tracking , https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , https://www.semrush.com/prices/ , 4 Oct 2026]

### 6.6 Domain Analytics vs Traffic Analytics — Semrush's own caveat
Worth quoting in the article, because it is Semrush admitting its traffic numbers are estimates:
- "Domain Analytics makes estimations **based solely on keyword positions** and their estimated traffic (search volume × average CTR). These numbers are calculations of how much traffic the website **COULD** get based on their positions."
- "Traffic Analytics, on the other hand, makes estimations based on analyzing **clickstream data**."
- "Therefore, Traffic Analytics and Domain Analytics will **almost always report different estimations** of traffic."
- "Please keep in mind that the **best use of Semrush is not to measure your own website's traffic statistics. You should always use Google Analytics for your own website.** Semrush is a competitive research tool."
[https://www.semrush.com/kb/ (Semrush Toolkits → "Why are different traffic values shown in Domain Analytics and Traffic Analytics?"), 4 Oct 2026]

### 6.7 MCP access — new and notable
- **MCP Access is "Yes" on all four paid tiers** (SEO, Starter, Pro+, Advanced) in the comparison table — unlike API access, which is Advanced-only.
[https://www.semrush.com/prices/ , 4 Oct 2026]
- Marketing claim: "The world's most powerful traffic, visibility, and market dataset. **Inside your AI assistants.**"
[https://www.semrush.com/prices/ site navigation, 4 Oct 2026]
- Advanced tier adds: "Get **higher usage limits and deeper data endpoints in API and MCP access** to get Semrush data at scale via AI assistants and custom AI workflows."
[https://www.semrush.com/prices/ i18n strings, 4 Oct 2026]
- Docs: https://developer.semrush.com/api/v4/introduction/semrush-mcp/
- **Not verified:** numeric MCP request limits per tier.

### 6.8 Tool-by-tool detail, from each tool's own KB article

**Keyword Magic Tool.** "Enter a search term and receive a responsive table with related search terms broken down into topic-specific subgroups"; auto-calculates volume and difficulty, filters question-based queries, flags SERP-feature opportunities. Draws on **27.3 billion keywords** per this article.

| Tier (article uses legacy names) | Results per report | Reports per day |
|---|---|---|
| Free (no SEO Toolkit) | 10 in interface; **0 for export** | 10 |
| Pro SEO | 10,000 | 3,000 |
| Guru SEO | 30,000 | 5,000 |
| Business SEO | 50,000 | 10,000 |

Export and the AI features (Personal Keyword Difficulty, Potential Traffic) are "not available on a free subscription."
[https://www.semrush.com/kb/262-keyword-magic-tool , 4 Oct 2026]

**Position Tracking.** "Position Tracking is a tool that monitors your website's search rankings daily for specific keywords," across "devices (mobile, tablet, desktop), locations (**down to postal code**), and search engines including **Google, Bing, Baidu, ChatGPT Search, and Google AI Mode**."
**Update frequency, verbatim and important:** "tracks **daily** results for **60 days**. After 60 days, Position Tracking displays **weekly** data points."

| Tier | Keywords / websites | Competitors | Multitargeting |
|---|---|---|---|
| Without SEO Toolkit | 10 across 1 website | 20 | Not available |
| Pro SEO | 500 across 5 | 100 | Not available |
| Guru SEO | 1,500 across 15 | 3,000 | 10 targets/campaign |
| Business SEO | 5,000 across 40 | 4,000,000 | 5,000 targets/campaign |

Tags, Cannibalization and Devices & Locations reports require **Guru** or higher.
[https://www.semrush.com/kb/696-what-are-the-limits-of-my-position-tracking-campaign , 4 Oct 2026]

**Site Audit.** "a powerful website crawler that allows you to analyze the health of a website," running "**Over 140 on-page and technical SEO checks**" covering duplicate content, broken links, AMP, HTTPS, hreflang, crawlability and indexability. **Unused crawl budget does not roll over; limits reset on the 1st of each month.** Limits per §6.4.
[https://www.semrush.com/kb/31-site-audit , also https://www.semrush.com/kb/539-configuring-site-audit , 4 Oct 2026]

**Backlink Analytics.** Full (not sampled) backlink profiles, side-by-side domain comparison, progress tracking over time, link-opportunity identification, exportable reports filterable by type, country, platform and authority metrics. Index 43T backlinks / 390M referring domains, refreshed at least hourly. Row caps follow the standard results-per-report ladder (10,000 / 30,000 / 50,000). The product page names no required tier.
[https://www.semrush.com/analytics/backlinks/ and https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , 4 Oct 2026]

**Keyword Gap.** Compares keyword profiles across domains to surface competitors' keywords you lack. Row cap follows the platform-wide ceiling: 10,000 / 30,000 / 50,000 for Pro / Guru / Business.
[https://www.semrush.com/kb/28-keyword-gap and https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits , 4 Oct 2026]

**Traffic Analytics (Traffic & Market Toolkit).** The dashboard "gives you a comprehensive snapshot of any domain's website traffic" and helps you "understand how a site performs over time, what sources drive its visitors, and how engaged those users are." Toolkit dashboards: Traffic Analytics, Traffic Distribution (AI Traffic, Organic Search, Paid Search, Paid Social, Organic Social, Referral, Email, Display Ads), Top Pages, Market Overview, Competitor Monitoring.
**Limits: Free plan gets sample domains only** (real domain analysis unavailable). **Traffic & Market Pro $289/mo — 1 user seat, maximum 3,000 requests per day.** Custom Plan adds API access. Historical: "Monthly data available from **January 2017**."
[https://www.semrush.com/kb/1506-traffic-and-market-traffic-overview , https://www.semrush.com/kb/1121-semrush-traffic-and-market , https://www.semrush.com/kb/1000-competitive-research-bundle , https://www.semrush.com/kb/64-historical-data , 4 Oct 2026]

**Listing Management (Local Toolkit).** "Distribute your business data automatically to the most authoritative directories (**70+ for the US, 40+ for other countries**) and even make it voice search ready, automatically distributing the information to **Amazon Alexa, Apple, Bing, and Google**."
Limits: **priced per location** — "If your business has two or more locations, you need to buy a limit for each location"; up to 9 supplemental categories (10 total) per location; up to 20 service areas; one NPI per healthcare location; 50-character featured message; photos "can take up to **24 hours**" to distribute; healthcare directories (WebMD, Vitals) **USA only**; GBP Performance Report history **24 months**; Review Management has "**hourly** review updates."
**Plan tier: Local Base ($30/mo per location) does NOT include Listing Management. Local Pro ($60/mo per location) does.** This is a common and costly misreading.
[https://www.semrush.com/kb/1391-semrush-local , https://www.semrush.com/kb/1071-listing-management-listings-tab , https://www.semrush.com/kb/1611-local-toolkit-pricing-and-plans , 4 Oct 2026]

**Advertising Toolkit / PLA Research.** PLA Research "helps you uncover valuable insights into how other advertisers are running their Google Shopping campaigns"; three tabs — PLA Positions, PLA Competitors, PLA Copies. Historical PLA/Shopping data "going back to **2012**".
Documented toolkit limits: Ads Launch Assistant **100 AI-generated Google ad copies/month + 100 Meta ad copies/month**. AdClarity (**Pro only**): **1 location, 3 months history, up to 50 reports/month, 1 channel, 5 campaign results, up to 100 ad search results, up to 5 exports/month**, "access to 30+ global markets", compare "up to 10 advertisers or publishers".
**PLA Research is included in both Base ($99) and Pro ($220). AdClarity is Pro only.** **No rows-per-report cap is documented for PLA Research** on any primary page checked — do not state one.
[https://www.semrush.com/kb/23-pla-research , https://www.semrush.com/kb/519-product-listing-ads-positions , https://www.semrush.com/kb/1551-pricing-and-plans , https://www.semrush.com/kb/1563-advertising-toolkit-faqs , 4 Oct 2026]

**Social Toolkit.** Composition: Social Dashboard, Social Tracker, Social Poster, Social Content Insights, Social Analytics, Influencer Analytics, Media Monitoring.
[https://www.semrush.com/kb/811-semrush-social , 4 Oct 2026]
- **Social Poster** — "plan, create, schedule, and publish content across multiple social media platforms—all from a centralized interactive calendar." Platforms: Facebook Business Pages, Instagram (via Facebook), LinkedIn, Google Business Profile, Pinterest, TikTok. Limit: bulk upload **up to 100 posts per CSV file**.
[https://www.semrush.com/kb/756-social-poster , 4 Oct 2026]
- **Social Tracker** — "monitor your competitors' social media performance and benchmark it against your own on a centralized dashboard." Up to **20 competitor profiles**; Facebook, Instagram, YouTube, Pinterest. History from activation: YouTube 28 days or 1,000 videos; Facebook 70 days or 2,000 posts; Instagram 100 days or 2,000 posts.
[https://www.semrush.com/kb/33-social-tracker and https://www.semrush.com/kb/64-historical-data , 4 Oct 2026]
- **Social Analytics** — "enables you to monitor your social media performance across multiple platforms from a single dashboard." Data windows: Facebook last 90 days (up to 500 posts); Instagram last 90 days (up to 2,000 posts); TikTok last 15 days (up to 100 posts); LinkedIn last 30 days (up to 2,000 posts). Social Content Insights lookbacks: FB 90 / IG 90 / TikTok 15 / LinkedIn 30 / Pinterest 85 days.
[https://www.semrush.com/kb/1065-social-analytics , 4 Oct 2026]
- **"Social Content AI" is not Semrush's own name.** The KB calls it the **AI Social Content Generator** — "helps you create a library of fresh, brand-friendly images and video content for your social platforms." Documented price **$35/month**, with limits: up to **2 brands**; up to **1,500 credits/month**; max **200 posts/month**; **100 competitor analyses/month**; **50 minutes of voiceover/month**; up to **5 social channels per brand**. Add-ons: "AI Social Generator Plus: **+$20/month**" (+1 brand, +850 credits, +100 posts, +50 analyses, +100 voiceover minutes); "Premium Stock Assets **+$15/month**". **It sits outside the Social Base/Pro/Business ladder**, and the docs do not say it is bundled into any Social tier.
[https://www.semrush.com/kb/1368-ai-social-content-generator , 4 Oct 2026]
**Note the price conflict:** the KB says the AI Social Content Generator is **$35/mo**, while the pricing bundle's code constants hold `socialContentAI = 29.99` and `socialAIStarter = 20` (§3.3). Cite the KB's $35 as the documented price and flag the discrepancy.
- **Social Toolkit tiers** per the KB: Base $20 — 5 profiles, 50 scheduled posts/month, 10 competitor profiles; Pro $40 — 10 profiles, unlimited posts, 20 competitor profiles; Business $250 — adds Influencer Analytics (Instagram, TikTok, YouTube, Twitch) and media monitoring for **10 keywords**.
[https://www.semrush.com/kb/1544-social-toolkit-pricing-and-plans , 4 Oct 2026]
**Internal conflict:** kb/33 says "up to 20 profiles" without a plan caveat; kb/1544 caps Base at 10 tracked profiles. The pricing tab says Base tracks "up to 10".

**Semrush One.** "Semrush One combines the SEO and AI Visibility toolkits in a single subscription, covering visibility on both search engines and AI chat platforms." Three tiers: Starter, Pro+, Advanced. Scope limit, verbatim and useful: "**The AI Visibility Toolkit is designed for monitoring one or a few domains**" — larger multi-brand organisations are steered to Enterprise AIO.
[https://www.semrush.com/kb/1608-semrush-one , 4 Oct 2026]

**Enterprise AIO.** "tracks every brand mention, source, and competitor, while giving clear optimization actions. Powered by the market's leading prompt database." Prompt coverage is shared: "Coverage is consistent across all Semrush surfaces, whether you're accessing this data from **Enterprise AIO or Semrush One**." Custom pricing.
[https://enterprise.semrush.com/ and https://www.semrush.com/news/458100-semrush-expands-ai-visibility-database-to-32-countries-with-17-new-regional-markets/ , 4 Oct 2026]

**Historical Data gating, verbatim — the clearest proof of the old/new naming mess:** historical data needs "at least a **Guru**-level subscription or higher to the SEO Toolkit **or a Semrush One Pro+** (or higher) subscription." Both vocabularies in one sentence. This also confirms the intended **Guru ↔ Pro+** equivalence.
[https://www.semrush.com/kb/64-historical-data , 4 Oct 2026]

### 6.9 Plan-name crosswalk (inferred from limits — Semrush does not publish a crosswalk)

| Legacy SEO Toolkit | New plan | Match basis |
|---|---|---|
| Pro ($139.95) | **SEO** ($139.95) | identical limits: 5 / 500 / 100k / 10,000 / 250 |
| — | **Starter** ($199) | Pro-level SEO limits **plus** bundled AI Visibility (50 prompts/day) |
| Guru ($249.95) | **Pro+** ($299) | identical limits: 15 / 1,500 / 300k / 30,000 / 1,000 — confirmed by kb/64's "Guru… or Semrush One Pro+" |
| Business ($499.95) | **Advanced** ($549) | identical limits: 40 / 5,000 / 1M / 50,000 / 5,000; both gate API access and Share of Voice |

**This is an inference from matching limit values, clearly labelled as such. Semrush publishes no crosswalk:** `https://www.semrush.com/kb/1624-semrush-one-vs-seo-toolkit` has a crosswalk-sounding title but **redirects to the generic pricing page** (byte-identical response to /prices/) — the comparison table its title promises is not retrievable. Verified 4 Oct 2026. Do not cite it as a source for the mapping.

Prices moved too: Guru $249.95 → Pro+ $299 (+$49.05/mo) and Business $499.95 → Advanced $549 (+$49.05/mo), while Pro → SEO held at $139.95. **That is a real, quotable price rise at the two upper tiers**, and the honest way to put it is: same documented limits, higher price, plus bundled AI-visibility features at Starter and above.

### 6.10 Three more SEO tools, now verified

**Backlink Audit.** Lets you "audit your domain's backlink profile to help you take a deeper look at which links may positively or negatively affect your rankings" — toxicity scoring, disavow file, outreach for link removal, Lost & Found report; integrates Google Search Console, Google Analytics and Majestic.
**Limits:** up to **500 links per referring domain** from the Semrush database, **10 per referring domain** via Majestic; file uploads **50 MB**; outreach max **500 emails/day**; Toxicity Score **0–100**; initial link set gathered "going back **3 months** from the start of your campaign". "**Without an SEO Toolkit subscription, you can manually re-run a campaign once per week**" — paid gets unlimited re-runs; export and automated crawls are subscriber-only.
**Plan tier:** the page distinguishes only "included in the SEO Toolkit" vs "without an SEO Toolkit subscription". **No Pro/Guru/Business or Starter/Pro+/Advanced breakdown exists — do not invent one.**
[https://www.semrush.com/kb/295-backlink-audit-tool , 4 Oct 2026]

**Domain Overview.** "a tool that shows a website's organic traffic, paid traffic, backlinks, and comprehensive AI visibility in a single report" — also tracks "AI Visibility Score, total mentions, and cited pages and sources in AI-generated answers", at domain, subdomain, subfolder or URL level.
**Limits:** requests/day 10 (no toolkit) / 3,000 (Pro) / 5,000 (Guru) / 10,000 (Business). "Historical data in Domain Overview is available **only on Guru and Business** subscriptions." "The **Growth and Compare by Countries** reports require a Guru or Business subscription." No row cap or update frequency stated.
[https://www.semrush.com/kb/semrush-reports-tools/domain-analytics/domain-overview/ , 4 Oct 2026]

**Keyword Gap (fuller detail).** "offers a side-by-side comparison between keyword profiles of **up to five competitors**," showing "all of the top opportunities for each site, total keyword overlap, common keywords shared by all sites, and more."
**Limits:** up to **5 domains** at once. Results per report 10,000 / 30,000 / 50,000 (Pro / Guru / Business). Export tiers: "the first 100, 500, 1,000, 3,000, 10,000, 30,000, or 50,000". Keyword types: organic (Google top 100), paid (Google Ads top 8), PLA. **Historical data and URL/subdomain/subfolder comparison require Guru or Business.**
[https://www.semrush.com/kb/28-keyword-gap , 4 Oct 2026]

### 6.11 Tools with partial or no documentation — handle with care

Absence of a limit here does **not** mean "no limit exists" — it means Semrush does not publish one that could be found.

| Tool | What IS verified | What is NOT |
|---|---|---|
| **Log File Analyzer** | Exists as a product page: analyze access logs to "take a look at your site from the perspective of a Googlebot" and "identify bugs, crawling issues, and other technical SEO problems". Shows Googlebot activity over a **30-day** window, HTTP status codes, file types crawled, a "Hits by Pages" report, desktop-vs-mobile bot filtering. Supported formats: **Combined Log Format, W3C Extended, Amazon Classic Load Balancer, Kinsta**; files must be **unarchived**. The 2018 launch page still labels it "**open beta**". [https://www.semrush.com/features/log-file-analyzer/ , https://www.semrush.com/news/272325-log-file-analyzer-open-beta/ , 4 Oct 2026] | **No file-size limit, line count, upload count or plan tier is documented anywhere.** Its KB URL `/kb/semrush-reports-tools/projects/log-file-analyzer/` returns a hard **404**; repeated domain-restricted searches surfaced **no KB article**; the linked manual PDF did not serve. ⚠ **A "10 GB/day, 3-month retention" figure circulating for this tool actually belongs to Semrush Enterprise log analysis, a different product — do not attribute it here.** |
| **Link Building Tool** | "allows you to find prospects based on your target keywords and competitors, start outreach directly from the platform, and keep track of your campaigns." Four tabs: Overview, Prospects, In Progress, Monitor. Prospects come from entered keywords, domains linking to entered competitors, manual uploads, or lost backlinks. [https://www.semrush.com/features/link-building/ , 4 Oct 2026] | **No numeric limit of any kind is documented** (prospects, keywords, competitors, emails/day, campaigns), and **no plan tier**. `/kb/semrush-reports-tools/projects/link-building-tool/` → hard **404**; `/kb/827-configuring-link-building`, `/kb/731-link-building` and `/kb/737-reviewing-link-building-prospects` all resolve to a generic SEO Toolkit landing page. |
| **SEO Writing Assistant** | Listed as a **Guru**-tier inclusion on kb/1547, i.e. Pro+ or above in 2026 naming. On the free plan: "one piece of content" (blog). | No per-month usage limit on paid tiers confirmed. |
| **Topic Research** | Listed as a **Guru**-tier inclusion on kb/1547. | No limits confirmed. |
| **ContentShake AI** | **No page under that name.** Content Toolkit has a **Base plan only**, $60/mo, "10,000 articles/mo", "5 SEO content boosts/mo", 7 languages. | Whether ContentShake AI still exists as a distinct product. |
| **AI Brand Sentiment** | "**weekly** data on brand sentiment" (kb/997); appears as a plan feature from Starter up. | No numeric limits. |
| **Prompt Research** | Named in the Discover nav and on /features/keyword-research/. | No limits doc retrieved. |
| **Semrush MCP** | "MCP Access: Yes" on all four paid tiers (incl. the SEO tier); Advanced gets "higher usage limits and deeper data endpoints in API and MCP access". Docs at developer.semrush.com/api/v4/introduction/semrush-mcp/. | **No numeric MCP request limits published.** |
| **AI Visibility Index** | Linked from the homepage and the Resources nav. | Not located as a documented product with limits. |
| **Agency Growth Kit** | — | **No page, price or KB article under this name.** See §3.4. |
| **API unit prices** | Packages of 2M/5M/10M/20M units; Advanced/Business tier required; unused units expire. | **No dollar price published.** See §2.8. |
| **AI Visibility per-user surcharge** | Referenced by two tooltips. | **No price found.** See §2.5. |

### 6.12 Enterprise
Published Enterprise feature list, verbatim: "Unlimited projects & custom limits • Custom large-scale AI prompt tracking • Daily or weekly tracking frequency • Multi-brand, multi-product AI visibility • Advanced AI Automations and content workflows • Forecasting & ROI attribution • Multi-million-page crawling • Custom integrations & API • SSO, team governance & audit logs • Dedicated account manager • Enterprise SLA & 24/7 support". Pricing: "Custom pricing available."
Named Enterprise products in the footer: **Enterprise SEO, Enterprise AIO, Enterprise SI, Insights24, Mfour**.
[https://www.semrush.com/prices/ , 4 Oct 2026]

---

## 7. Data scale claims Semrush publishes

- "analysis of trends across **190+ countries**" (Traffic & Market Pro)
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]
- "**Website traffic data dating back to 2012.**" (Traffic & Market pricing tab)
[https://www.semrush.com/pricing/traffic-and-market/ , 4 Oct 2026]
- "historical data dating back to **2017**" (same product, KB) — **conflicts with the 2012 claim above**; cite one and name the page.
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]
- "Real-time display, video, and social ad occurrences across **650 thousand publishers** from **51 global markets**." (AdClarity)
[https://www.semrush.com/pricing/advertising/ , 4 Oct 2026]
- "market comparisons across **30+ global regions**" (Advertising Pro)
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]
- "**70+ authoritative directories** (availability varies by country)" (Listing Management)
[https://www.semrush.com/kb/1011-subscriptions , 4 Oct 2026]
- "**over 28 million users globally**" — Adobe's description of Semrush at acquisition close.
[https://news.adobe.com/news/2026/04/adobe-completes-semrush-acquisition , 28 Apr 2026]
- "Data from **20+ Semrush tools**" (Base Report); "**20+ external integrations**" (Pro Report)
[https://www.semrush.com/prices/ , 4 Oct 2026]
- Award claims in SEC filings: US and UK search awards for "**Best SEO Software Suite**" (2017); "**Best SEO Software Suite**" and "**Best Search Software Tool**", European Search Awards (2020).
[https://www.sec.gov/Archives/edgar/data/1831840/000162828026013259/semr-20251231.htm , 10-K FY2025, filed 2 Mar 2026]

### 7.1 The canonical data page

`https://www.semrush.com/our-data/` and `https://www.semrush.com/company/stats-and-facts/` both return **HTTP 404** as of 4 Oct 2026. **The live canonical data page is `https://www.semrush.com/kb/997-semrush-data` ("Semrush Data & Metrics").** Use that, not the dead URLs that older reviews cite.

### 7.2 Homepage stat strip — verbatim, directly verified

Under the heading "The data you need to outrank the competition":

| Figure | Label | Strapline |
|---|---|---|
| **28B** | Keywords | "More keywords means more ways to win." |
| **43T** | Backlinks | "Build credibility with the largest database on the market." |
| **808M** | Domain profiles | "Your (secret) market insights superpower." |
| **142** | Geo databases | "You're covered all around the world." |
| **317M+** | LLM prompts | "Monitor more prompts. Grow your visibility faster." |

[https://www.semrush.com/ , 4 Oct 2026 — verified directly from page markup]

### 7.3 KB 997 "At a glance" list — verbatim, directly verified

> "142 geographic databases · 28.8 billion keywords · 808 million domains · 43 trillion backlinks · 500TB of raw website traffic data · 317 million AI prompts"

[https://www.semrush.com/kb/997-semrush-data , 4 Oct 2026 — verified directly]

### 7.4 Methodology quotes from KB 997 — verbatim, directly verified

- **Backlinks and crawl rate:** "Our backlink data comes from our own proprietary backlink crawler. This crawler combs through **approximately 10 billion web pages daily**, adding new links to our database of **over 43 trillion backlinks**."
- **SERP collection:** "we partner with third-party data providers to collect Google's search engine results pages (SERPs) for **hundreds of millions of the most popular keywords**. We collect information about the websites that are listed in the **top 100 positions**. We study both organic search results and paid search results."
- **Traffic & Market panel:** "The data in our Traffic & Market toolkit comes from our panel of **over 200 million real, anonymized internet users across more than 190 countries and regions**. We partner with hundreds of clickstream data providers to build this panel, which records **billions of events on the internet each month**."
- **Advertising:** "Our database contains **over 1 billion Google Ads**, with historical data going back to **January 2012**."
- **AI visibility:** "Semrush's AI Visibility Toolkit analyzes how brands appear in AI-generated answers across platforms like **ChatGPT, Google AI Mode, Gemini, Perplexity, and SearchGPT**. It collects and refreshes **317M+ prompts monthly**, measuring visibility, mentions, competitor gaps, and cited sources." Prompt Tracking "provides **daily** data on prompt-level performance."
- **Awards, hedged:** "the platform has earned **numerous industry awards** across Europe, the US, MENA, the UK, and from the Interactive Marketing Search Awards." (No count given here.)

[all: https://www.semrush.com/kb/997-semrush-data , 4 Oct 2026 — verified directly]

### 7.5 Other published scale claims

- Backlinks product page: "a backlink index of **more than 43 trillion backlinks**" and "**390 million referring domains**"; "The database is **refreshed at least hourly**."
[https://www.semrush.com/analytics/backlinks/ , 4 Oct 2026]
- Keyword research feature page: "**28B+ keywords**", "**142 regional keyword databases**", "**808M domain profiles**".
[https://www.semrush.com/features/keyword-research/ , 4 Oct 2026]
- KB "What is Semrush": "**17 years of continuous web crawling**—**289M+ prompts, 28B+ keywords, 43T+ backlinks, and 800M+ domain profiles**".
[https://www.semrush.com/kb/995-what-is-semrush , 4 Oct 2026]
- Regional databases: "**More than 140 country databases**"; **28 original regional databases** are included with the SEO Toolkit (AR, AU, BE, BR, CA, DK, DE, FI, FR, HK, HU, IE, IL, IN, IT, JP, MX, NL, NO, PL, RU, SG, ES, SE, CH, TR, US, UK), with "over a hundred more regional databases" addable. **India (IN) is one of the 28 included by default** — useful for the India section.
[https://www.semrush.com/kb/287-what-countries-does-semrush-cover , 4 Oct 2026]
- Mobile: **18 regional mobile databases**.
[https://www.semrush.com/kb/718-what-mobile-databases-are-available-on-semrush , 4 Oct 2026]
- Historical depth by database cohort: "**9 core databases**" back to **January 2012** (US, UK, Canada, Australia, France, Italy, Germany, Spain, Brazil); "**15 additional regional databases**" back to **December 2013**; "**89 newer regional databases**" from **December 2016** — i.e. 113 of the 142 have history.
[https://www.semrush.com/kb/64-historical-data , 4 Oct 2026]
- AI visibility geographic coverage: "expanded its AI visibility prompt database to **32 countries**… adding **17 new regional markets**… grows the total prompt database to **261 million prompts globally, including 126 million US prompts and 58.4 million ChatGPT prompts**."
[https://www.semrush.com/news/458100-semrush-expands-ai-visibility-database-to-32-countries-with-17-new-regional-markets/ , published 14 May 2026, checked 4 Oct 2026]
- Listing Management: "**70+ for the US, 40+ for other countries**", plus voice-search distribution to "Amazon Alexa, Apple, Bing, and Google".
[https://www.semrush.com/kb/1391-semrush-local , 4 Oct 2026]
- Search engines covered: "Google, Bing, Baidu, DuckDuckGo, and Yandex, plus AI platforms including ChatGPT, Gemini, Perplexity, and SearchGPT".
[https://www.semrush.com/kb/997-semrush-data , 4 Oct 2026]

### 7.6 User-count and award claims — handle with care

| Claim | Page |
|---|---|
| "**10M marketers already use Semrush**" / "10M Marketing professionals have already used Semrush" / "**35% Fortune 500** companies use Semrush as their go-to marketing tool" | https://www.semrush.com/partner/semrushpro/ |
| "Used by **28M marketers worldwide**" / "Chosen by **35% of the Fortune 500**" | https://www.semrush.com/features/keyword-research/ |
| "**21 International awards** for best SEO software suite" / "Awarded best SEO software suite **21 times**" | https://www.semrush.com/partner/semrushpro/ and https://www.semrush.com/features/keyword-research/ |
| G2 2026 Best Software Awards: "Best Global Software Companies" **#20**; "Best Software Products" **#42**; "Best Marketing and Digital Advertising Software Products" **#9**; "Best AI Software Products" **#13** | https://www.semrush.com/news/447617-semrush-named-to-four-of-g2s-2026-best-software-awards-lists/ |
| "a leader in enterprise SEO solutions" per **Forrester Wave™ (Q3 2025)**; recognised in the "**2026 Gartner Market Guide for Answer Engine Visibility Tools**" | https://enterprise.semrush.com/ |
| Named enterprise customers: "Samsung, LG, Roche, ZoomInfo, and Hertz" | https://www.semrush.com/kb/995-what-is-semrush |
| Enterprise logo wall: AstraZeneca, Luxottica, DoorDash, Nasdaq, Vodafone, Hertz, Danone, TikTok, Temu, Apple, Samsung, Salesforce | https://enterprise.semrush.com/ |

[all checked 4 Oct 2026]

### 7.7 ⚠ Semrush contradicts itself — flag these, do not average them

A review that quietly picks one number is wrong-by-omission. These are live, simultaneous, on Semrush's own pages:

| Claim | Live figures found | Recommendation |
|---|---|---|
| Keyword database | **28.8B** (kb/997) · **28B** (homepage) · **28B+** (features page, kb/995) · **27.3B** (kb/262) · **26B** (analytics/keywordmagic) · **"over 500 million"** (kb/287 — badly stale, ~58× low) | Cite **28.8 billion** with kb/997 as the source, and note Semrush's own pages range from 26B to 28.8B. **Never cite kb/287 for database size.** |
| Marketers using Semrush | **10M** (partner page) vs **28M** (keyword-research page) vs **"over 28 million users globally"** (Adobe, 28 Apr 2026) | A ~3× discrepancy. Quote the Adobe close figure (28M) as the dated one and name the conflict. |
| AI prompt database | **261M** (news, 14 May 2026) · **289M+** (kb/995) · **317M+** (homepage, kb/997) | Cite **317M+** as current; the others lag. |
| Geo databases | **142** (homepage, kb/997, features) vs "more than 140" (kb/287) vs **113** with historical coverage (kb/64) | Cite 142, note only 113 carry history. |
| Historical traffic depth | "dating back to **2012**" (Traffic & Market pricing tab) vs "**2017**" (kb/1011) vs "Monthly data available from **January 2017**" (kb/1506) | Two of three say 2017. Cite 2017 for Traffic & Market, 2012 for keyword/SERP history. |
| Trial length | **7-day** (pricing page, kb/1011, kb/995) vs **14-day** (partner page) | 7 days is the dominant and most-sourced figure. The 14-day one is on the partner landing page. |

**Important asymmetry for the article:** Semrush has **142 keyword geo-databases** but AI-visibility prompt coverage in only **32 countries**. That gap is a genuine buying consideration for a non-US reader and no competitor review appears to state it.
[https://www.semrush.com/kb/997-semrush-data and https://www.semrush.com/news/458100-semrush-expands-ai-visibility-database-to-32-countries-with-17-new-regional-markets/ , 4 Oct 2026]

---

## 8. Company facts

### 8.1 The headline: Semrush was acquired by Adobe and is no longer public

| Event | Date | Source |
|---|---|---|
| Merger Agreement signed (Semrush Holdings, Adobe Inc., Fenway Merger Sub, Inc.) | **18 Nov 2025** | [8-K filed 19 Nov 2025](https://www.sec.gov/Archives/edgar/data/1831840/000095010325014983/dp237534_8k.htm) |
| Announced — all-cash, **$12.00 per share**, total equity value **~$1.9 billion** | **19 Nov 2025** | [Adobe press release PDF](https://news.adobe.com/news/downloads/pdfs/2025/11/adobe-to-acquire-semrush.pdf) |
| Stockholder approval | **3 Feb 2026** | 10-K FY2025, filed 2 Mar 2026 |
| **Acquisition COMPLETED** | **28 Apr 2026** | [8-K filed 28 Apr 2026](https://www.sec.gov/Archives/edgar/data/1831840/000114036126017299/ef20071354_8k.htm) |
| NYSE delisting (trading suspended before market open) | **28 Apr 2026** | 8-K Item 3.01; Form 25-NSE, 28 Apr 2026 |
| SEC registration terminated (Form 15-12G) — "holders of record… **One (1)**" | **8 May 2026** | [Form 15-12G](https://www.sec.gov/Archives/edgar/data/1831840/000114036126019747/ef20072227_1512g.htm) |

- 8-K, verbatim: "On April 28, 2026, Adobe Inc. … completed its previously announced acquisition of Semrush Holdings, Inc." Each share "was automatically converted into the right to receive **$12.00 in cash, without interest**."
[https://www.sec.gov/Archives/edgar/data/1831840/000114036126017299/ef20071354_8k.htm , 28 Apr 2026]
- Adobe's release title: "**Adobe Completes Semrush Acquisition, Strengthening CX Enterprise with Enhanced Brand Visibility Capabilities**", San Jose, 28 April 2026.
[https://news.adobe.com/news/2026/04/adobe-completes-semrush-acquisition , 28 Apr 2026]
- Semrush's own newsroom: "**Adobe has officially acquired Semrush**."
[https://www.semrush.com/news/455963-faq-for-customers-adobe-acquires-semrush/ , 28 Apr 2026]
- Semrush is now a **wholly owned subsidiary of Adobe** (change of control reported under Item 5.01).
- **`https://investors.semrush.com/` now returns HTTP 301 → `http://www.semrush.com/`** — the investor-relations site is gone because the company was taken private and deregistered.
[verified 4 Oct 2026]
- Adobe noted pre-close: "Adobe has received commitments to vote in favor of the transaction from **Semrush's founders** and other stockholders representing **over 75% of the voting power**."
[https://news.adobe.com/news/downloads/pdfs/2025/11/adobe-to-acquire-semrush.pdf , 19 Nov 2025]

**Implication for the article:** every "Semrush is a NYSE-listed company" line in competing reviews is now wrong, and there will never be a Semrush financial report newer than FY2025. Leading with this is a real differentiator — and it is also a genuine buyer consideration (product direction under Adobe, pricing changes).

### 8.2 Founded

- **Founded 2008.** Verbatim: "**We were founded in 2008.** We completed our initial public offering in 2021 and our Class A common stock is currently listed on the New York Stock Exchange under the symbol 'SEMR'."
[https://www.sec.gov/Archives/edgar/data/1831840/000162828026013259/semr-20251231.htm , 10-K FY2025, filed 2 Mar 2026]
- "We have developed our technology platform, and various products, tools, and features, over the **last 17 years**. Since our founding in 2008…" [same]
- **Founders: Oleg Shchegolev and Dmitry Melnikov.** The proxy's board table marks both "‡ Co-Founder": "Oleg Shchegolev … **Co-Founder, Chief Technology Officer, and Director**"; Dmitry Melnikov, Director, co-founder, board tenure 12.5 years.
[https://www.sec.gov/Archives/edgar/data/1831840/000162828025018235/semr-20250417.htm , DEF 14A, filed 17 Apr 2025]
- Shchegolev **resigned as CEO effective 10 March 2025** and moved to CTO; **William ("Bill") Wagner** became CEO.
[DEF 14A 17 Apr 2025; 10-K FY2025 signature page, 2 Mar 2026]
- **Semrush's own `/company/about-us/` and `/company/stats-and-facts/` pages both returned HTTP 404 on 4 Oct 2026**, so the founding facts above are sourced from SEC filings instead. `https://www.semrush.com/company/` returns 200 but carries no company statistics; its footer reads "© 2026 Semrush Holdings" and includes an **Adobe Business** link.

### 8.3 Listing and IPO (now historical)

- **Ticker/exchange: NYSE: SEMR**, Class A Common Stock, par value $0.00001. Commission File Number 001-40276. Delaware incorporation. HQ **800 Boylston Street, Suite 2475, Boston, MA 02199**.
[10-K FY2025 cover page, 2 Mar 2026]
- Shares sold in the IPO **24 March 2021 at $14.00 per share**; **first day of trading 25 March 2021**; IPO closed **29 March 2021** — 10,000,000 Class A shares, **gross proceeds $140.0 million**, net ~$126.6 million. Underwriters' partial option closed **23 April 2021** for a further **719,266 shares**.
[https://www.sec.gov/Archives/edgar/data/1831840/000162828022006731/semr-20211231.htm , 10-K FY2021, filed 18 Mar 2022]
- **Delisted 28 April 2026; registration terminated 8 May 2026.**

### 8.4 Latest reported financials — FY2025 is the final set

Source for all figures: **Exhibit 99.1 to the 8-K filed 2 March 2026, "Semrush Announces Fourth Quarter and Full Year 2025 Financial Results," dated 2 March 2026**, cross-checked against the **10-K for FY ended 31 December 2025, filed 2 March 2026**.
[https://www.sec.gov/Archives/edgar/data/1831840/000162828026013251/semrush8-kexhibit991q42025.htm and https://www.sec.gov/Archives/edgar/data/1831840/000162828026013259/semr-20251231.htm]

| Metric | Figure |
|---|---|
| **FY2025 revenue** | **$443.6 million ($443,644K), up 18% YoY** |
| FY2024 revenue | $376.8 million ($376,815K) |
| FY2023 revenue | $307.7 million |
| **Q4 2025 revenue** (last quarter ever reported) | **$117.7 million, up 15% YoY** |
| **Total ARR, 31 Dec 2025** | **$471.4 million, up 15% YoY** |
| Total ARR, 31 Dec 2024 | $411.6 million |
| Q4 2025 net new ARR | $16.1 million, up 48% YoY |
| **AI Products ARR** | **over $38 million** (from $4 million a year earlier) |
| **Enterprise platform ARR** | **$37 million across 579 customers** (from $9 million a year earlier) |
| ARR per paying customer | **$4,369** (31 Dec 2025) vs $3,522 (31 Dec 2024) |
| Dollar-based net revenue retention | **104%** (31 Dec 2025); 106% (31 Dec 2024) |
| Gross margin FY2025 | **81%** (FY2024: 83%) |
| GAAP loss from operations | $(13.9)M Q4 2025; $(22.8)M FY2025 |
| Non-GAAP income from operations | $15.0M Q4 2025 (12.8% margin); $53.3M FY2025 (12% margin) |
| Cash flow from operations | $14.9M Q4 2025; $59.6M FY2025 (13.4% margin) |
| Sales & marketing FY2025 | $176.6M (40% of revenue) |
| R&D FY2025 | $97.2 million |
| Compound avg annual revenue growth FY2019–FY2025 | **30%** |

ARR definition, verbatim: "We define ARR as the total subscription revenue as of a given date that we expect to contractually receive over the subsequent 12 months from customers on an annualized basis, assuming no increases, reductions or cancellations." [10-K FY2025]

**No guidance exists:** "Semrush will **not** hold an earnings call or provide guidance for the first quarter of 2026 or the full-year 2026 due to the anticipated closing of the Adobe transaction." [Q4 2025 release, 2 Mar 2026]

### 8.5 Customers, users, employees

| Metric | Figure | Source |
|---|---|---|
| **Paying customers, 31 Dec 2025** | **~108,000** | 10-K FY2025, 2 Mar 2026 |
| Paying customers, 31 Dec 2024 | ~117,000 | same |
| **Net change in FY2025** | **decrease of ~9,000** — "primarily attributable to continued softness at the lower end of the market where our customer segment includes **freelancers and less sophisticated users**… macro-economic pressures, industry-wide increases in paid search cost-per-click, and **some consolidation in the market from AI**" | same |
| Countries with paying customers | **145** | same |
| Customers paying **>$10,000/yr** | **grew 31% YoY** — absolute count **not disclosed** | Q4 2025 release |
| Customers paying **>$50,000/yr** | **grew over 74% YoY** — count **not disclosed** | same |
| Enterprise platform customers | **579** | same |
| **Total users** | "**over 28 million users globally**" | Adobe closing release, 28 Apr 2026 |
| Active free customers | **1,000,000+** (milestone crossed 2023; no 2025 figure published) | 10-K FY2025 |
| **Full-time employees, 31 Dec 2025** | **1,567** — 494 Spain, 324 US, 137 Germany, 137 Serbia, 133 Netherlands, 117 Cyprus, 97 Czech Republic, 128 other/remote. Plus **148 contractors**. | 10-K FY2025 |
| Unionization | "None of our employees are represented by labor unions or covered by collective bargaining agreements." | same |
| **Offices** | "headquartered in **Boston** and has offices in **Austin, Dallas, Amsterdam, Barcelona, Belgrade, Berlin, Munich, Limassol, Prague, Warsaw, and Yerevan**" | Q4 2025 release, 2 Mar 2026 |
| Named customers | **Amazon, JPMorganChase, TikTok** | Adobe PDF, 19 Nov 2025 |
| Brands owned | **Prowly, Ryte, Sellzone, Kompyte** (registered trademarks) | 10-K FY2025 |
| No concentration | "No single customer accounted for more than 10% of our revenue in the year ended December 31, 2025" | 10-K FY2025 |

### 8.6 ARR and customer milestones, verbatim from the FY2025 10-K
2010 surpassed 1,000 customers · 2015 surpassed 10,000 customers · 2017 first round of financing · 2018 financing round led by **Greycroft and e.ventures**, surpassed **$70 million ARR**, launched Semrush Local and Semrush Intelligence · 2019 surpassed **50,000 customers and $100 million ARR** · 2020 headcount grew to more than **900 employees** globally · 2021 completed IPO and Follow-On Offering, surpassed **$200 million ARR** · 2022 launched first AI product powered by ChatGPT 1.0 · 2023 surpassed **$300 million ARR, 100,000 paying customers, and 1,000,000 active free customers** · 2024 surpassed **$400 million ARR**, GA of Enterprise SEO · 2025 surpassed **$460 million ARR**, launched **AI Visibility Toolkit and Enterprise AIO**, entered Merger Agreement with Adobe.
[https://www.sec.gov/Archives/edgar/data/1831840/000162828026013259/semr-20251231.htm , filed 2 Mar 2026]

### 8.7 Company-facts caveats
- **No absolute count of customers paying >$10k ARR was ever published** — only the YoY growth rate (31%). Do not state a count.
- The **28 million users** figure is **Adobe's**, from the closing release. Semrush's own filings never quantified total users beyond "1,000,000+ active free customers" as a 2023 milestone.
- There will be **no financial data newer than FY2025 / Q4 2025**. Any 2026 Semrush revenue or ARR figure circulating is not from a primary source.
- Adobe's **$1.9 billion** is **equity value**; "$2 billion" in press reports is rounding or enterprise value.
- SEC EDGAR responded normally with a declared User-Agent (not blocked). The submissions JSON now returns **empty `tickers` and `exchanges` arrays**, consistent with deregistration.

### 8.8 Event Semrush is currently promoting
A site-wide banner advertises an event: "Discover how leading brands get found and chosen in AI answers. **October 13, 2026 — London, UK.** Get your ticket now."
[https://www.semrush.com/prices/ , 4 Oct 2026]

---

## 9. Official Semrush YouTube videos

### 9.1 The official channels
- **Main channel: "Semrush"** — https://www.youtube.com/@semrush — canonical channel ID `UCj7v9UM1aGx6GR-nsY-9u8w`. Verified by fetching the channel's own RSS feed, which returns `Channel Title: Semrush`. The legacy `/user/SEMrushHQ` URL resolves to the same channel ID.
[https://www.youtube.com/feeds/videos.xml?channel_id=UCj7v9UM1aGx6GR-nsY-9u8w , 4 Oct 2026]
- **"Semrush Academy"** — https://www.youtube.com/channel/UCIX5KGYyUB-0R9rY_tsAGSg (handle @semrushacademy8519). Semrush-owned, but a **separate channel** from @semrush.

**Verification method:** YouTube's oEmbed API (`youtube.com/oembed?url=...`), which returns the authoritative `author_name` (channel) and `title`. Direct fetches of `youtube.com/watch` pages return only footer/nav markup, so **publish dates, durations and view counts could not be confirmed and are deliberately not stated.**

### 9.2 Video 1 — product walkthrough (main @semrush channel)
- **Exact title:** "Semrush Overview: The All-in-One SEO Toolkit for Marketing Pros"
- **Channel:** Semrush (main official channel)
- **URL:** https://www.youtube.com/watch?v=epX_KJ83I0E
- **Verified:** oEmbed returned `"author_name": "Semrush"`
- Publish date / duration: **not confirmed**
[https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=epX_KJ83I0E&format=json , 4 Oct 2026]

### 9.3 Video 2 — keyword research tutorial (Semrush Academy channel)
- **Exact title:** "How to Perform Keyword Research With SEMrush | Lesson 6/8 | SEMrush Academy"
- **Channel:** Semrush Academy (Semrush's own education channel — **not** the main @semrush channel)
- **URL:** https://www.youtube.com/watch?v=-cPQ6FpbXVQ
- **Verified:** oEmbed returned `"author_name": "Semrush Academy"`
- Publish date / duration: **not confirmed**
[https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=-cPQ6FpbXVQ&format=json , 4 Oct 2026]

**Honest limitation:** **no keyword-research tutorial was confirmed on the main @semrush channel.** Around eight site-restricted searches and ~18 oEmbed-verified candidate IDs produced only third-party results for that topic. The main channel's recent output is short-form SEO news and opinion rather than product tutorials. The Semrush Academy video above is the closest genuinely Semrush-owned option. If main-channel-only is required, browse https://www.youtube.com/@semrush/search?query=keyword%20research in a real browser.

### 9.4 Verified alternates (all Semrush-owned)
- "SEMrush Overview Series: Content Marketing toolkit" — channel **Semrush** (main) — https://www.youtube.com/watch?v=hP3IJw_pFNM — official but older and narrower.
- "Getting Started with Semrush" — channel **Semrush Academy** — https://www.youtube.com/watch?v=AXUpGeNWIos — a good alternate buyer-facing walkthrough.
- "Introduction to Keyword Research | Lesson 1/8 | SEMrush Academy" — channel **Semrush Academy** — https://www.youtube.com/watch?v=36otqm7DrSo — Lesson 1 of the same 8-part course as §9.3.
[all verified via oEmbed, 4 Oct 2026]

### 9.5 ⚠ Verified NOT official — do not cite as Semrush
Each of these was oEmbed-checked and belongs to a third party, despite ranking for "Semrush tutorial" queries:
`HWRCYcfq8Q4` Kevin Stratvert · `lvcKl-hzw8c`, `MVbYI2wCuoE` Style Factory · `u9efjjF6JpA`, `Hdm_cGz_n-k`, `FwsLeKFUzEk`, `squDS2v6EfA` MMX · `vTevwTjc5Zg` Tutorials by Manizha & Ryan · `AYFSX-B8BHM` My First Website · `E2o91oB-wgY`, `Bb0jshGTmSw` Travis Wilkie · `3Zhj4m3oioI` Daragh Walsh · `3C2JRNx1ds4` Tutorial Stack · `OwSpeuADj6o`, `I6vyPs1ZMYk` Grow with Will · `51UgFO4QVSg` Tony Teaches Tech · `TE-Xn6dKcLg` Querylookup Research.
[all via https://www.youtube.com/oembed , 4 Oct 2026]

Note in particular: "The ULTIMATE Semrush Keyword Research Tutorial" (`HWRCYcfq8Q4`) is **Kevin Stratvert's**, not Semrush's — it is widely mis-attributed.

---

## 10. Semrush affiliate programme terms — compliance notes

### 10.0 ⚠ The full terms are NOT publicly published
Semrush's own KB, verbatim: "The Semrush Affiliate Terms and Conditions can be found on the **sign-up page** of the Semrush Affiliate Program. After clicking on the 'Join now' button, you can access and review the terms and conditions before completing the sign-up process."
[https://www.semrush.com/kb/97-affiliate-program , 4 Oct 2026]

The Impact-hosted campaign terms URL (`app.impact.com/campaign-campaign-info-v2/Semrush.brand`) **could not be fetched** — it returned a redirect loop (>10 redirects), i.e. it is login-gated. **Everything below comes from the two pages that ARE public:** the affiliate landing page FAQ and the Trademarks and Brand Usage Policy.

URL notes: `https://www.semrush.com/lp/affiliate-program/` returned **empty content**; the working canonical page is **`https://www.semrush.com/lp/affiliate-program/en/`**. `https://www.semrush.com/company/affiliate-program/` returns **HTTP 404**. The old `berush.com/en/terms` **301-redirects** to the current LP — the legacy BeRush terms page is gone.

### 10.1 Commission, cookie and payout (public FAQ)
[all: https://www.semrush.com/lp/affiliate-program/en/ , 4 Oct 2026]
- Headline: affiliates earn "**up to $450 per sale and $10 for each trial activation**", varying by product and partner tier.
- Trial activations: **$10** per free trial. Sales, base tier: **$100–$300** per sale.
- Tier scaling: **$300–$450 for Semrush One**; **$50–$80 for Social/Local toolkits**; up to **$350** for top-tier products at Platinum level.
- Quarterly content bonus: **$200–$1,500** depending on performance tier.
- **Cookie window: 120 days, last-click attribution.** KB wording: "last-click attribution, **120 days of cookie life**, and the support of a team of dedicated account managers."
[https://www.semrush.com/kb/97-affiliate-program , 4 Oct 2026]
- Referrals take **2+ hours** to appear in dashboard statistics.
- **"Transaction locking happens 27 days after the end of the month"**; payment issued **21 days after** that locking.
- Methods: "**Electronic Funds Transfer or PayPal**", processed through **Impact.com**. No minimum-payout threshold is published.
- The programme is **one-time CPA, not recurring**. (Semrush migrated from in-house BeRush to Impact.com; the berush.com → semrush.com 301 corroborates the migration. The claim that "legacy BeRush affiliates keep recurring commissions" comes from third-party review sites, **not** a Semrush source — treat as unverified.)
- Loyalty programme detail sits in a Semrush-hosted PDF: https://static.semrush.com/kb/uploads/2024/10/03/Loyalty%20Program%20Guide.pdf (located via search; not fetched).

### 10.2 Eligibility and automatic decline reasons
[https://www.semrush.com/lp/affiliate-program/en/ , 4 Oct 2026]
- Minimum **1,000 unique monthly visitors** (content creators) or **1,000+ organic followers** (social accounts).
- Requires high-quality relevant content aligned with the Semrush brand, verified contact information matching the promotional properties, no objectionable content, primarily online-marketing focus.
- **Applications are declined for:** unverified contacts, under-construction/unfinished sites, **coupon/cashback sites**, browser extensions, email-only promotional strategies, and forum-based promotion.

### 10.3 What affiliates MAY NOT claim or do — verbatim clauses
All quotations: [https://www.semrush.com/lp/affiliate-program/en/ , 4 Oct 2026]

**Brand bidding:**
> "you are not allowed to bid on Semrush's branded keywords and ANY misspelled branded keywords like (but not limited to) Smerush, Semrash, Sem rush, Semrus, etc."

**PPC pre-approval:**
> "All PPC advertising campaigns must be pre-approved by the Semrush Affiliate team."

**Trademarks in names/domains:**
> "You are not allowed to use Semrush's trademarks in domain names, social media accounts, or communities names."

**Free-trial misrepresentation — the closest published rule to a coupon/discount restriction. Prohibited:**
> "misrepresenting a free trial as a coupon or discount, advertising invalid trials or offers"

**Misrepresentation:**
> "You should not misrepresent Semrush or its products/services"
— and affiliates must not engage in "false advertising."

**Self-referral:**
> "Self-referrals and commission sharing are strictly prohibited. You are not permitted to use your own affiliate link to make purchases or create accounts for yourself, your relatives, or employees."

**Fraud:** click fraud, cookie stuffing and unauthorised promotional methods are prohibited.

**Disclosure (FTC):**
> "you must follow the Federal Trade Commission (FTC) guidelines when using Semrush affiliate links"
— affiliates must clearly communicate that
> "you may earn a commission or receive compensation for referrals or sales."

**Prohibited placements:** affiliates may not promote on
> "adult websites, gambling sites, or platforms that promote hate speech, violence, or illegal activities."

**Marketing assets:** approved affiliates get "referral URLs and creative assets" via the Impact dashboard. The public page states no usage restrictions on those assets beyond the brand policy below.

### 10.4 Logos, screenshots and brand assets — Trademarks and Brand Usage Policy
[https://www.semrush.com/company/legal/brand-policy/ , 4 Oct 2026]

This policy **explicitly stacks with the affiliate terms**: if you participate in the affiliate programme, your use of the Marks is subject to the affiliate terms **together with** this policy.

**Prohibited uses of the Marks** — no unauthorised use "in the name of your business, product, service, app, or other offering", nor in domain names and social media accounts, nor on promotional merchandise for sale or distribution, nor in **any** advertising (creative, digital, social, PPC), nor in metatags or hidden text.

**Formatting:** "Marks should always be used in their full, exact, most-up-to-date form and color". Do not alter, animate, distort, or combine the Marks with other symbols. Use ™ (or ® only for registered marks). Set apart the first mention via capitalisation, italics, bold, or underlining.

**Required attribution notice**, near a prominent mention:
> "[mark] is a trademark or registered trademark of Semrush Inc. in the U.S. and other countries."

**Screenshots policy — directly relevant to the brief's "do not screenshot Semrush's interface" rule.** You may use screenshots if you:
- do not alter them except to resize;
- do not use portions only;
- do not include them in your own product UI;
- exclude third-party content and personal data.

**Further prohibitions:** nothing that "falsely impl[ies] an endorsement or sponsorship, partnership by, or an affiliation"; no overlapping the Marks with shapes/photos; no association with "vulgar, obscene, indecent or unlawful materials"; nothing that damages Semrush's reputation or goodwill.

**Partners/resellers:** partners need "written consent specifying what Marks you can use". Resellers must include ® or ™ on all materials, provide samples before public use, obtain written approval, and modify or stop use if non-compliant. Contact: **trademarks@semrush.com**.

### 10.5 What our page must therefore do (direct compliance read-across)
1. **FTC disclosure is a programme requirement, not just good practice** — the affiliate FAQ mandates it explicitly. The brief's disclosure box satisfies this; keep it above the first affiliate link.
2. **Never present the free trial as a coupon or discount.** This is an explicitly prohibited claim. Describe it as a 7-day free trial, card required.
3. **No invented discount codes** — already in the brief, and reinforced by the ban on "advertising invalid trials or offers".
4. **Do not use "Semrush" in our own page's branding, domain or social handles**, and do not run PPC on Semrush brand terms without written pre-approval.
5. **Prefer our own original graphics over Semrush screenshots** (as the brief already requires). If a screenshot were ever used, the policy requires it be unaltered except for resizing, whole rather than cropped, and free of third-party content and personal data.
6. **State prices as "as of 4 October 2026, confirm on semrush.com"** — the pricing experiment flag (§0.2) makes this materially true, not just boilerplate.
7. **Do not imply partnership or endorsement** beyond "we are an affiliate and earn a commission."

### 10.6 Published gaps — do NOT assume a rule either way
Not found on any Semrush primary source:
- **Coupon/discount-code promotion rules as such.** The only published adjacent rules are (a) coupon/cashback sites are a stated *decline* reason at application, and (b) the ban on "misrepresenting a free trial as a coupon or discount". Whether an approved affiliate may publish a legitimate Semrush discount code is **not addressed publicly**.
- **Rules about stating prices** — nothing published.
- Minimum payout threshold, commission clawback/refund windows, termination clauses, FTC disclosure placement specifics.
- Third-party blogs make confident claims here (e.g. that PPC traffic must route through your own landing page first). **None of that could be verified against a Semrush source — do not rely on it for compliance.**

**Authoritative text for anything in §10.6** is the T&C shown inside the Impact.com sign-up flow, or email **affiliates@semrush.com** (contact published at https://www.semrush.com/kb/97-affiliate-program).

---

## 11. Master list of URLs used

### Pricing
- https://www.semrush.com/prices/ (canonical https://www.semrush.com/pricing/seo-ai-search/)
- https://www.semrush.com/pricing/semrush-one/ · /ai/ · /traffic-and-market/ · /local/ · /content/ · /social/ · /advertising/ · /pr/
- https://www.semrush.com/pricing/static/814.chunk.1f1dba3e615928199bd8.js (price constants)
- https://www.semrush.com/pricing/static/seo-ai-search.chunk.060cbe34d269a0846a57.js (comparison table)

### Knowledge Base
- https://www.semrush.com/kb/1011-subscriptions (= /kb/856-subscription-plans-comparison)
- https://www.semrush.com/kb/1547-seo-toolkit-pricing-limits
- https://www.semrush.com/kb/1013-billing-faq
- https://www.semrush.com/kb/252-cancelling-your-account
- https://www.semrush.com/kb/31-site-audit · /kb/32-position-tracking · /kb/681-site-audit-troubleshooting · /kb/34-my-reports
- https://www.semrush.com/kb/1400-gst-taxes · /kb/251-taxes-collected · /kb/37-vat-taxes · /kb/1223-us-sales-tax-faq
- https://www.semrush.com/kb/997-semrush-data (canonical data page) · /kb/995-what-is-semrush
- https://www.semrush.com/kb/1608-semrush-one · /kb/1547-seo-toolkit-pricing-limits
- https://www.semrush.com/kb/262-keyword-magic-tool · /kb/696-what-are-the-limits-of-my-position-tracking-campaign · /kb/28-keyword-gap · /kb/295-backlink-audit-tool
- https://www.semrush.com/kb/semrush-reports-tools/domain-analytics/domain-overview/
- https://www.semrush.com/kb/287-what-countries-does-semrush-cover (stale) · /kb/718-what-mobile-databases-are-available-on-semrush · /kb/399-access-more-databases · /kb/64-historical-data
- https://www.semrush.com/kb/1391-semrush-local · /kb/1071-listing-management-listings-tab · /kb/1611-local-toolkit-pricing-and-plans
- https://www.semrush.com/kb/23-pla-research · /kb/519-product-listing-ads-positions · /kb/1551-pricing-and-plans · /kb/1549-getting-started-with-advertising-toolkit · /kb/1563-advertising-toolkit-faqs
- https://www.semrush.com/kb/811-semrush-social · /kb/756-social-poster · /kb/33-social-tracker · /kb/1065-social-analytics · /kb/1368-ai-social-content-generator · /kb/1544-social-toolkit-pricing-and-plans
- https://www.semrush.com/kb/1506-traffic-and-market-traffic-overview · /kb/1121-semrush-traffic-and-market · /kb/1000-competitive-research-bundle
- https://www.semrush.com/kb/97-affiliate-program · /kb/5-api
- https://www.semrush.com/kb/support/ · https://www.semrush.com/cancel/

### Marketing / product pages
- https://www.semrush.com/ (homepage stat strip) · https://www.semrush.com/features/ · https://www.semrush.com/features/keyword-research/
- https://www.semrush.com/analytics/backlinks/ · https://www.semrush.com/analytics/keywordmagic/
- https://www.semrush.com/features/log-file-analyzer/ · https://www.semrush.com/features/link-building/
- https://enterprise.semrush.com/ · https://www.semrush.com/partner/semrushpro/
- https://www.semrush.com/lp/affiliate-program/en/ · https://www.semrush.com/company/legal/brand-policy/

### Legal
- https://www.semrush.com/company/legal/refund-policy/ (Last Updated 20 Aug 2025)
- https://www.semrush.com/company/legal/terms-of-service/ (Last Updated 25 Aug 2026)
- https://www.semrush.com/company/legal/privacy-policy/

### Developer
- https://developer.semrush.com/api/v3/get-started/api-units-balance/
- https://developer.semrush.com/api/v3/analytics/basic-docs/
- https://developer.semrush.com/api/v4/introduction/semrush-mcp/

### Blog / newsroom
- https://www.semrush.com/blog/what-can-i-do-with-a-free-account-from-semrush/ (last updated 10 Dec 2025)
- https://www.semrush.com/news/455963-faq-for-customers-adobe-acquires-semrush/ (28 Apr 2026)
- https://www.semrush.com/news/435826-adobe-to-acquire-semrush/

### SEC / Adobe
- 10-K FY2025 (2 Mar 2026): https://www.sec.gov/Archives/edgar/data/1831840/000162828026013259/semr-20251231.htm
- Q4/FY2025 earnings Ex-99.1 (2 Mar 2026): https://www.sec.gov/Archives/edgar/data/1831840/000162828026013251/semrush8-kexhibit991q42025.htm
- 8-K merger completion (28 Apr 2026): https://www.sec.gov/Archives/edgar/data/1831840/000114036126017299/ef20071354_8k.htm
- Form 15-12G (8 May 2026): https://www.sec.gov/Archives/edgar/data/1831840/000114036126019747/ef20072227_1512g.htm
- 8-K Merger Agreement (19 Nov 2025): https://www.sec.gov/Archives/edgar/data/1831840/000095010325014983/dp237534_8k.htm
- 10-K FY2021 (18 Mar 2022): https://www.sec.gov/Archives/edgar/data/1831840/000162828022006731/semr-20211231.htm
- DEF 14A (17 Apr 2025): https://www.sec.gov/Archives/edgar/data/1831840/000162828025018235/semr-20250417.htm
- Adobe "to acquire" (19 Nov 2025): https://news.adobe.com/news/downloads/pdfs/2025/11/adobe-to-acquire-semrush.pdf
- Adobe "completes" (28 Apr 2026): https://news.adobe.com/news/2026/04/adobe-completes-semrush-acquisition

### Pages that returned 404 or redirected on 4 Oct 2026
| URL | Result |
|---|---|
| https://www.semrush.com/company/stats-and-facts/ | 404 |
| https://www.semrush.com/company/about-us/ | 404 |
| https://investors.semrush.com/ | 301 → http://www.semrush.com/ |
| https://www.semrush.com/kb/998-subscription-limits | 404 |
| https://www.semrush.com/kb/998-what-is-included-in-my-subscription | 404 |
| https://www.semrush.com/kb/538-position-tracking-limits | 404 |
| https://www.semrush.com/kb/1042-api-units | 404 |
| https://www.semrush.com/company/legal/cancellation-policy/ | 404 |
| https://www.semrush.com/api-analytics/ | 301 → developer.semrush.com |
| https://www.semrush.com/our-data/ | 404 — live equivalent is /kb/997-semrush-data |
| https://www.semrush.com/semrush-one/ | 404 — live equivalent is /kb/1608-semrush-one |
| https://www.semrush.com/kb/1624-semrush-one-vs-seo-toolkit | 200 but **redirects to the generic pricing page**; no crosswalk table |
| https://www.semrush.com/kb/856-subscription-plans-comparison | 200 but serves the same page as /kb/1011-subscriptions |
| https://www.semrush.com/kb/411-site-audit-limits | 404 — use /kb/31-site-audit |
| https://www.semrush.com/kb/219-position-tracking-overview | 404 — use /kb/32-position-tracking |
| https://www.semrush.com/kb/1004-ai-visibility-toolkit | 404 — use /kb/1608-semrush-one |
| https://www.semrush.com/kb/semrush-reports-tools/projects/log-file-analyzer/ | 404; no KB article found for the tool at all |
| https://www.semrush.com/kb/semrush-reports-tools/projects/link-building-tool/ | 404; /kb/827, /kb/731, /kb/737 all misroute to a generic landing page |
| https://www.semrush.com/kb/1042-api-units | 404 |
| https://www.semrush.com/lp/affiliate-program/ | returned empty content; use /lp/affiliate-program/en/ |
| https://www.semrush.com/company/affiliate-program/ | 404 |
| https://www.berush.com/en/terms | 301 → /lp/affiliate-program/en/; legacy BeRush terms gone |
| app.impact.com/campaign-campaign-info-v2/Semrush.brand | redirect loop (>10); login-gated — the authoritative affiliate T&Cs live here |
| youtube.com/watch pages and youtube.com/@semrush/videos | return footer markup only; hence no publish dates or durations in §9 |
