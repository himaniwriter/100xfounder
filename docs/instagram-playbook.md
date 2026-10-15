# @100x.founder Instagram playbook

Inspired by the *format* of founder-media pages like CEOs of Bharat (short, human, number-led founder stories and fast news cards), applied to 100xFounder's own content. Never copy their posts, photos or wording; every fact needs a source on our site.

## The pattern in one line
**One human story, one useful number, one clear next step** — on every post.

## Content pillars (weekly mix, 1–2 posts a day)

| Pillar | Share | What it is | Source on our site |
|---|---|---|---|
| **Founder story** ("Meet the founder who…") | 30% | A founder's journey in 6–8 slides: the problem, the low point, the turn, the number today, the lesson | Researched startup profiles, founder spotlights |
| **Startup news card** | 25% | One headline + 3 facts + "why it matters for Indian founders" | Funding tracker, news articles |
| **Launch of the day** | 15% | A new product from our directory: what it does, who it's for, pricing, link | Daily Product Hunt import + startup profiles |
| **AI tool tip** ("Use this AI for…") | 15% | One task → the best tool → how to use it in 3 steps | "Best AI for X" articles |
| **Weekly roundups** | 10% | "This week in Indian startups": 5 funding rounds / 5 launches / upcoming IPOs | Funding tracker, events, news sitemap |
| **Jobs & careers** | 5% | "Companies hiring this week" or a salary insight | Jobs board, salary tools |

## Post formats

1. **Founder story carousel (1080×1350, 6–8 slides)**
   - Slide 1 (hook): big headline with a concrete number or contrast — e.g. *"Rejected by 40 investors. Now serves 2 lakh users."* + founder photo (their own press photo, with permission/credit) + small "Founder story" label.
   - Slides 2–6: one idea per slide, ≤25 words each.
   - Slide 7: the lesson (quotable line).
   - Slide 8: "Read the full story — link in bio · 100xfounder.com/startup/…" + source credit.
2. **News card (single image or 3-slide)**: headline, 3 bullet facts with numbers, "Why it matters" line, source name at the bottom.
3. **Launch of the day (single)**: product logo/screenshot, one-line pitch, "Free / from $X", "Find it on 100xFounder".
4. **AI tip (4-slide)**: "Stop doing X manually" → tool → 3 steps → "More tools: link in bio".
5. **Roundup (5–6 slides)**: one item per slide, consistent layout, numbered.
6. **Reels (2/week, optional)**: 20–30s voiceover of a founder story carousel (text on screen, b-roll from the founder's public demo video with credit).

## Visual system (matches the website)
- Background `#0b0b0c`, text `#f2f2ef`, accent violet `#b07cff`, gradient `#7c5cff → #b07cff → #ff6ad5 → #6a7bff` on a thin divider and the series label.
- Type: Inter Bold for headlines (max 9 words, 2 lines), Inter Regular for body, Geist Mono for small labels ("FOUNDER STORY", "NEWS", "LAUNCH", "AI TIP").
- Fixed positions: series label top-left, slide number top-right, "100xfounder.com" bottom-left, source bottom-right.
- One accent word per headline in violet (the number or the surprising word).
- Real photos only (founder-provided or press-kit with credit); no stock "businessman" images, no AI faces of real people.

## Caption formula
```
[Hook line repeating the slide-1 number]

[2–3 short lines: problem → turn → today]

[The lesson in one line]

👉 Full story + sources: link in bio (100xfounder.com/…)
💬 [A question to drive comments, e.g. "Would you have taken the job offer or kept building?"]

#100xfounder #indianstartups #founderstory #[industry] #[city]startups #buildinpublic
```
- 5–8 hashtags max: 2 brand/broad, 2 topic, 1–2 city/industry, 1 series tag (#FounderStory100x, #LaunchOfTheDay100x, #AITip100x).
- Tag the founder and the startup's account (with their consent for features).

## Weekly calendar (IST)
| Day | Morning (9:30) | Evening (19:30) |
|---|---|---|
| Mon | Weekly funding roundup | AI tip |
| Tue | Founder story | Launch of the day |
| Wed | News card | Founder story (reel) |
| Thu | Founder story | Launch of the day |
| Fri | News card | AI tip |
| Sat | "This week in Indian startups" | — |
| Sun | Founder story (best of week, reel) | — |

## Growth habits
- Reply to every comment within the first hour; pin the best founder question.
- DM each featured founder the post and ask them to share/collab-post (Instagram "Collab" puts it on both profiles — the single biggest reach lever).
- Stories daily: reshare the post, a poll ("Which tool do you use?"), and a link sticker to the article.
- Every post links back to a page on 100xfounder.com (bio link page with the latest 6 posts → their articles) — this is what turns Instagram into site traffic and indexing signals.

## Rules (non-negotiable)
- Every number and claim comes from a sourced page on 100xfounder.com; put the source on the last slide.
- Founder features need the founder's OK (outreach email already asks for it); use only photos they provide or press-kit photos with credit.
- Paid features are labelled "Paid partnership" (Instagram's tool) — never disguised.
- No copying CEOs of Bharat's (or anyone's) posts, photos, captions or headline wording.

## How this plugs into the site
- The plugin already renders 1080×1350 carousels (`includes/instagram.php`: daily top-launches digest, founder spotlights). Next build step: add the Founder-story, News-card, AI-tip and Roundup templates in this visual system, generated from the matching site content, queued in WP admin → 100xFounder → Instagram queue.
- Once the Instagram API is connected (see reminder, 15 Oct), the queue posts automatically on the calendar above.
