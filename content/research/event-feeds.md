# Public iCal/ICS event feeds — India startup / tech / AI

Research date: **4 October 2026**. Every URL in the "Working feeds" table was fetched with
`curl` during this research, returned **HTTP 200** and a body starting with `BEGIN:VCALENDAR`.
"Future events" = `DTSTART` strictly after 2026-10-04. In every working feed below, 100% of the
future events fell inside the next 120 days (to 2026-02-01), so the 120-day column is identical
to the future count and is omitted.

## How the two platforms behave (important for the importer)

**Luma** — `https://api.lu.ma/ics/get?entity=calendar&id=<cal-id>`. Public, no auth, no rate
limiting observed. Each `VEVENT` has **no `URL:` property**, but `DESCRIPTION` always begins with
`Get up-to-date information at: https://luma.com/<slug>` — so the importer must regex the Luma
URL out of `DESCRIPTION` (not read `URL:`). `LOCATION` holds a full street address for in-person
events; for online/unlisted-venue events Luma puts the event URL *in `LOCATION`* instead, which
the importer should detect and treat as "online". `GEO` lat/long is present for physical venues.
Find the `cal-...` id by fetching the calendar's `lu.ma/<slug>` page and grepping `cal-[A-Za-z0-9]{10,}`.

**Meetup** — `https://www.meetup.com/<group-slug>/events/ical/`. Public, no auth. Each `VEVENT`
*does* carry a real `URL;VALUE=URI:` pointing at the meetup event page — good for og:image
scraping. **Caveat: Meetup caps the feed at 10 upcoming events**, so high-volume groups are
truncated; re-poll often. Second caveat: Meetup returns a valid but **event-free** `VCALENDAR`
(~250–400 bytes, zero `VEVENT`) when a group has no upcoming events — the importer must not treat
HTTP 200 as "has events". Many Indian Meetup AI groups schedule **online-only** events (no
`LOCATION` line at all), so city attribution has to come from the group, not the event.

---

## WORKING FEEDS — India-relevant

| # | Name | ICS URL | Cities | Event types | Future events | Has URLs |
|---|------|---------|--------|-------------|---------------|----------|
| 1 | Dev Days (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-UpY60edu8kMkmap` | Bengaluru, Mumbai, Delhi NCR, Hyderabad, Pune, Chennai + tier-2 | Campus/dev-community build days, AI workshops, hackathons | **155** | Yes (DESCRIPTION) |
| 2 | Codex Community Events (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-63UOFcweB97l2gc` | Delhi NCR, Bengaluru, Mumbai (+ global) | Developer meetups, DevDay Exchange hackathons, AI tooling | **69** (2 explicitly India-located) | Yes (DESCRIPTION) |
| 3 | Build Club (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-yrYsEKDQ91hPMWy` | Hyderabad + global (SF, Sydney) | Agentic-AI builder sessions, hackathons, demo nights | **16** | Yes (DESCRIPTION) |
| 4 | Delhi Startups™ Club (Meetup) | `https://www.meetup.com/delhincrstartups/events/ical/` | Delhi NCR | Founder networking, AI-agent build workshops, hiring/career | **10** (feed cap) | Yes (`URL:`) |
| 5 | Hyderabad Startup: Idea to IPO (Meetup) | `https://www.meetup.com/hyderabad-startup-idea-to-ipo/events/ical/` | Hyderabad | Founder/startup networking, AI agent workshops | **10** (feed cap) | Yes (`URL:`) |
| 6 | India Artificial Intelligence Meetup Group (Meetup) | `https://www.meetup.com/india-artificial-intelligence-meetup-group/events/ical/` | Bengaluru-based, events online | Weekly AI/agentic-engineering workshops | **10** (feed cap) | Yes (`URL:`) |
| 7 | Delhi AI, ML & Computer Vision Meetup (Meetup) | `https://www.meetup.com/delhi-ai-machine-learning-and-computer-vision-meetup/events/ical/` | Delhi NCR (events mostly virtual) | AI/ML/CV talks, MCP & agents meetups | **10** (feed cap) | Yes (`URL:`) |
| 8 | Chennai AI & Data Science — AI.Bharath.CLUB (Meetup) | `https://www.meetup.com/ac-maa/events/ical/` | Chennai (events mostly virtual) | AI ethics, agentic/multimodal AI mixers, AI careers | **10** (feed cap) | Yes (`URL:`) |
| 9 | Qiskit Fall Fest x Quantumx (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-JWQUb5DzbXv3V3L` | Bengaluru (+ Kochi) | Quantum computing hack days, workshops at Startup Park Bengaluru | **6** | Yes (DESCRIPTION) |
| 10 | Disrupt 4.0 (Meetup) | `https://www.meetup.com/disrupt-4-0/events/ical/` | Bengaluru | Agentic AI engineering, AWS/compliance, AI product talks | **6** | Yes (`URL:`) |
| 11 | DevAarambh Event Calendar (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-ikf1txq797x2Yhd` | Gurugram + Jaipur, Indore, Ujjain | "AgentForge" campus AI-agent build events | **5** | Yes (DESCRIPTION) |
| 12 | The Product Folks (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-igh9rxZ6WoNguRK` | Bengaluru, Hyderabad (+ Singapore) | Product-management / growth meetups, Vibe Sprints, demo days | **4** | Yes (DESCRIPTION) |
| 13 | Agent Builders Community (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-9ECPyi2s6f2zQ8q` | Mumbai (WeWork Andheri), Kerala | In-person AI-agent builder meetups | **4** | Yes (DESCRIPTION) |
| 14 | Indian Data Club — Offline Community Connect (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-dAfpBp23qUH099j` | Noida / Lucknow (Delhi NCR orbit) | AI infrastructure & model talks, offline community connects | **2** | Yes (DESCRIPTION) |
| 15 | eChai Pune Startup Network (Meetup) | `https://www.meetup.com/startuppune/events/ical/` | Pune | eChai Startup Demo Day, founder networking | **1** | Yes (`URL:`) |
| 16 | Pune Women in ML & Data Science (Meetup) | `https://www.meetup.com/pune-women-in-machine-learning-and-data-science/events/ical/` | Pune | AI/ML community talks ("EXPLORETHON") | **1** | Yes (`URL:`) |
| 17 | Chennai AI Developers Group (Meetup) | `https://www.meetup.com/chennai-ai-developers-group/events/ical/` | Chennai (virtual) | Google Agents / enterprise AI sessions | **1** | Yes (`URL:`) |
| 18 | Mela Ventures (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-3zQ850FeZsW5Xra` | Bengaluru | VC founder series ("FoundrPwr") at Bangalore International Centre | **1** | Yes (DESCRIPTION) |
| 19 | Product Reactor (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-cxuf2DbF6k39ICD` | Bengaluru | Bangalore Product Mixer (PM community) | **1** | Yes (DESCRIPTION) |
| 20 | Build with Rishi (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-9AuMAARidFo2BcO` | Noida (Paytm One Skymark) | Hands-on AI agent build sessions | **1** | Yes (DESCRIPTION) |
| 21 | Alt Carbon (Luma) | `https://api.lu.ma/ics/get?entity=calendar&id=cal-BgHr4oxjEjenmaS` | Bengaluru (IISc iHub) | Climate-tech startup open house | **1** | Yes (DESCRIPTION) |
| 22 | AIMinds (Datacouch, Meetup) | `https://www.meetup.com/AIMinds-The-Hub-For-AI-Intellectuals/events/ical/` | Bengaluru-based, APAC/online | AI research & architecture talks | **1** | Yes (`URL:`) |
| 23 | TechNexus Community (Meetup) | `https://www.meetup.com/technexus-community/events/ical/` | Coimbatore (TN) | "Anthropic Code & Coffee" dev meetups | **1** | Yes (`URL:`) |
| 24 | Big Data & AI / CloudxLab (Meetup) | `https://www.meetup.com/cloudxlab/events/ical/` | India-based, online | Data/AI live sessions | **1** | Yes (`URL:`) |

**India-relevant subtotal: 24 feeds, ~311 future events.**

### Also working, but global (low India relevance — import only if you want global AI events)

| Name | ICS URL | Future events | India events | Verdict |
|------|---------|---------------|--------------|---------|
| Superteam | `https://api.lu.ma/ics/get?entity=calendar&id=cal-cl57AMcV2gdbbau` | 67 | 1 (Solana Summit India, 2 Nov) | Crypto/Web3, mostly Ukraine/Japan/LatAm — skip or filter hard |
| SpaceXAI Community | `https://api.lu.ma/ics/get?entity=calendar&id=cal-61Cv6COs4g9GKw7` | 57 | 0 | Grok/xAI meetups worldwide |
| AICamp | `https://api.lu.ma/ics/get?entity=calendar&id=cal-OmpgKprK483Umxi` | 13 | 0 | US/Canada AI dev nights |
| Google DeepMind | `https://api.lu.ma/ics/get?entity=calendar&id=cal-7Q5A70Bz5Idxopu` | 8 | 0 | US/EU AI events |
| South Park Commons | `https://api.lu.ma/ics/get?entity=calendar&id=cal-Ve0M7LoDOpdnF3z` | 3 | 0 | SF founder fireside chats |
| Reading Rhythms Global | `https://api.lu.ma/ics/get?entity=calendar&id=cal-CDoX2WaI5IHD5xs` | 17 | 0 | Not tech — reject |
| Creative Coffee Club | `https://api.lu.ma/ics/get?entity=calendar&id=cal-dc0YiqvoSm8A5Bq` | 6 | 0 | US creative happy hours — reject |
| Web3Privacy Now | `https://api.lu.ma/ics/get?entity=calendar&id=cal-WJeK56sraztsiIa` | 3 | 1 (Ethereum Cypherpunk Congress, Mumbai, 2 Nov) | Niche |

Grand total across every verified feed: **475 future events** (≈311 of them India-relevant).

---

## Example events (verified, pulled from the feeds)

**Dev Days** — `Dev Days | Pune, India` (6 Oct 2026, PCET's Nutan Maharashtra Institute of
Engineering and Technology, Pune) · `Dev Days | Bangalore, India` (9 Oct 2026, Alliance
University Central Campus, Chandapura) · `Dev Days | Gautam Buddha Nagar, India` (5 Oct 2026,
Galgotias College of Engineering and Technology, Knowledge Park, Greater Noida).

**Codex Community Events** — `DevDay Exchange Community Meetup: Delhi NCR` (11 Oct 2026, New
Delhi) · `DevDay Exchange Community Hackathon: New Delhi` (1 Nov 2026, New Delhi).

**The Product Folks** — `Vibe Sprint Bangalore | The Product Folks x Scaler` (10 Oct 2026) ·
`Vibe Sprint Hyderabad | The Product Folks x Scaler` (11 Oct 2026) · `First Light: Demo Day`
(14 Oct 2026).

**DevAarambh** — `AgentForge - Gurugram` (10 Oct 2026, Zenith School of AI, K.R. Mangalam
University, Sohna) · `AgentForge - Ujjain` (9 Oct 2026, MIT Group of Institutes) ·
`AgentForge - Indore` (12 Oct 2026, Shri Vaishnav Institute of Management & Science).

**Agent Builders Community** — `Agent Builders Meet Mumbai [In-Person]` (10 Oct 2026, WeWork
Raheja Platinum, Andheri–Kurla Road, Mumbai) · `Kerala Meetup | UiPath Coded Apps Deep Dive`
(10 Oct 2026, The Atomic, Technopark, Thiruvananthapuram).

**Delhi Startups™ Club** — `3 Hours to Research Intelligence: Build Your First AI Agent`
(6 Oct 2026) · `From Expert to Builder: Using AI to Turn Your Knowledge Into Product`
(14 Oct 2026) · `How to Stop Failing Interviews (And Start Getting Hired)` (13 Oct 2026). All
online; no `LOCATION`.

**Qiskit Fall Fest x Quantumx** — `Qiskit Fall Fest 2026: Quantum Community Connect` (10 Oct
2026, Startup Park Bengaluru, Total Mall) · `Quantum and Qiskit 101` (6 Nov 2026, Startup Park
Bengaluru) · `Hands-On Quantum Programming with Qiskit` (16 Nov 2026, HKBK College of
Engineering, Nagavara, Bengaluru).

**Indian Data Club** — `AI Infrastructure: The Systems Behind Intelligence` (11 Oct 2026, The HI
Labs, Vijyant Khand, Gomti Nagar) · `The Model Wars` (17 Oct 2026, Paytm, One Skymark, Sector
98, Noida).

**Mela Ventures** — `FoundrPwr - Building Exceptional Teams ft. Phanindra Sama (RedBus)`
(8 Oct 2026, Bangalore International Centre, Domlur).

**Disrupt 4.0** — `The Agentic AI Compliance Agent: Securing AWS for HIPAA and GDPR` (10 Oct
2026) · `Agents at the Wheel: The State of Autonomous AI – Part 1` (17 Oct 2026) ·
`Building Autonomous AI Agents: From LLM Reasoning to Real-World Action` (24 Oct 2026).

---

## Tried and FAILED / rejected

### Luma calendars that returned valid ICS but **zero future events** — rejected
| Calendar | ICS URL | Result |
|---|---|---|
| Bengaluru Tech Week | `...id=cal-l0CgIJ0Hhef7fcT` | HTTP 200, 82 `VEVENT`s, **all in the past**, 0 future. Worth re-checking before the next edition. |
| Inside WeWork India | `...id=cal-31nc2dXsETcg6r3` | HTTP 200, 3 events, **0 future**. |
| India AI Impact Summit (official + side events) | `...id=cal-pLT2TGse7glx1r5` | HTTP 200, 38 events, **0 future** — summit ran 16–20 Feb 2026, already over. |
| Gurgaon Calendar (`lu.ma/gurgaon`) | `...id=cal-wbIol2FWC8f2DUY` | HTTP 200 but **0 `VEVENT`** — empty calendar. |
| Builders Club (`lu.ma/buildersclub`) | `...id=cal-qcbkrmXGaYXa6fA` | HTTP 200 but **0 `VEVENT`** — empty calendar. |
| Network Capital Gurugram (`lu.ma/gurugram`, `lu.ma/ncr`) | `...id=cal-eiQj3unbhhFMJQM` | HTTP 200, 250 events, **0 future**. |
| Startup Grind (`lu.ma/startupgrind`) | `...id=cal-Gqctzrew8g4P6TJ` | HTTP 200, 41 events, **0 future**. |
| AI Tinkerers (global) | `...id=cal-UCNcNUQEeTHdcnt` | HTTP 200, only 1 future event, 0 India. No per-city India chapter calendar found. |

### Luma slugs that 404'd (do not exist — do not guess these)
`lu.ma/bangaloretechweek`, `lu.ma/mumbaitechweek`, `lu.ma/delhitechweek`, `lu.ma/techweekindia`,
`lu.ma/indiatechweek`, `lu.ma/aicampindia`, `lu.ma/nasscom10000startups`, `lu.ma/headstart`,
`lu.ma/tie`, `lu.ma/tieblr`, `lu.ma/100xvc`, `lu.ma/bhive`, `lu.ma/91springboard`,
`lu.ma/startupindia`, `lu.ma/techsparks`, `lu.ma/ycindia`, `lu.ma/foundersroadmap`,
`lu.ma/indiaaiclub`, `lu.ma/aifoundry`, `lu.ma/openaiindia`, `lu.ma/awsindia`,
`lu.ma/microsoftindia`, `lu.ma/gdgindia`, `lu.ma/scaler`, `lu.ma/peerlist`, `lu.ma/nasscom`,
`lu.ma/antler`, `lu.ma/bangalore-ai`, `lu.ma/aiclub`, `lu.ma/echai`, `lu.ma/buildclub`,
`lu.ma/foundersfactory`, and all `lu.ma/aitinkerers-<city>` variants (bangalore, bengaluru,
mumbai, delhi, newdelhi, hyderabad, pune, chennai, gurgaon).

`lu.ma/antlerindia` and `lu.ma/growthx` resolve to **single event pages, not calendars** — no
`cal-` id in the HTML, so no ICS feed. Same for `lu.ma/productfolks` (use `lu.ma/theproductfolks`
instead) and `lu.ma/buildspace`.

### Meetup groups: valid ICS, **zero upcoming events** — rejected
All returned HTTP 200 with a well-formed but empty `VCALENDAR`:
`bangalore-tech-talks-meetup`, `startup-entrepreneurs-bengaluru`, `startupbangalore` (eChai
Bangalore), `hwstartup` (Bangalore Hardware Startups), `smvs-blr`, `indianstartupsbangalore`,
`blrstartups`, `bhive-startup-and-entrepreneur-community`, `awsugblr` (AWS UG Bangalore),
`bangalore-ai-ml-meetup`, `bangalore-computervision-meetup`, `building-with-ai`, `futuregpt`,
`llm-agents`, `opensourceblr`, `lode-networking-blr`, `bengaluru-jobs-referrals`,
`chennai-startups`, `madras-marketers`, `mumbaientrepreneurs`, `indianstartups`,
`pune-early-stage-founders-club`, `pydata-hyderabad`, `pydatadelhi`, `startuphyderabad`,
`startup-agile-group-chennai`, `startup-agile-group-hyderabad`, `startup-agile-group-pune`,
`gurgaon-delhi-noida-data-and-ai-professionals`, `techmeet360`, `ai-horizon`,
`ai-data-analytics-professionals-group-in-jaipur`.
Several of these (eChai Bangalore, AWS UG Bangalore, BHIVE) are genuinely active communities that
simply had nothing scheduled on 4 Oct 2026 — the URLs are valid and worth re-polling monthly.

### Meetup slugs that 404'd (guessed, do not use)
`bangalore-tech-startups`, `TechHubBangalore`, `google-developer-groups-bangalore`,
`gdg-cloud-bengaluru`, `Delhi-NCR-Startup-Founders`, `aws-user-group-bangalore`,
`pune-tech-meetup`, `hyderabad-startups`, `Chennai-Geeks`, `mumbai-tech-meetups`.
`buildindiaold` returned **HTTP 403**.

### Other platforms — no public ICS found
- **GDG / Google Developer Groups (gdg.community.dev, Bevy platform)** — the richest India source
  on paper (DevFest New Delhi 16–18 Oct, DevFest Chennai 17 Oct, DevFest Hyderabad 24 Oct 2026),
  but no ICS endpoint exists. Tried `gdg.community.dev/events/calendar/` (404),
  `gdg.community.dev/<chapter>/calendar.ics` (404), `gdg.community.dev/<chapter>/events/calendar/`
  (404), and the Bevy API `gdg.community.dev/api/event_slim/?chapter=<slug>` (HTTP 400, needs a
  numeric chapter id). **Would need an HTML/JSON scraper, not an ICS importer.**
- **Eventbrite organiser pages** — Eventbrite exposes `/ical` per *event*, not per organiser.
  No organiser-level ICS feed exists; tested `eventbrite.com/o/<org>/ical` → 404.
- **Hasgeek** (hasgeek.com, India's main tech-conference platform) — `/calendar.ics` and
  `/events.ics` both 404. No public ICS.
- **developers.events** (`/all-events.ics`) — 404.
- **91springboard, Antler India, 100X.VC, Y Combinator India, Microsoft Reactor Bengaluru,
  NASSCOM 10000 Startups** — no public ICS feed located for any of them; their event listings are
  HTML-only or behind Luma event pages without a parent calendar.

---

## Recommended importer config

1. **Poll Meetup feeds weekly or more often** — the 10-event cap means you lose events otherwise.
2. **Luma feeds: parse the URL out of `DESCRIPTION`**, not `URL:`. Regex:
   `https://luma\.com/[A-Za-z0-9-]+`.
3. **Treat a 200 with zero `VEVENT` as "no events"**, not as an error — it is the normal Meetup
   and Luma response for an idle calendar.
4. **Filter Luma's global calendars by `LOCATION` containing `India`** (or a city keyword) before
   importing; Dev Days, Codex and Superteam are worldwide feeds.
5. **Detect online events**: Luma writes the event URL into `LOCATION` when there is no venue;
   Meetup omits `LOCATION` entirely. A large share of the Indian Meetup AI groups are online-only.
6. **Re-check the zero-future-event list monthly** — Bengaluru Tech Week, eChai Bangalore, AWS UG
   Bangalore and BHIVE all have valid feed URLs and will repopulate.
