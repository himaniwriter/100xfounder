# Batch aa progress (part-aa, 56 PH URLs)

Started 2026-10-14. Nothing is uploaded; a routine publishes ~10/day.

Method: a scripted dossier per URL (PH page Apollo data + official site pages + published emails + 100xfounder search),
saved in the session scratchpad, then profiles written by hand from it.
Output: profiles/{slug}.json, contacts-aa.csv.

Split: lines 1-19 helper A, lines 20-38 helper B, lines 39-56 coordinator.

## Status: COMPLETE (2026-10-14)

All 56 URLs in part-aa are handled: 52 profiles written to profiles/, 4 launches skipped as duplicates (covered inside another profile).
Nothing uploaded or published. No profile carries "ph_data_missing" (every PH fetch eventually succeeded).

- Existing 100xfounder listings (profile slug = listing slug): d-id, rippling, clickup. Their live pages had no researched profile, so profiles were written about the launched feature.
- New listings: 49.
- Skipped (same company/domain): articos-mcp -> articos; browseract-cloud -> browseract; databox-mcp-3 -> artifacts-by-databox; crustimate -> crustrecruiter (listed under "also_covers").
- contacts-aa.csv: 43 business emails (no header, same format as contacts-ac.csv), deduped against outreach-campaign*.csv, outreach-review.csv and other contacts-*.csv. privacy@anomalo.com left out (privacy-only address).
- No email published by the company: 1752vc, agent-arena, openobserve, akta-pro, eclatira, checksum-ai, claude-code-artifacts, cue-by-manus.

## Check before publishing
- Prices read from site JavaScript or animated counters: 1752vc, asmi-ai-3, assembly-studio ($29/$99/$499). D-ID plans empty.
- Site contradictions noted in the profile: agentx ($199 vs $249), bluerails (launch "free" vs EUR 199 then 49/month), betterclaw (100 vs 500 credits), clickup ($9 vs $7/$10), dailyhelm (monthly sale price lower than annual).
- eclatira: site blocked automated access; profile is from Product Hunt only, no pricing.
- big-mike: US sports-betting picks service (21+ note included) — check against site policy.
- co-invest: trading product; profile carries a not-investment-advice note.
- Temporary offers: ElevenLabs $1/$11 first month, ConnectMachine limited-offer prices.
- help@bigmike.ai is on a different domain from bigmike.app (it is the address in Big Mike LLC's privacy policy).
- X was not checked for any product; no founder photos were added (none found on allowed sources).

## Per-product log
1752vc-pitch-deck-analyzer | written | none | none
acme-bot | written | none | human@acme.bot
adant-ai | written | none | contact@anyloop.ai
adomate | written | none | hello@adomate.com
agent-arena | written | none | none
agent-builder-by-airtop | written | none | help@airtop.ai
d-id | written (launch agentic-videos-by-d-id; existing listing thin) | d-id | support@d-id.com
agentx-ai-agent-evaluation-framework | written | none | contact@agentx.so
ai-observability-by-openobserve | written | none | none
rippling | written (launch ai-spend-console-by-rippling; existing listing thin) | rippling | press@rippling.com
akta-pro | written | none | none
anomalo | written | none | privacy@anomalo.com
articos | written (covers articos + articos-mcp launches) | none | team@articos.com
articos-mcp | skipped (same domain articos.com; merged into articos) | none | -
artifacts-by-databox | written (databox-mcp-3 dossier had no post data; MCP server mentioned from site only) | none | hello@databox.com
ask-ad-manager-by-google-ads | written | none | press@google.com
asmi-ai-3 | written | none | support@asmiai.com
assembly-studio | written | none | support@assembly.com
auriko-2 | written | none | support@auriko.ai
ava-2-0 | written | none | hello@artisan.co
drizz-2 | written | none | gtm@drizz.dev
dupely | written | none | support@dupely.com
eclatira | written (site 403; PH data only) | none | none
eleven-v4-and-eleven-v4-turbo | written (no existing elevenlabs listing: /startup/elevenlabs/ returns 404) | none | team@elevenlabs.io
badge-3 | written | none | mail@getbadge.app
betterclaw | written | none | hello@betterclaw.io
big-mike | written | none | help@bigmike.ai
bluerails-discovery-3 | written | none | support@bluerails.com
clickup | written (launch brain-by-clickup; existing listing had no researched profile) | clickup | support@clickup.com
brandjet | written | none | hello@brandjet.ai
brew-4 | written (dossier.existing atomo-molecular-coffee is not a match) | none | founders@brew.new
browseract | written (covers both launches) | none | support@browseract.com
browseract-cloud | skipped (same domain browseract.com as browseract; covered in that profile) | none | none
browzer-2 | written | none | contact@trybrowzer.com
caddi-3 | written | none | contact@trycaddi.com
cartai | written | none | info@cartai.ai
chatcut-2 | written | none | team@chatcut.io
checksum-ai | written | none | none
claude-code-artifacts | written | none | none
claude-code-usage-tracking-by-langwatch | written | none | contact@langwatch.ai
clawsecure-2 | written | none | contact@clawsecure.ai
cleanlist-ai-3 | written | none | support@cleanlist.ai
clears | written | null | hello@clears.ai
co-invest | written | null | customer-support@liquid.trade
connectmachine-2-0 | written | null | hi@connectmachine.ai
cotypist-2 | written | null | imprint@cotypist.app
craftbot-with-living-ui | written | null | support@craftos.net
crustrecruiter | written (also covers crustimate) | null | info@crustdata.com
crustimate | skipped: same company/domain as crustrecruiter (crustdata.com), merged into crustrecruiter.json | null | -
ctruh-studio-2 | written | null | hello@ctruh.com
cue-by-manus | written | null | none
cura-4 | written | null | hello@joincura.club
dailyhelm-2 | written | null | support@dailyhelm.com
databox-mcp-3 | skipped: same domain (databox.com) as artifacts-by-databox, covered there | - | -
denovo-2 | written | null | hello@denovo.dev
dograh-3 | written | null | founders@dograh.com

## Held by lead (2026-10-14)
big-mike (sports-betting picks) and co-invest (trading) moved to profiles/_held/ with their contacts in profiles/_held/contacts-held.csv: gambling/financial content needs the owner OK before publishing (AdSense restricted categories).
