# 100Xfounder

Directory platform with:
- Mixed founder/company data from your uploaded PDF and a curated eponymous-company list from Wikipedia.
- Founder profile pages.
- Authentication for members and admins.
- Claim-profile workflow for users.
- Aggregator API connector system for admins.
- n8n-compatible sync endpoints.

## Setup

```bash
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev --name auth_dashboard_connectors
npm run dev
```

## Required environment variables

- `DATABASE_URL`
- `AUTH_SECRET`
- `ADMIN_EMAIL`
- `N8N_SYNC_SECRET`
- `N8N_WEBHOOK_URL`
- `N8N_SECRET_KEY`
- `N8N_COMPANY_CONTENT_WEBHOOK_URL` (optional, for AI-expanded company profile content)
- `N8N_NEWSLETTER_WEBHOOK_URL`
- `N8N_UNLOCK_CONTACT_WEBHOOK_URL`
- `N8N_CLAIM_PROFILE_WEBHOOK_URL`

## Routes

- `/` Home
- `/founders` Directory
- `/founders/[slug]` Profile page
- `/blog` Blog home
- `/blog/[slug]` Blog article
- `/login` Login/Register
- `/dashboard` Member/Admin dashboard

## API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Founder data
- `GET /api/founders`
- `POST /api/founders/sync` (n8n secret header: `x-secret-key`)
- `POST /api/founders/claim` (logged-in users)

### Newsletter & events
- `POST /api/newsletter/subscribe`
- `POST /api/events/unlock-contact`

### Admin connectors
- `GET /api/dashboard/connectors` (admin)
- `POST /api/dashboard/connectors` (admin)
- `POST /api/dashboard/connectors/:id/sync` (admin)

## Aggregator connector payload handling

Connector sync endpoint tries to map incoming keys:
- founder: `founderName | founder | person`
- company: `companyName | company | organization`
- summary: `productSummary | summary | description`

It accepts either:
- `[{...}, {...}]`
- `{ "founders": [{...}] }`

## Data sources in app

- PDF seed: `/Users/lovishmadaan/Documents/New project/lib/founders/pdf-seed.json`
- Wikipedia eponymous seed: `/Users/lovishmadaan/Documents/New project/lib/founders/wiki-seed.ts`

## Notes

- The uploaded PDF is a group-company register. Records are mapped into directory profiles using group/owner/company fields where available.
- YC founder links are currently generated as query links to:
  - `https://www.ycombinator.com/founders?query=<name>`
- Company content expansion uses the 4-point prompt strategy and can call n8n webhook `N8N_COMPANY_CONTENT_WEBHOOK_URL`.
  - Expected JSON response keys: `problem`, `solution`, `why_growing` (or `whyGrowing`), `culture`.
- N8N architecture guide:
  - `/Users/lovishmadaan/Documents/New project/docs/n8n-workflows.md`
