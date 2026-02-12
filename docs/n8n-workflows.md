# N8N Integration Architecture for 100Xfounder

We are using N8N to handle dynamic workflows from the frontend and API routes.

Related blueprint:
- `/Users/lovishmadaan/Documents/New project/docs/funding-news-pipeline.md`

## Workflow A: Smart Newsletter (Automated)
- Trigger: `POST https://n8n.yourdomain.com/webhook/subscribe`
- Payload:
```json
{ "email": "user@gmail.com", "topic": "fintech" }
```
- N8N logic:
1. Add email to Google Sheets or Airtable.
2. Enrich with Clearbit/Apollo via HTTP Request to get job title.
3. If role contains investor keywords, tag as `High Value`.
4. Send confirmation email via Gmail/SendGrid.

Frontend/API mapping:
- Frontend: newsletter forms on blog and company modal.
- API proxy: `/api/newsletter/subscribe`.
- Env var: `N8N_NEWSLETTER_WEBHOOK_URL`.

## Workflow B: Data Unlock Tracker (Lead Scoring)
- Trigger: `POST https://n8n.yourdomain.com/webhook/unlock-contact`
- Payload:
```json
{ "userId": "123", "companyViewed": "Bajaj Finance", "companyId": "abc123" }
```
- N8N logic:
1. Log event in a lead-scoring database.
2. If unlock count is > 5 in 10 minutes, send Slack alert:
   `Potential Enterprise Customer`.
3. Future monetization gate:
   check Stripe subscription before returning private data.

Frontend/API mapping:
- Triggered by soft-gating contact reveal.
- API proxy: `/api/events/unlock-contact`.
- Env var: `N8N_UNLOCK_CONTACT_WEBHOOK_URL`.

## Workflow C: Featured Profile Upsell
- Trigger: `POST https://n8n.yourdomain.com/webhook/claim-profile`
- Payload includes claim id, user id, founder slug, founder/company names, message.
- N8N logic:
1. Receive claim request.
2. Send verification email to founder.
3. Include featured placement upsell in the email sequence.

Frontend/API mapping:
- Claim endpoint: `/api/founders/claim` (already forwards to webhook).
- Env var: `N8N_CLAIM_PROFILE_WEBHOOK_URL`.

## Workflow D: Company Content Expansion (SEO)
- Trigger: `POST https://n8n.yourdomain.com/webhook/company-content`
- Payload:
```json
{
  "type": "company_profile_expansion",
  "prompt": "I have a startup named ...",
  "company": {
    "name": "Odeko",
    "oneLiner": "Operations software that helps cafes grow.",
    "industry": "Supply Chain",
    "stage": "Series B",
    "location": "New York, NY",
    "tags": ["B2B", "Supply Chain"]
  }
}
```
- N8N logic:
1. Pass `prompt` + company context to LLM node.
2. Enforce JSON output with keys:
   - `problem`
   - `solution`
   - `why_growing` (or `whyGrowing`)
   - `culture`
3. Return JSON body directly to the app.

Frontend/API mapping:
- Server-side company page generation: `/company/[slug]`.
- Env var: `N8N_COMPANY_CONTENT_WEBHOOK_URL`.

## Shared Security
- Use `x-secret-key` header with shared secret (`N8N_SECRET_KEY` for app webhooks, `N8N_SYNC_SECRET` for sync endpoint).
- Keep all N8N webhook URLs server-side only.
