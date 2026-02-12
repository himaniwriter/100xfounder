# 100Xfounder

100Xfounder is a premium founder and startup intelligence platform built with Next.js, Prisma, and Supabase/Postgres, with n8n handling automation workflows.

## What this project includes
- Founder directory with filters and profile pages
- Company profile pages (SEO-focused, YC-style layout)
- Blog and intelligence content sections
- Signals and funding UI sections
- Authentication (login/register/session)
- Claim profile workflow
- n8n webhooks for newsletter, unlock tracking, claims, profile updates, and AI content expansion

## Tech stack
- Next.js 14 (App Router, TypeScript)
- Tailwind CSS + clsx + tailwind-merge
- Framer Motion + Lucide React
- Prisma ORM + PostgreSQL (Supabase-compatible)
- n8n for workflow automation

## Local development

### Prerequisites
- Node.js 20+
- npm
- PostgreSQL (or Supabase project)

### Install and run
```bash
npm ci
cp .env.example .env.local
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Open: `http://127.0.0.1:3000`

## Environment variables

Use `.env.local` for local and `.env.production` on server.

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DB_NAME?schema=public"
AUTH_SECRET="replace-with-long-random-secret"
ADMIN_EMAIL="admin@example.com"

N8N_SYNC_SECRET="replace-with-strong-shared-secret"
N8N_WEBHOOK_URL="https://your-n8n-instance/webhook/founder-profile"
N8N_SECRET_KEY="replace-with-webhook-secret"
N8N_COMPANY_CONTENT_WEBHOOK_URL="https://your-n8n-instance/webhook/company-content"
N8N_NEWSLETTER_WEBHOOK_URL="https://n8n.yourdomain.com/webhook/subscribe"
N8N_UNLOCK_CONTACT_WEBHOOK_URL="https://n8n.yourdomain.com/webhook/unlock-contact"
N8N_CLAIM_PROFILE_WEBHOOK_URL="https://n8n.yourdomain.com/webhook/claim-profile"
```

## Core routes
- `/` Home
- `/founders` Founder directory
- `/founders/[slug]` Founder profile
- `/company/[slug]` Company profile
- `/signals` Signals page
- `/startups` Startup explorer
- `/blog` Blog home
- `/blog/[slug]` Blog article
- `/login` Login/Register
- `/dashboard` User/Admin dashboard

## API routes

### Auth
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

### Founder data
- `GET /api/founders`
- `POST /api/founders/sync` (requires header: `x-secret-key = N8N_SYNC_SECRET`)
- `POST /api/founders/claim` (logged-in users)

### Events
- `POST /api/newsletter/subscribe`
- `POST /api/events/unlock-contact`

### Admin connectors
- `GET /api/dashboard/connectors`
- `POST /api/dashboard/connectors`
- `POST /api/dashboard/connectors/:id/sync`

## n8n integration (current mapping)

### 1) Profile update webhook
- Source: server action `actions/update-profile.ts`
- Target env: `N8N_WEBHOOK_URL`
- Secret header: `x-secret-key = N8N_SECRET_KEY`

Payload:
```json
{
  "name": "...",
  "bio": "...",
  "linkedinUrl": "...",
  "submittedAt": "2026-02-12T00:00:00.000Z"
}
```

### 2) Newsletter subscribe
- Source: `POST /api/newsletter/subscribe`
- Target env: `N8N_NEWSLETTER_WEBHOOK_URL`
- Secret header: `x-secret-key = N8N_SYNC_SECRET`

Payload:
```json
{
  "email": "user@company.com",
  "topic": "general"
}
```

### 3) Unlock contact tracking
- Source: `POST /api/events/unlock-contact`
- Target env: `N8N_UNLOCK_CONTACT_WEBHOOK_URL`
- Secret header: `x-secret-key = N8N_SYNC_SECRET`

Payload:
```json
{
  "userId": "anonymous-or-user-id",
  "companyId": "...",
  "companyViewed": "..."
}
```

### 4) Claim profile
- Source: `POST /api/founders/claim`
- Target env: `N8N_CLAIM_PROFILE_WEBHOOK_URL`
- Secret header: `x-secret-key = N8N_SYNC_SECRET`

Payload:
```json
{
  "claimId": "...",
  "userId": "...",
  "founderEntryId": "...",
  "founderSlug": "...",
  "founderName": "...",
  "companyName": "...",
  "message": "..."
}
```

### 5) Company content expansion (SEO)
- Source: server-side generation on `/company/[slug]`
- Target env: `N8N_COMPANY_CONTENT_WEBHOOK_URL`
- Secret header: `x-secret-key = N8N_SECRET_KEY`

Request payload:
```json
{
  "type": "company_profile_expansion",
  "prompt": "I have a startup named ...",
  "company": {
    "name": "...",
    "oneLiner": "...",
    "industry": "...",
    "stage": "...",
    "location": "...",
    "tags": ["...", "..."]
  }
}
```

Expected response payload:
```json
{
  "problem": "...",
  "solution": "...",
  "why_growing": "...",
  "culture": "..."
}
```

> You can also return `whyGrowing` instead of `why_growing`.

## Deploy to DigitalOcean Droplet (recommended)

### 1) Provision
- Ubuntu 22.04 droplet
- DNS:
  - `100xfounder.com` -> droplet IP
  - `www.100xfounder.com` -> droplet IP
  - `n8n.100xfounder.com` -> droplet IP

### 2) Base setup
```bash
ssh root@YOUR_DROPLET_IP
adduser deploy
usermod -aG sudo deploy
rsync --archive --chown=deploy:deploy ~/.ssh /home/deploy
su - deploy

sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git caddy docker.io docker-compose-plugin
sudo usermod -aG docker $USER

sudo ufw allow OpenSSH
sudo ufw allow 80
sudo ufw allow 443
sudo ufw --force enable
```

Logout/login once.

### 3) Deploy app
```bash
sudo mkdir -p /opt/100xfounder
sudo chown -R $USER:$USER /opt/100xfounder
cd /opt/100xfounder
git clone https://github.com/digihandlergemini-ops/mmmm.git .
npm ci
```

Create production env (`.env.production`) with values from the env section above.

```bash
set -a && source .env.production && set +a
npx prisma generate
npx prisma migrate deploy
npm run build
npm i -g pm2
pm2 start "npm run start -- --hostname 127.0.0.1 --port 3000" --name 100xfounder
pm2 save
pm2 startup
```

### 4) Deploy n8n on same droplet (Docker)
```bash
sudo mkdir -p /opt/n8n
sudo chown -R $USER:$USER /opt/n8n
cd /opt/n8n
```

Create `/opt/n8n/.env`:
```env
N8N_HOST=n8n.100xfounder.com
N8N_PORT=5678
N8N_PROTOCOL=https
N8N_EDITOR_BASE_URL=https://n8n.100xfounder.com
WEBHOOK_URL=https://n8n.100xfounder.com/
GENERIC_TIMEZONE=Asia/Kolkata

N8N_BASIC_AUTH_ACTIVE=true
N8N_BASIC_AUTH_USER=admin
N8N_BASIC_AUTH_PASSWORD=CHANGE_ME
N8N_ENCRYPTION_KEY=CHANGE_ME_WITH_32_PLUS_CHARACTERS
```

Create `/opt/n8n/docker-compose.yml`:
```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - ./data:/home/node/.n8n
```

Run:
```bash
docker compose up -d
```

### 5) Reverse proxy + SSL with Caddy
Create `/etc/caddy/Caddyfile`:
```caddy
100xfounder.com, www.100xfounder.com {
  reverse_proxy 127.0.0.1:3000
}

n8n.100xfounder.com {
  reverse_proxy 127.0.0.1:5678
}
```

```bash
sudo systemctl restart caddy
sudo systemctl status caddy
```

## Post-deploy checks
```bash
curl -I https://100xfounder.com
curl -I https://n8n.100xfounder.com
```

Test newsletter webhook through app:
```bash
curl -X POST https://100xfounder.com/api/newsletter/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"you@company.com","topic":"fintech"}'
```

Test sync API (secret required):
```bash
curl -X POST https://100xfounder.com/api/founders/sync \
  -H "Content-Type: application/json" \
  -H "x-secret-key: YOUR_N8N_SYNC_SECRET" \
  -d '{"founders":[{"founderName":"Test Founder","companyName":"Test Co","productSummary":"Builds B2B tools"}]}'
```

## Data and docs
- n8n workflows guide: `/Users/lovishmadaan/Documents/New project/docs/n8n-workflows.md`
- funding pipeline guide: `/Users/lovishmadaan/Documents/New project/docs/funding-news-pipeline.md`
- PDF seed: `/Users/lovishmadaan/Documents/New project/lib/founders/pdf-seed.json`
- Wikipedia seed: `/Users/lovishmadaan/Documents/New project/lib/founders/wiki-seed.ts`

## Known issue
TypeScript currently reports existing Prisma typing errors in:
- `lib/founders/store.ts:367`
- `lib/founders/store.ts:388`

These are pre-existing and unrelated to deployment setup.
