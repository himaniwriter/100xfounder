# Tool page reference: feedough.com/ai-prompt-generator/ (studied 2026-10-20)

We copy the **structure and SEO strategy** of this page for our calculators at `/tools/{slug}/`. Never its content, wording or examples.

## Layout

1. **Site header**, then a **horizontal tool-switcher bar** of sibling tools directly under it (a full-width strip with arrow scroll on desktop): AI Prompt Generator (current, highlighted), ChatGPT Prompt Generator, Reasoning Prompt Generator, TOON, JSON, Image to Prompt, AI Prompt Optimizer, Prompt Checker, 15000+ ChatGPT Prompts, XML Prompt Generator.
2. **H1** ("The Free AI Prompt Generator"), centred, exact keyword.
3. **The tool in the first fold**: mode tabs (Text / Image / Video prompt), the input box, framework and model selects, a Generate button, and a right-hand card ("Improve Prompt") that refines the result. The user can solve the intent without scrolling.
4. **Below the fold, a two-column layout**: a **left sidebar** (about 315px) listing related tools **grouped by category** as a nested menu (group headings such as "AI Prompting Tools", "AI Ideation Tools", "AI Marketing and Sales Tools", "AI Branding Tools", … each with its tool links; about 190 links), and the long-form article on the right. The sidebar is not sticky.
5. Author box ("Hey, I'm …") at the end.

## Heading outline and section order

- H1: The Free AI Prompt Generator
- (tool UI: H3/H4 labels inside the widget)
- H2 What Is a Prompt in AI? (definition of the underlying concept)
- H2 What is an AI Prompt Generator? (what the tool is)
- H2 How Does Feedough's AI Prompt Generator Work? (H3: input → processing → output)
- H2 Benefits of Using … (7 H3 benefits)
- H2 How to Use … Effectively? (H3 per mode, H4 numbered steps: Step 1 … Step 4)
- H2 FAQ (5 questions)
- H2 author box

Order in short: concept → what the tool is → how it works → benefits/use cases → step-by-step usage → FAQ. About **3,300 words** below the tool. The exact phrase "ai prompt generator" appears 18 times (~1.6% of words by phrase length), "prompt generator" 26 times; variants ("prompt builder", "AI prompts", "text/image/video prompts") fill out the coverage.

## Internal linking

- The switcher bar links ~10 sibling tools; the grouped sidebar links every tool in the cluster plus other clusters; sibling tools are also linked from the mega-menu. Siblings such as ChatGPT Prompt Generator and Image to Prompt Generator are linked 3–4 times on the page (bar, sidebar, menu, body).
- Anchors are the exact sibling tool names (keyword-rich), so every tool page passes links to every sibling.

## JSON-LD

Two blocks:

1. Yoast `@graph`:
   - `["WebPage","FAQPage"]` (one node): `@id`, `url`, `name`, `isPartOf` → WebSite, `primaryImageOfPage`/`image` → ImageObject, `thumbnailUrl`, `datePublished`, `dateModified`, `description`, `breadcrumb` → BreadcrumbList, `mainEntity` → the FAQ Question nodes, `inLanguage`, `potentialAction` ReadAction.
   - `ImageObject` (primary image, width/height, caption).
   - `BreadcrumbList` (Home → page).
   - `WebSite` (with SearchAction), `Organization` (logo, sameAs).
   - `Question` nodes with `acceptedAnswer`.
2. `WebApplication`: `name`, `description`, `url`, `applicationCategory` ("ProductivityApplication"), `operatingSystem` ("Web Browser"), `browserRequirements` ("Requires JavaScript"), `offers` (Offer, price "0"), `featureList`, `creator` (Organization), and an `aggregateRating`.

## What we take, and what we don't

| Reference | Our tool pages |
|---|---|
| Tool-switcher bar | `.tl-switch`: all tools as pills, current one marked `aria-current`, plus "All tools" |
| H1 + tool in the first fold | H1 with the exact keyword, a one-line value statement, then the calculator with its result shown immediately |
| Left sidebar grouped by category | `.tl-side`: tools grouped by `group` in `xf_tools()` (Salary, Job switch, Founders) + career links; sticky on desktop, a collapsible dropdown on phones |
| Long-form below the tool | What it is → How to use (steps) → How it's calculated (formula + worked table) → Examples → deeper sections → Tips and common mistakes → Related tools → FAQ → Sources |
| `["WebPage","FAQPage"]`, ImageObject, BreadcrumbList | Same node shape (`primaryImageOfPage`, `mainEntity`, `dateModified`, `about` → the app); BreadcrumbList comes from `includes/breadcrumbs.php` (one per page) |
| WebApplication | Same properties, `operatingSystem: "Any"`, `offers` price 0 INR, `isAccessibleForFree`, `featureList`, `publisher` |
| HowTo | Added for the steps (the reference only has them as headings) |
| `aggregateRating` | **Not copied.** CLAUDE.md: ratings only from real visitor votes; tools have none |
| Site-wide Product JSON-LD | Kept (ours, unchanged) |

## Where things live

- Tool list, groups, SEO title and meta description: `wordpress/100xfounder/includes/tools.php` (`xf_tools()`).
- Template, schema and navigation: `wordpress/100xfounder-theme/page-tools.php`; styles `.tl-*` in `assets/css/theme.css`.
- Calculator maths: `wordpress/100xfounder-theme/assets/js/tools.js`; hand-checked cases in `content/calculators/tools.test.js` (`node content/calculators/tools.test.js`).
- Content per tool: `wordpress/100xfounder-theme/parts/tools/<slug>.php`, returning `h1`, `lede`, `features`, `sections` (each `id`, `h2`, `html`; `{{brand}}` = plugin brand-asset URL), `howto` (`h2`, `intro`, `steps[name,text]`), `faq[q,a]`, `sources[publisher,title,url,date]`.
- Diagrams: `content/calculators/make_images.py` → `wordpress/100xfounder/assets/brand/tool-*.png`.
- Word count and keyword stats: `python3 content/calculators/measure.py <slug>`.
