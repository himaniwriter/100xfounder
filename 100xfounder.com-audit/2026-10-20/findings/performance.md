# Performance audit, 100xfounder.com, 2026-10-20

Score: 78/100 (ESTIMATED from static analysis; no Lighthouse or CrUX run was possible, see Limits).

## Limits (read first)
- PSI API: HTTP 429, daily quota exhausted for the keyless project. No API key set (GOOGLE_API_KEY), so crux_history.py also failed. No CrUX field data.
- Local Lighthouse 13.5.0 (mobile and desktop, all 6 pages): every run failed with status 403. Headless Chrome is served a Hostinger "Checking your browser... Just a moment" interstitial (meta noindex,nofollow, refresh 30s). curl works with any UA.
- So LCP, TBT/INP and CLS are NOT measured. Below: TTFB and transfer sizes measured with curl (3 runs each, from this machine); everything else read from the delivered HTML/CSS/JS.

## Measured (curl, mobile UA, brotli)
| Page | HTML (br / raw) | TTFB (3 runs) | DOM tags |
|---|---|---|---|
| / | 21.6 KB / 151 KB | 0.22-0.29 s | 1303 |
| /apple-pay-india-launch/ | 17.3 KB / 79.8 KB | 0.23-0.27 s | 470 |
| /startup/swiggy/ | 19.3 KB / 94.2 KB | 0.22-0.34 s | 751 |
| /job/agoda-...-93c025/ | 15.5 KB / 67.7 KB | 0.23-0.38 s | 377 |
| /tools/ | 11.7 KB / 48.4 KB | 0.23-1.29 s (one spike) | 258 |
| /leaderboard/ | 15.5 KB / 68.7 KB | 0.23-0.95 s (one spike) | 441 |
All 200, brotli, x-hcdn-cache-status DYNAMIC (not a CDN HIT; the static files are served by the origin through hcdn). One earlier request to / took 1.3 s TTFB. Typical TTFB is about 0.25 s, with occasional 1 s spikes: borderline for the 200 ms guideline.

Shared critical assets (brotli, all cache-control max-age=604800 = 7 days):
plugin style.css 2.4 KB, theme.css 16.3 KB, lenis.min.js 4.4 KB, theme.js 8.5 KB, inter-400.woff2 23.7 KB, inter-600.woff2 24.5 KB, logo.webp 9.2 KB. Plus about 16 KB inline CSS and 10-21 KB inline JS per page.
Critical-path weight before images: roughly 21 + 19 + 9 + 48 + 9 = about 105 KB. Very light.
Request count (estimate, above the fold, before images): HTML + 2 CSS + 2 JS + 2 fonts + logo = 8, then 1 more per image. After idle/interaction: AdSense loader (+ its own chain of 10-30 requests), GA4 gtag.js. Home pulls 100 <img>, 98 lazy.

## Findings

### F1 (Medium) Cannot be lab-tested: bot challenge blocks headless Chrome
Evidence: Lighthouse 403 on all 12 runs; dump-dom shows the "Just a moment" page. Real PSI may be blocked too, which would show up as errors in Search Console and PSI.
Fix: allow Lighthouse/PSI (Chrome-Lighthouse UA, Google IP ranges) in the Hostinger hCDN / WAF bot protection, or add a header-based bypass for the audit machine. Confirm Googlebot is never challenged (test with Search Console URL Inspection).

### F2 (Medium) Logo carries fetchpriority="high" instead of the LCP image
Evidence: every page has `<img src=logo.webp width=161 height=24 fetchpriority="high">`. On the article the hero is `loading="eager"` with no fetchpriority; on / the lead image (1280x800 DailyObjects) is not lazy but has no fetchpriority.
Fix: drop fetchpriority from the logo (it is a 9 KB, in-viewport image anyway), add fetchpriority="high" to the first hero/lead image only. Likely 100-300 ms LCP on mobile.

### F3 (Medium) Article hero served as a 1360 px JPEG, 199 KB
Evidence: /apple-pay-india-launch/ hero is class size-full, width=1360, src = the full file (199,320 B); srcset has 300/768/1024/1360w.
Fix: set a correct `sizes`, serve 1024w or less on mobile, and generate WebP/AVIF at upload (WP can do it: image_editor_output_format). Target under 80 KB.

### F4 (Medium) Hot-linked Wikimedia images on /startup/swiggy/, up to 1.67 MB
Evidence: lazy imgs from upload.wikimedia.org: Swiggy_delivery_partner.jpg 370 KB, SUN_Mobility_Swiggy_Bike.png 1,667,591 B (1280x875 PNG). Swiggy_logo.png (4 KB) is loading="eager". Extra origin, no cache control of ours, referrerpolicy=no-referrer.
Fix: sideload to the media library, resize to display width (about 800 px), convert to WebP; keep attribution text. Applies to all startup profiles using commons images.

### F5 (Low-Medium) Hot-linked third-party thumbnails on home and /leaderboard/
Evidence: home images come from images.lumacdn.com (Luma serves format=auto at 520x272, good), secure.meetupstatic.com, indiagdc.com, echai.ventures; leaderboard uses ph-files.imgix.net. Each is a new connection (DNS+TLS) with no preconnect, but lazy so off the critical path. Also a gravatar request on the article.
Fix: mirror and resize event/logo images locally at import; add width/height everywhere (home: 56 of 100 imgs have both width and height, so up to 44 can shift layout; article 12/12 ok; swiggy 9/10).

### F6 (Low) Home page DOM 1303 tags, 151 KB raw HTML
Under the 1,500 guideline, but 100 images and many cards. Fix: cut below-the-fold card count or use content-visibility:auto on lower sections. Helps INP and style/layout cost.

### F7 (Low) Render-blocking resources: two stylesheets
Evidence: `<link rel=stylesheet>` for plugin style.css (2.4 KB) and theme.css (16.3 KB) in head, plus about 16 KB inline CSS. Scripts are all `defer` (lenis, theme.js) or injected later; none block. Fonts preloaded with crossorigin (good), font-display:swap on 6 @font-face, self-hosted (no Google Fonts request on these pages).
Fix: optional: inline plugin style.css into the existing inline block (saves one request). Not urgent: total CSS about 19 KB br.

### F8 (Low) Fonts: two preloaded Inter weights, 48 KB, plus 4 more @font-face (Geist Mono etc.) unpreloaded
Fix: confirm all preloaded files are used above the fold (unused preloads waste bandwidth); add size-adjust fallback metrics to limit swap CLS.

### F9 (Info, good) Third-party scripts are well deferred
- AdSense: injected on window load + requestIdleCallback (timeout 2 s) or first scroll/pointerdown/keydown/touchstart. Not in the critical path; Lighthouse will usually not see it at all, because Lighthouse does not interact (fires on idle after load, so it WILL appear in TBT window if within the trace; about 2 s after load). Real-user cost: AdSense script is the largest main-thread and network cost on the site (typically 100-300 KB and 10-30 requests once ads render). Ensure ad slots have reserved min-height to avoid CLS (not verifiable here).
- GA4: gtag.js loaded on first interaction or 4 s after load. Fine. Consent Mode default is inline (700 B).
- Lenis 1.3.4: 4.4 KB br, deferred, 1 request. Cost is small; the risk is smooth-scroll JS driving scroll via rAF on low-end phones (INP/scroll jank). Fix if a trace shows long tasks: disable Lenis on touch devices and for prefers-reduced-motion (the site already stops animations under reduced motion).
- No iframes on any of the six pages.

### F10 (Low) TTFB spikes and no CDN HIT on HTML
Evidence: x-hcdn-cache-status DYNAMIC on all pages; spikes of 0.95-1.3 s on /tools/, /leaderboard/ and /. The Astro pages are static files, so this looks like cold LiteSpeed/hcdn or the .htaccess rewrite check.
Fix: enable hCDN full-page caching for static HTML (cache-control public, s-maxage) so HTML returns HIT; add Cache-Control with stale-while-revalidate on HTML; keep static assets max-age 7d (could be 1 year with versioned ?ver=).

## Core Web Vitals status
Not measurable (no CrUX key, no lab run). Expected from the code: LCP likely good on a fast connection (small CSS, deferred JS, br HTML) but at risk on the article (199 KB hero JPEG) and Swiggy (hot-linked heavy images); TBT likely low (about 25 KB total first-party JS); CLS risk comes from image dimensions on home and AdSense slots.

## Next steps to get real numbers
1. Add a PSI/CrUX API key (GOOGLE_API_KEY) and rerun pagespeed_check.py and crux_history.py.
2. Whitelist Lighthouse in the Hostinger bot challenge, then run mobile and desktop on all 6 URLs.
