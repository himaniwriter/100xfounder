# Funding News Pipeline (N8N Blueprint)

Goal: Create an automated funding intelligence pipeline that ingests startup news, extracts structured funding data with AI, enriches logos, and pushes updates into 100Xfounder.

## Step 1: Source Trigger

Node: RSS Feed Read

Sources:
- https://entrackr.com/feed/
- https://inc42.com/feed/
- https://techcrunch.com/category/startups/feed/

Schedule:
- Every 2 hours.

## Step 2: Intelligence Parser (LLM)

Node: OpenAI (or Gemini via HTTP Request)

Prompt:

"Analyze this news headline: '{{ $json.title }}'. If this is a funding announcement, extract data into this JSON format: { 'is_funding': true, 'company_name': 'X', 'amount': '$X', 'round': 'Series X', 'investors': ['A', 'B'] }. If not funding, return { 'is_funding': false }."

Recommended return schema:
- is_funding: boolean
- company_name: string
- amount: string
- round: string
- investors: string[]
- valuation: string | null
- source_url: string
- source_name: string
- announced_at: ISO timestamp | null

## Step 3: Image Enrichment

Node: HTTP Request (Clearbit Logo API)

Logic:
- Guess domain from company name (example: Zepto -> zeptonow.com).
- Attempt logo fetch using:
  - https://logo.clearbit.com/{{domain}}
- Store resolved logo URL and domain.

Fallback strategy in frontend (already implemented):
1. Clearbit logo URL
2. Google favicon URL
3. Initials avatar with gradient background

## Step 4: Storage (Supabase/Postgres)

Node: Postgres / Supabase

Action:
- Insert into `funding_news` table.

Suggested table schema:
- id (uuid, primary key)
- company_name (text, indexed)
- company_slug (text, indexed)
- company_domain (text)
- logo_url (text)
- headline (text)
- amount (text)
- round (text)
- valuation (text)
- investors (text)
- lead_investor (text)
- announced_at (timestamptz)
- detected_at (timestamptz, default now())
- source_name (text)
- source_url (text)
- is_featured (boolean, default false)

## API Push Option (Optional)

Instead of direct DB insert, call your app webhook/API for normalization and dedupe:
- POST /api/signals/funding/sync (recommended)

Payload example:

```json
{
  "headline": "Zepto raises $200M Series E led by StepStone Group",
  "company_name": "Zepto",
  "company_domain": "zeptonow.com",
  "amount": "$200M",
  "round": "Series E",
  "valuation": "$1.4B",
  "investors": ["StepStone Group", "Glade Brook"],
  "source_name": "Entrackr",
  "source_url": "https://entrackr.com/..."
}
```

## Quality Rules

- Deduplicate by `(company_name, round, amount, announced_at)`.
- Reject non-funding news where `is_funding = false`.
- Mark mega rounds (`$100M+`) as `is_featured = true`.
- Keep raw headline + parsed JSON in logs for auditability.
