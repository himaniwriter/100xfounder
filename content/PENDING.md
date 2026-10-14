# Pending work (noted 2026-10-14, to do 2026-10-15 after 12:00 IST)

Scheduled task `pending-work-2026-10-15` works through this list. Tick items off here as they are done.

## A. Claude can do these

1. **Check the Product Hunt group profiles flagged by the batch agents** (`content/startups/ph-group/profiles/`, notes in `_PROGRESS-aa.md`, `_PROGRESS-ab.md`, `_PROGRESS-ac.md`). Fix each against the startup's own live page, and if a fact can't be confirmed, take it out rather than guess. Do this before the 13:00 routine publishes these profiles.
   - **Prices read from site code:** Assembly ($29/$99/$499 came from animated counters), 1752vc and Asmi. D-ID has no plans listed yet.
   - **Sites that contradict themselves:**
     - AgentX: $199 vs $249
     - Bluerails: "free" at launch vs €199 for the first month, then €49
     - BetterClaw: 100 vs 500 free credits
     - ClickUp: $9 vs $7/$10
     - DailyHelm: the monthly sale price is lower than the annual one
     - Semos: do credits renew?
     - Scholé: the free-plan limit
     - Unabyss: annual or monthly price
     - Velo: yearly prices
     - EdgeOne: an unlabelled Personal plan price
     - Thumbmagic: refund promise vs its terms
   - **Offers that expire:** ElevenLabs' $1 Starter offer ends 18 Oct (remove it after that date) and ConnectMachine's limited-offer prices.
   - **Weak sources:** Hyrax AI (Product Hunt and GitHub only), Gauth (a press release), Eclatira (no pricing).
   - **Products that changed after launch:** Ogment, OpenBot (licence doesn't allow commercial use), Meridian (licence changed), Zaro, Yansu, Rindler (home page now promotes Maxxwell). Confirm each page says so.
   - **13 profiles flagged `ph_data_partial`:** retry for Product Hunt comment quotes, slowly (about one request every 15 seconds, and a 3-minute wait after HTTP 429).
2. **Confirm the first run of `ph-group-publish-outreach-daily`:** 10 profiles live, founders added through `POST /xf/v1/campaign-recipients` (campaign 2), and none of the held contacts sent.
3. **Foley (hello@foleyapp.com):** find out why the outreach queue shows it as suppressed, and fix it if that's a bug.
4. **Live funding rounds:** fill Country, City and Other investors, from sources only.
5. **Shark Tank research:** confirm the daily routine is running and give the brand count, out of the 300 target.

## B. Needs the owner's decision (list these in the report and don't act on them)

- **Held profiles** (`ph-group/profiles/_held/` and `contacts-held.csv`): Big Mike (sports-betting picks), Co-Invest (trading) and Portfolio Lab (investing). Publish them or drop them?
- **357 older companies** held from outreach: send to them or not?
- **`content/startups/outreach-review.csv`:** review it.
- **Instagram:** set up the Meta developer app (reminder at 12:00), then build auto-posting.
- **Owner items still open:**
  - LinkedIn and X profile links
  - Paytm, Meesho and Databricks guide URLs
  - the Gurugram region field
  - AdSense consent message (skipped earlier)
  - WP admin login in Chrome expires
