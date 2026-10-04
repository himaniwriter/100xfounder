# Daily Growth Routine and Headless WordPress: Setup Guide

## What runs every day

The routine is a Vercel Cron job. It calls `/api/cron/daily-growth` at 14:00 UTC (7am Pacific / 7:30pm IST), configured in `vercel.json`. Each run goes through these stages in order:

| Stage | What it does | Code |
|---|---|---|
| `import` | Fetches yesterday's Product Hunt launches and keeps three groups: the **top 10 by votes**, the **top 5 featured** (#1 is shown as Product of the Day), and anything with **100+ upvotes**. Each one becomes a listing at `/launches/<slug>`. | `lib/launch/producthunt.ts`, `lib/launch/import.ts` |
| `contacts` | Visits each product's own website (home, /contact, /about, /team) to find a published contact email plus X and LinkedIn links. It tries 15 products per run and never emails the same address twice. | `lib/launch/contacts.ts` |
| `replies` | Checks the outreach inbox over IMAP. Anyone who replied stops getting follow-ups. Bounced addresses are added to the suppression list. | `lib/launch/outreach.ts` |
| `send` | Sends the 3-email sequence: an invite on day 0, a follow-up on day 3 and a final note on day 7. It respects the daily limit, the unsubscribe list and replies. | `lib/launch/outreach.ts`, `lib/launch/templates.ts` |
| `digest` | Queues an Instagram carousel of the "Top 5 launches today" (cover + 5 products + CTA slide) with a ready-to-paste caption. | `lib/launch/instagram.ts` |

When a founder fills in the spotlight form at `/feature/<token>`:
1. The spotlight waits for review in **Admin → Launch Outreach**. Set `SPOTLIGHT_AUTO_PUBLISH=true` to skip the review.
2. Clicking **Publish** puts it live at `/spotlight/<slug>`.
3. If the founder agreed to Instagram, a 4-slide spotlight carousel is queued.

### Admin → Launch Outreach (`/admin/launch-outreach`)
- Status chips show which settings are configured.
- Buttons run the whole routine or a single stage on demand.
- **Instagram queue:** download each slide, copy the caption, then mark the post as posted.
- Review submitted spotlights, stop outreach to any contact, and hide any imported product.

## One-time setup

1. **Product Hunt token.** Create an application at <https://www.producthunt.com/v2/oauth/applications> and copy its *Developer Token* into `PRODUCT_HUNT_TOKEN`. The API is documented at <https://github.com/producthunt/producthunt-api>.
   - Product Hunt's API terms restrict commercial use without their approval. Email hello@producthunt.com to describe the use case before relying on it commercially.
   - Every listing credits and links back to Product Hunt.
2. **Database.** Set `DATABASE_URL` to a Postgres (Supabase) database. Tables are created automatically on first use. The same SQL is in `supabase/migrations/20261004120000_launch_outreach.sql`.
3. **Outreach mailbox.** Use a dedicated sending address, ideally on a separate domain or subdomain such as `hello@get100xfounder.com`, so cold email can't hurt the main domain's reputation.
   - With Google Workspace, turn on 2-step verification and create an **app password**.
   - Set `SMTP_USER`, `SMTP_PASS`, `OUTREACH_FROM_EMAIL` and `OUTREACH_FROM_NAME`.
   - IMAP uses the same credentials by default.
   - Set up SPF, DKIM and DMARC on the sending domain.
   - Warm the mailbox up: start at `OUTREACH_DAILY_LIMIT=10` and raise it over 2–3 weeks to about 30–50.
4. **Compliance.** Set `OUTREACH_POSTAL_ADDRESS`; CAN-SPAM requires a physical address. Sending stays off until it's set.
   - Every email has a one-click unsubscribe link and a `List-Unsubscribe` header.
   - Only emails a company publishes on its own website are used.
   - EU and UK recipients are covered by GDPR/PECR. Keep volumes low and personal, and honour objections immediately.
5. **Turn on sending.** Set `OUTREACH_ENABLED=true`.
6. **Cron secret.** Set `CRON_SECRET` to a long random string. Vercel sends it automatically, so the endpoint rejects everyone else.
7. **Photo uploads.** Founder photos go to Supabase Storage. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`, which are already used by the media library.

You can run any stage by hand:
```bash
curl -H "Authorization: Bearer $CRON_SECRET" "https://100xfounder.com/api/cron/daily-growth?stages=import,contacts"
```

## Headless WordPress (blog + pages)

WordPress is the **editor**; 100xfounder.com stays the fast Next.js site.

1. On your WordPress hosting, install WordPress on a subdomain such as `cms.100xfounder.com`.
2. Upload `wordpress/100xfounder-headless/` to `wp-content/plugins/` and activate **100xFounder Headless**.
3. In WordPress, go to **Settings → 100xFounder Headless**. Set the live site URL to `https://100xfounder.com` and choose a revalidate secret.
4. On the live site, set:
   - `WORDPRESS_URL=https://cms.100xfounder.com`
   - `WORDPRESS_REVALIDATE_SECRET=<same secret>`
5. Optionally install **Yoast SEO**. Its SEO title and description are used automatically.

How it works:
- **Posts** appear at `/blog/<slug>`, mixed in with existing posts. WordPress wins when two posts share a slug.
- **Posts must meet the blog's quality bar** to show: a featured image, a title of 12+ characters, an excerpt of 60+ characters, and 400+ words.
- **Pages** appear at `/pages/<slug>`.
- **Publishing or updating** refreshes the live site within seconds through the plugin's webhook. Without the webhook, changes show within 5 minutes.
- **Visitors to the WordPress site who aren't logged in** are redirected to the matching page on 100xfounder.com.
