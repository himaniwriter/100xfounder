# Startup profiles: progress (updated 14 Oct 2026)

Procedure: `.claude/skills/write-startup-profile/SKILL.md`. Finished examples: `content/startups/launchreel.json` (first pilot) and any of the 28 files below (deeper format, see "Profile shape" below).

## Done (live, checked 14 Oct 2026: HTTP 200, profile stored, no aggregateRating in the page)
Backups of each listing's previous content and profile: `content/backups/startup-<slug>-2026-10-14.json`.

- **launchreel**: pilot, 7 Oct.
- The 14 original listings (PH launch 4 Oct 2026): poddle, sellio, capybara-court, aperture, notchmate, smooth-recorder, flexchords, eat-train-feel, thinking-orbs, pass-designer, tinyfolder, qarunbook, blenny, pixel-soup.
- Newest listings (PH launches 11–12 Oct 2026): bearconnect-2-0, scrape-anything-by-context-dev, kudos-3-0, hexis-cloud, ancher-2-0, manifold-mcp, guilds-run, ngram-2-0, base-code, google-embeddinggemma-2, foley, ayven, mepersona, openscreen-2.

## To do next (newest first; 2026-10-11 and older launches)
ghost-core, automations-in-perplexity-computer, kodlo, hirekey, gboard-kurukuru-version, notchpit, agibot, farol, edgevolume, focuswrite, lune, maildun-for-mac, pixrater, agentdock, put·here (slug `put%c2%b7here`), microsoft-decision-1, ej, floorgen, the-computer-game, history-monk, kernelai, claude-dashboards-motion, gitglow, tapnoise, pocketwebtools-for-mac, request-eagle, openpilot, iwant, new-windows-search, rune, sorted, thravik, amazon-alexa-tablets, refs, brightbean-studio, gemini-agent-for-google-cloud, staffcoder, pine-computer, playground-by-google-labs, microsoft-surface-laptop-ultra, claude-for-google-workspace, strac-comply, semwright, judged-systems, clippo, aegis, sineframe-m3, opencharm, tide, chime, typeling, openseo-ai-visibility, reika, aura-by-neural, hark, mailwell, kitbar, lofi-desk-2-0, ownfeed, dailyhub, nano-banana-2-1, cekura-bench, rhem-labs, agentguard, basedash-mobile, studyquest, mistral-large-4, knuff-app, figma-agent, featherweight-dictation, sunsed, introducing-video-editor-in-manus-2-0, proofsource, vresk, chunk, customer-service-ai-for-etsy, scumble, review, appto, easycut, ruos, devally-ai-agent, iphone-use, plugins-radar, cosmic-ai-support-agent, kishi-notch, rill-browser, hyperframes-studio-desktop, crosswalk, jarq, lecta, floani, spira-maxima, marv, patchcord, pilot5-legal, reason, web-search-api, reviu, dots-ui, speechshield, the-sentient-world, xtracticle, reactive-resume-v6, netra, unscary-ai.

After those, the ~1,290 company listings dated 2024-01-01 (zylo, zoom, zapier…) are a different kind of page (established companies, no Product Hunt launch). Agree an approach with the owner before profiling them.

## Follow-ups for the owner
- **No logo** on aperture, capybara-court and pass-designer (lettered tile). `content/fetch-startup-logos.py` would fix it but uploads to the media library, so it was not run in this pass.
- **Prices that will move:** Pixel Soup still showed its $4.99 launch-week price (site says $9.99 after). Smooth Recorder's $19 early-access tier was "100 left" (then $69). TinyFolder's $21 is a launch price (was $32). Re-check these on the next pass.
- Sellio's founder quoted $45/month on Product Hunt; the pricing page has no $45 plan, so the page uses the pricing page.
- Manifold's founder said 500 free credits on PH; the site says 250 (page uses 250). qarunbook's free plan shrank from "2 apps, 5 people" to "1 app, just you" (page uses the pricing page).

## Profile shape (what each profile now has)
Owner's depth target (14 Oct, benchmark https://www.producthunt.com/products/foley): `gallery` (up to 8 PH gallery images, credited, alt text written after looking), `video_url` (official YouTube/Vimeo/Loom only; self-hosted MP4s go in `sources` instead), `launch_story` {paragraphs, attribution, url} = the maker's first PH comment in our words, `use_cases`, `audience`, `pricing`, `pros`/`cons`, `opinions` {themes {liked, asked, criticised}, quotes [{text ≤25 words, author, url = comment link}]}, `team` [{name, role, url}], `alternatives`, `faq` (answer what commenters actually asked), `community` (ph_url + X), `sources`. Shape documented at the top of `wordpress/100xfounder/includes/startup-profile.php`; the theme renders all of it.

## How-to notes (what worked this run)
- **PH data in the built-in browser** (`get_page_text` alone misses most of it). Use `/posts/<listing-slug>`: it redirects to the right launch (`/products/<p>?launch=<slug>`). Then JS: header text from "followers" to "Launch Team"; gallery ids from `img[alt$="gallery image"]`; scroll `#comments` into view and wait, then read elements with id `comment-<number>` (comment link = `https://www.producthunt.com/products/<p>?comment=<number>`). Skip comments PH labels "Likely AI".
- **Launch date, comments and upvotes**: fetch `/products/<p>/launches` and read the text after "Launched on" (e.g. "October 12th, 2026" followed by comment count then upvotes run together).
- **Alternatives** and **team**: navigate to `/products/<p>/alternatives` and `/products/<p>/makers` (client-rendered; fetch() returns an empty shell). Only use `ph_url` for alternatives you actually saw linked; don't guess PH slugs.
- **Screenshots**: open a PH image in a tab (`https://ph-files.imgix.net/<id>?w=10`), replace the document with a grid of `?w=500` thumbnails via JS and screenshot it, then write alt text. Skip images of real people's photos, album covers, and anything you can't see clearly.
- PH product-level ratings (e.g. Base44's 4.4/41) belong to the whole product; don't attach them to a feature launch (Base Code has no `reviews`). Apple's 4.9/69 is for Apple, not Pass Designer.
- Some PH launch pages redirect to `…-deleted-…` 404s (mepersona, openscreen-2); the plain `/products/<slug>` page still works.
- **Structured data**: every plan with a numeric `amount` becomes an Offer in the page's schema. Give `amount` only to plans you can buy today; leave it off sold-out, future, "coming soon" and per-credit top-up rows, and off any plan whose price isn't published.
- Official-site and competitor pricing was gathered by research subagents with WebFetch/curl into a scratch file per startup, then checked and written up by hand. Pages that render prices only in the browser (Bartender, DynamicLake, Chordify, Manychat, Todoist, NapoleonCat) are listed as "See its pricing page".

## Hard rules (also in CLAUDE.md)
Never publish a star rating without real reviews behind it (PH ratings are text only; schema ratings come only from our visitors). Look at every screenshot before describing it. Use the PH link on the listing page (names repeat on Product Hunt). Pricing only from the startup's own pages; "Pricing not published" when it isn't. Profiles upload base64-encoded because of Hostinger's firewall (the script does this). The request-indexing routine picks up new profile pages by itself.
