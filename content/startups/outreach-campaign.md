# Campaign: Listing update + Instagram feature

Prepared 2026-10-14 for all 1,393 startup listings (`/wp-json/wp/v2/xf_startup`, pages 1–14). Not created in the live dashboard: the outreach module has no REST endpoint, and its admin actions need a logged-in browser session with a nonce. Paste it in by hand as described below.

Contacts and sources: `content/startups/_founder-contacts.json`. Recipients:
- `outreach-campaign.csv` (407 rows): every own-domain address, deduplicated by email. Four of them are personal Gmail/Outlook addresses shown on the startup's own site (owner decision: allowed; flagged "personal address" in the JSON).
- `outreach-campaign-producthunt.csv` (50 rows): the subset from recent Product Hunt launches. **Suggested first batch.** The other 357 rows are older imported listings (dated 2024-01-01) that are mostly established venture-backed companies (for example Qualtrics, 1Password, Anduril), some of them large. Go through those before you send to them.
- `outreach-review.csv` (102 rows, with a reason column): not for pasting as is. 79 sites now redirect to another domain (rebrand or acquisition, e.g. TripActions to Navan), 21 addresses are on a different domain from the site (could be an agency, law firm or investor), and 2 are developer addresses from app-store listings.

## How to set it up (wp-admin → 100xFounder → Founder outreach)

1. **Settings tab:** leave "Send campaign emails" off and "Dry run" on. Sending is blocked anyway until the postal address is set in 100xFounder → Settings.
2. **Templates tab → New template:** name `Listing update + Instagram feature`, offer `Featured listing`, then paste the subject and body below.
3. **Campaigns tab → New campaign:** pick that template and give it the name `Listing update + Instagram feature`.
4. **Add recipients:** paste `outreach-campaign-producthunt.csv` first (or `outreach-campaign.csv` once you've checked it). The box reads `email, first name, startup, article URL`, and it has no listing-URL column, so the CSV puts each **listing URL in the article URL column**. That's why the body uses `{article_url}`, not `{listing_url}`.
5. **Preview** the first email, then check the rows before you start the campaign. With the 30-a-day cap, 407 emails take about two weeks.

## Subject

```
{startup} is listed on 100xFounder: please check the details
```

## Body

```
Hi {first_name},

I'm writing from 100xFounder ({site_url}), a site that covers new startups and AI tools, mostly for readers in India.

We've added {startup} to our startup directory:
{article_url}

The page is based on your public launch information, and the link to your website is a nofollow link. Could you take a look and let us know if anything is wrong or out of date, especially the description and pricing? Just reply with the changes and we'll update the page. If you'd rather not be listed, tell us and we'll take the page down.

We also feature founders and products on our Instagram, @100x.founder (https://www.instagram.com/100x.founder/). If you'd like {startup} to be considered, reply with a short note about what you're building. Our editors review every feature, so we can't promise one.

Separately, we offer paid featured listings in the directory, clearly marked as featured. If you're interested, reply and we'll send the price. We bill by invoice. It's optional, and your basic listing stays as it is either way.

We can't promise rankings or a set amount of traffic.

{signature}
```

Every merge tag used (`first_name`, `startup`, `article_url`, `site_url`, `signature`) is in `XF_CAMP_TAGS`. An empty first name becomes "there". The plugin adds the compliance footer to every email automatically: why the recipient is getting it, the postal address, a one-click unsubscribe link and the List-Unsubscribe headers.

## Before anything is sent (owner)

- Set the postal address and the SMTP mailbox in 100xFounder → Settings. Without them, live sending is blocked.
- Confirm you're happy to remove a listing when a founder asks (the email offers it), and have the featured-listing price ready for replies.
- Check the Instagram handle and the wording above.
- Spot-check `_founder-contacts.json`. The founder names are Product Hunt makers, and their founder roles weren't separately verified. Founder names exist only for the 105 recent Product Hunt launches; older listings have none, so those emails open with "Hi there".
- 215 startups have only a contact form (`status: contact_form`). Contact them by hand, or skip them.
- 626 have no published contact (`status: nothing`). 40 are big-company launches or now redirect to one (Google, Microsoft, Anthropic, IBM, NVIDIA and others) and are skipped (`status: skipped_big_company`). 3 share an address already used by another listing (`status: email_duplicate`).
- Keep the daily cap low (30, shared with the founder sequence), and turn off dry run only after a preview looks right.
