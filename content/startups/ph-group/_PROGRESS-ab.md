# part-ab startup profiles: progress (14 Oct 2026, COMPLETE)

Input: `part-ab` (56 PH launch URLs). Output: `profiles/<slug>.json` (with top-level `existing_listing_slug` and `ph_url`), contacts in `contacts-ab.csv` (email,first_name,startup,listing_url; no header, same as aa/ac).
Nothing was uploaded or published. A routine publishes ~10/day.

## Done: 49 profiles
enter-pro, fastrouter-ai, fluree, frontdesk-ai, fuser, fuzzy-ai, fypro, gauth, genpage, goose-ads-remixer, haqq, harden, hey-noah, honen, humalike (covers 3 launches: humalike, humalike-x-gta-rp, humalike-x-hermes), hyrax-ai,
inferock-bench, investorfinder, agent-jesse, kane-cli, kastra, kelviq, kilo-code, kodlo, lispr, lobehub, loomal, macaly, makersclaw, mantle-chat, meridian-work-journal, mesa, mina-meeting-assistant,
mindcase, minimi, mintlify-workflows, naise-ai, naptick, nautis, navigara, ngrok-ai-gateway, nudgeforme, oasis, ogment, olostep, onepin, openai-agents-api, openbot, parasocial.

Existing listings: **kodlo** (existing_listing_slug "kodlo", no profile yet). openai-agents-api has `related_listing_slug: "openai"` (the OpenAI company listing; do NOT overwrite it with this feature profile). All others are new listings.
No profile carries `ph_data_missing` (kilo-code was enriched from /products/kilocode/launches).

## Skipped (6 launches)
- ngram: already profiled (content/startups/ngram-2-0.json, live listing has a profile).
- expert-chase-for-ios-android: PH product deleted (slug expert-chase-deleted-…).
- loqua-2: PH product deleted (redirects to loqua-deleted-…).
- mcp-connectors-by-databox: Databox is already covered by part-aa/part-ac (artifacts-by-databox.json). Draft kept only in the session scratchpad.
- mission-for-claude-code (Medley/Spine): the product's own site says "Medley is no longer maintained".
- humalike-x-gta-rp, humalike-x-hermes: merged into humalike.json (same PH product).

## Contacts (39 rows in contacts-ab.csv)
Only emails the company publishes itself (site, contact/support/press/imprint/legal pages, official GitHub org). Skipped as duplicates of earlier lists: info@crustdata.com, info@kodlo.ai.
Not added: privacy-only addresses (privacy@humalike.ai, privacy@joinoasis.com), security@harden.run; no email found for Fuzzy AI, Meridian, Mina, OpenAI, OpenBot.
Source page per email:
- support@converge.ai,Enter Pro,https://converge.ai/
- contact@fastrouter.ai,FastRouter.ai,https://docs.fastrouter.ai/
- sales@flur.ee,Fluree,https://flur.ee/contact
- support@myaifrontdesk.com,Frontdesk AI,https://www.myaifrontdesk.com/pricing
- sales@fuser.studio,Fuser,https://fuser.studio/pricing
- support@fypro.ai,Fypro,https://www.fypro.ai/
- contact@gauthmath.com,Gauth,https://www.gauth.com/
- team@genpage.ai,GenPage,https://www.genpage.ai/contact
- help@gooseworks.ai,Goose Ads Remixer,https://gooseworks.ai/pricing
- info@haqq.ai,HAQQ,https://www.haqq.ai/contact
- hello@heynoah.io,Hey Noah,https://www.heynoah.io/privacy
- support@honen.com,Honen,https://honen.com/support
- support@hyrax.dev,Hyrax AI,https://github.com/hyrax-ai
- business@floworks.ai,Agent Jesse,https://agentjesse.ai/about
- contact@inferock.ai,Inferock Bench,https://inferock.ai/privacy
- info@crustdata.com,InvestorFinder,https://crustdata.com/about
- hi@kilocode.ai,Kilo Code,https://kilo.ai/support
- press@lispr.ai,Lispr,https://lispr.ai/press/
- hi@macaly.com,Macaly,https://www.macaly.com/cloud
- info@kodlo.ai,kōdlo,https://kodlo.ai/
- hi@kelviq.com,Kelviq,https://www.kelviq.com/contact-us/
- hello@lobehub.com,LobeHub,https://lobehub.com/contact
- sales@loomal.ai,Loomal,https://loomal.ai/pricing
- hello@makersclaw.com,MakersClaw,https://makersclaw.com/legal/imprint
- team@mantle.chat,Mantle Chat,https://mantle.chat/contact
- contact@getmesa.com,MESA,https://www.getmesa.com/privacy
- press@testmuai.com,Kane CLI,https://www.testmuai.com/press/
- hello@kastra.ai,Kastra,https://kastra.ai/contact
- support@mindcase.co,Mindcase,https://www.mindcase.co/support
- oz@projectminimi.com,minimi,https://www.projectminimi.com/contact-us
- hi@mintlify.com,Mintlify Workflows,https://www.mintlify.com/legal/terms
- hello@naise.ai,Naise AI,https://naise.ai/contact
- support@naptick.com,Naptick,https://www.naptick.com/support.html
- hello@getnautis.com,Nautis,https://getnautis.com/contact
- info@navigara.com,Navigara,https://navigara.com/contact
- support@ngrok.com,ngrok AI Gateway,https://ngrok.com/support
- hello@nudgeforme.com,NudgeForMe,https://nudgeforme.com/
- hello@ogment.ai,Ogment,https://ogment.ai/
- info@olostep.com,Olostep,https://www.olostep.com/about
- support@onepin.ai,Onepin,https://onepin.ai/faq
- support@parasocial.fm,Parasocial,https://parasocial.fm/support

## Things for the owner / publishing routine
- Pages with weak sourcing: hyrax-ai (site 403; PH + GitHub only), enter-pro and mina (pricing not published), gauth (facts from a press release), ogment (the company has repositioned @O for Swiss fiduciaries since its launch), openbot (marketed "open source" but licence is PolyForm Noncommercial; the page says so).
- Older launches had no PH comments in the server-rendered page, so some profiles have no quotes (fluree, gauth, humalike, hyrax-ai, macaly, lobehub, loomal, makersclaw, kane-cli, mintlify-workflows, minimi).
- Alternatives mostly say "See its pricing page" (competitor pricing not fetched).
- Gallery images showing real people's photos or album/podcast art were left out.

## Fact-check 2026-10-15
Checked against each product's own site. Product Hunt was not fetched. Nothing uploaded or published. All edited files pass `python3 -m json.tool`. No rating was added to any schema field.
- hyrax-ai: hyrax.dev still returns 403, but the public docs are reachable. Added pricing: Free ($30 one-time credit, then $10/month, no card) and Paid $30 per seat/month, returned as monthly credit, with on-demand spend off by default and capped at $500. Also added: hosted only, and built by Iru under Iru's SOC 2 Type II programme (observation window 2026-06-22 to 2027-06-22, so no report yet). Content, starts_at, FAQ, cons and not_fit updated. Docs added as sources. https://docs.hyrax.dev/pricing , https://docs.hyrax.dev/ , https://docs.hyrax.dev/compliance/
- gauth: still no pricing page (/pricing returns 404, the course catalogue shows no prices, and the terms page renders empty). Kept "Pricing not published", re-dated it, and added the course catalogue as a source. https://www.gauth.com/ , https://www.gauth.com/course
- enter-pro: Converge AI's pricing page now renders. Free (one-time credits valid 7 days); Basic $20/mo ($17 yearly); Pro $40 ($34); Ultimate $190 ($152); Enterprise custom. Self-contradiction kept: the Ultimate card shows 20% off the first month, but the FAQ says Ultimate has no first-month discount. The maker's "Pro supports up to 20 members" (PH) differs from the pricing page's "up to 2"; both are stated. Content, starts_at, FAQ, cons and not_fit updated. https://converge.ai/pricing
- mina-meeting-assistant: still no prices (/pricing returns 404, the terms list none, and /get-started is a demo form). Re-dated, and added the terms and privacy pages as sources. https://getmina.ai/ , https://getmina.ai/terms-of-service
- ogment: the profile states the repositioning accurately; the site is still "AI Agents for Swiss Fiduciaries" with a free 30-min AI audit and no prices. Added the security and AI-audit pages as sources. https://ogment.ai/
- openbot: added the licence history. The repo was published under Apache 2.0 on 12 Aug 2026, then switched to PolyForm Noncommercial 1.0.0 on 20 Aug 2026, before the launch. OpenBot's own FAQ now says it is not OSI open source. Removed the "marketed as open source" con, which we can no longer show from the official site, and rewrote the FAQ. https://github.com/nightly-labs/openbot/commits/main/LICENSE , https://openbot.run/
- meridian-work-journal: the relicence from MIT to PolyForm Strict 1.0.0 is dated 6 Oct 2026. The README says personal and noncommercial use only, no modification or redistribution, and commercial use (including inside a company) needs a licence from Meridiona; versions released before the change stay MIT. "Free for individual developers" became "free for personal, noncommercial use" in the excerpt, starts_at, pricing, pros, cons, not_fit and FAQ. The site footer still links "Open source", which is noted. https://github.com/Meridiona/meridian (README, LICENSE history)
