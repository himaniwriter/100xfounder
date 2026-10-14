# Performance findings, 100xfounder.com (2026-10-14)

## Measurement status: NO lab/field numbers obtained
- PSI API v5 (keyless), mobile + desktop, all 6 URLs: HTTP 429 "Queries per day" quota exhausted on the shared keyless project (retried after 20s and via claude-seo pagespeed_check.py: same). A PSI API key is needed.
- Local Lighthouse (headless Chrome): page load failed with HTTP 403 (the edge, server: hcdn, appears to block headless/Lighthouse browsers). So no LCP/INP/TBT/CLS/score values. CrUX field data: not retrievable (no key); availability unknown, likely none or origin-only for a site this new.
- Below: measured server/transfer facts (curl) plus static code review. Treat as hypotheses until PSI is rerun with a key (PSI key, or run in browser at pagespeed.web.dev).

## Measured (curl, gzip, from this machine)
| URL | TTFB | HTML gz | HTML raw |
|---|---|---|---|
| / | 0.32s | 24 KB | 147 KB (~1,200 elements) |
| /best-ai-for-coding/ | 0.23s | 26 KB | 100 KB |
| /jobs/ | 1.24s first hit, then 0.34-0.36s | 18 KB | 94 KB |
| /startup/launchreel/ | 0.24s | 20 KB | 74 KB |
| /events/ | 0.26s | 25 KB | 156 KB |
| /best-education-marketing-agency-india/ | 0.22s | 22 KB | 84 KB |
All are x-hcdn-cache-status: DYNAMIC (HTML is not edge-cached; PHP renders each request, upstream ~0.18-0.2s). Static assets: cache-control max-age 604800 (7 days).

Render path is already lean: 2 CSS files (plugin style.css 2.6 KB, theme.css 12.7 KB, both blocking), 2 deferred JS (lenis.min.js 4.6 KB, theme.js 3.5 KB), Inter 400/600 preloaded, font-display:swap on all faces. 16 KB inline CSS in head. Likely lab scores good on CSS/JS; the risks are third parties, images and TTFB.

## Top opportunities (all pages share 1 and 2)
1. AdSense + GA4 third-party JS: `adsbygoogle.js` and `googletagmanager.com/gtag/js?id=G-H34BZPDZJ1` loaded in head on every page (async). Main source of TBT/INP and LCP-adjacent bandwidth. File: /Users/lovishmadaan/100xfounderoct/wordpress/100xfounder/includes/adsense.php (wp_head at line 32; slot markup line 54). Fix: load AdSense after first interaction/idle or on scroll for below-fold slots, skip on thin pages, delay gtag until idle.
2. Ad slot CLS: `.xf-ad{min-height:120px}` (theme.css line 251) but `data-ad-format="auto"` + `data-full-width-responsive` ads commonly render 250-300px+ and push content down. Fix: raise min-height to the real rendered size per slot (e.g. 280px) in /Users/lovishmadaan/100xfounderoct/wordpress/100xfounder-theme/assets/css/theme.css, and avoid placing slots above the fold.
3. HTML not cached at the edge (DYNAMIC; /jobs/ cold hit 1.24s TTFB). Fix: enable Hostinger LiteSpeed/page cache or send Cache-Control for anonymous visitors; check heavy queries in /Users/lovishmadaan/100xfounderoct/wordpress/100xfounder/includes/jobs.php and the theme template page-jobs.php (wrap in transient).

## Per page
- / (home): no hero image; LCP is likely text/H1 (fine if fonts preload holds). Events block lazy-loads remote images from third-party hosts (event-social CDN, devfest.gdgchennai.in/banner/main.webp, secure.meetupstatic.com 600_536421360.jpeg) without width/height on two of them (gdgchennai, meetupstatic) = CLS risk and uncontrolled sizes. Largest HTML (147 KB raw, ~1,200 elements): trim cards/inline JSON-LD. Files: front-page.php, parts/feed-page.php; logo.png 44 KB (assets/logo.png) is above the fold on every page, convert to WebP/SVG and give it fetchpriority/size. 
- /best-ai-for-coding/: first image has fetchpriority=high (good, likely LCP). Four content `<img>` lack width/height (screenshot-of-the-visual-studio-code-editor...-1024x580.png, close-up-of-green-command-line-text..., long-aisle-of-white-server-racks..., a-developer-in-a-grey-hat...-1024x707.jpg) = CLS; a PNG screenshot should be WebP/AVIF. Fix at the post content/upload step (content/upload.py) so width/height are emitted, or in single-post.php.
- /jobs/: cold TTFB 1.24s; 22 `<img>`, only 12 unique (company logos repeated: okta-company-logo.png full size, repeated per row; tekion/stripe/sigmoid are 150x150). Use the sized -150x150 variant for okta (and cache logos), dedupe. Files: page-jobs.php, plugin includes/jobs.php.
- /startup/launchreel/: first screenshot `<img>` (images.ctfassets-style `?auto=format&fit=max&w=1400`, remote third-party) is eager and the likely LCP, loaded from another origin without preconnect; one `<img>` has no width. Add `<link rel=preconnect>` or self-host/resize, fetchpriority=high and width/height. File: single-xf_startup.php in the theme (and plugin includes/startup-profile.php). Also 3 JSON-LD blocks.
- /events/: 156 KB HTML, many remote event images (images served by Luma `event-social`, gdgchennai, meetupstatic; PNG format) with no control over size. Fix: cache/resize event images locally at import (plugin includes/events.php), set width/height on all, WebP. Files: page-events.php, single-xf_event.php.
- /best-education-marketing-agency-india/: lightest page (84 KB raw); all images have width/height and lazy. Verify first image is not lazy if above fold (first listed content image is lazy; if it is the LCP, remove loading=lazy and add fetchpriority=high). File: single-post.php.

## INP / TBT outlook (static)
theme.js is 3.5 KB; lenis smooth scroll (lenis.min.js, theme.js line ~206) adds a rAF loop on desktop mouse/trackpad only (phones skipped; reduced motion skipped). Low INP risk from first-party code; main thread contention will come from AdSense/GA. Consider dropping Lenis if desktop INP shows up poor.

## Next step
Rerun with a PSI API key (or open PSI in a browser) and CrUX API key to get real LCP/INP/CLS/score; confirm whether the 403 for Lighthouse is a hcdn bot rule (whitelist Lighthouse UA in hPanel if so).
