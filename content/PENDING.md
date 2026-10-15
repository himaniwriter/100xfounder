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

## C. Added 2026-10-15 (owner: 500+ words and 2+ images on everything published)

- Live articles/guides with 0 images (all have 500+ words). Add 2+ openly licensed images each, per content/BRIEF.md:
  - https://100xfounder.com/best-education-marketing-agency-india/ (2212 words)
  - https://100xfounder.com/notice-period-buyout-india/ (1454 words)
  - https://100xfounder.com/new-vs-old-tax-regime/ (1992 words)
  - https://100xfounder.com/upcoming-indian-startup-ipos/ (1087 words)
  - https://100xfounder.com/indian-startup-funding-q3-deal-count-falls/ (817 words)
  - https://100xfounder.com/apple-pay-india-launch/ (736 words)
  - https://100xfounder.com/in-hand-salary-from-ctc/ (1532 words)
  - https://100xfounder.com/how-to-apply/how-to-get-a-job-at-paytm/ (1343 words)
  - https://100xfounder.com/how-to-apply/how-to-get-a-job-at-meesho/ (1473 words)
  - https://100xfounder.com/how-to-apply/how-to-get-a-job-at-databricks/ (1345 words)
- Profiles held by the rule (fewer than 2 images): openai-agents-api, thumbmagic-5, kane-cli. Add credited gallery images or leave unpublished.
- Deploy the gate (includes/sources.php) and the Sources dropdown (sources.php, single-xf_startup.php, theme.css, XFT_VERSION 2.5.1): needs a fresh Hostinger API token from the owner.

## Status 2026-10-15 00:00–01:30 (done in chat)

- [x] A1 Flagged profiles fact-checked against official sites (31 profiles; changes logged under "Fact-check 2026-10-15" in each _PROGRESS file). Rindler moved to profiles/_held/ (home page now promotes Maxxwell; confirm it's still sold).
- [x] A2 14 Oct 13:00 publish run stopped early and published nothing; next run 15 Oct 13:00.
- [ ] A3 Foley: suppression comes only from a bounce or an unsubscribe (unsubscribe needs a POST, so link scanners can't trigger it). The reason is in the xf_suppressions table; reading it needs Hostinger re-auth (/mcp).
- [x] A4 Not applicable: the site has no xf_round posts yet (the tracker is empty). Owner option: seed rounds from sourced articles as Pending.
- [x] A5 Shark Tank research: 0 brand files (the 14 Oct run was stopped by the owner); daily run from 15 Oct 12:30.
- [x] 500-word / 2-image gate and the Sources dropdown deployed and tested live (test post 3566 trashed). All 37 scheduled posts pass.

## Status 2026-10-15 13:30

- [x] Foley (A3): real bounce. The campaign log shows it was emailed, and the new guarded /xf/v1/unsuppress refused to lift it. It stays suppressed.
- [x] 10 PH-group profiles published today (see ph-group/_PUBLISHED.md). A second, overlapping 13:00 run was stopped before it published anything (pace stays 10/day). Website, PH link and tagline meta are now REST-registered and set for all 10, so Visit buttons work.
- [x] wp-cron: the old 5-minute server job pointed to a missing path and never ran; replaced with /home/u840917216/domains/100xfounder.com/public_html/wp-cron.php.
- [x] Outreach inbox sync works (scanned 7 messages, 0 from outreach addresses so far).
- [x] Backups before every deploy (server + local), working.
- [ ] Section C images: the 12:15 task is still running.
- [ ] Owner: Research & refresh, test 2–3 listings before queueing all 441 (WP admin → AI content → Research & refresh).
- [ ] Owner: Instagram — accept the tester invite, Add account, Generate token, paste it in Settings → Instagram (auto-post), Test connection.
