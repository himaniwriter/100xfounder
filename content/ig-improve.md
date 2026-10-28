# Instagram "Improve…" requests: Claude Code routine

The owner types instructions on queue items in **100xFounder → Instagram → Queue → Improve…**
(for example "punchier hook with the funding number on slide 1" or "shorter slide 3"). This routine
handles them first, every 30 minutes. Requests still pending after the fallback delay (Settings tab,
default 120 minutes) go to the budget-guarded Claude API instead, so finish what you claim.

## 1. Load credentials (never print them)

```bash
export XF_SITE_URL=https://100xfounder.com XF_WP_USER=author XF_WP_APP_PASSWORD="$(security find-generic-password -s 100xfounder-wp -w)"
```

The routes are admin-only (manage_options): the Application Password must belong to an administrator.
Never echo the password, put it in a URL, or write it to a file. Use `curl -u "$XF_WP_USER:$XF_WP_APP_PASSWORD"`.

## 2. Fetch pending requests

```bash
curl -s -u "$XF_WP_USER:$XF_WP_APP_PASSWORD" "$XF_SITE_URL/wp-json/xf/v1/ig/improve?status=pending"
```

An empty list (`[]`) means nothing to do: **stop**.

Each request has `id`, `instruction`, and `item` with `kind`, `caption`, `slides`, `editable`
(every field you may change, with its `max` length and current `value`), `image_options`,
`source_url` and `source_text`, plus `rules` and `patch_format`.

## 3. For each request

1. Claim it: `POST $XF_SITE_URL/wp-json/xf/v1/ig/improve/{id}/claim`. A 409 means someone else has it: skip.
2. Read the facts. Use `item.source_text`; if you need more, open `item.source_url` (our article or listing).
3. Write the improved texts for exactly what the instruction asks.
4. Complete it:

```bash
curl -s -u "$XF_WP_USER:$XF_WP_APP_PASSWORD" -H 'Content-Type: application/json' \
  -X POST "$XF_SITE_URL/wp-json/xf/v1/ig/improve/{id}/complete" \
  -d '{"payload_patch":[{"slide":0,"field":"headline","value":"..."}],"caption":null,"note":"Hook now leads with the round size"}'
```

- `payload_patch`: a list of `{slide, field, value}` using only fields from `item.editable`.
  List fields are addressed as `items.1` or `lines.0`. `image` takes an index into
  `item.image_options`, or -1 for no image.
- `caption`: the full new caption, or `null` to keep it (max 2,200 characters, 30 hashtags).
- Daily digest and spotlight items have no slide fields: change only the caption.
- A 400 reply lists every problem (unknown field, too long, HTML, a number that isn't in the
  source data, a banned name). Fix it and POST complete again; the request stays claimed.
  Claims not completed within an hour go back to pending.

The owner then sees "Improved by Claude Code" with Before and After, and accepts or reverts it.
Approval and founder consent on the item are never changed by an improvement.

## Rules (the API fallback follows the same ones)

- Facts come only from the item's existing slide texts, caption and source (the linked article or
  listing). Never invent numbers, names, quotes, funding, prices or claims. The server rejects any
  number that isn't already in the item or its source.
- Never mention Digihandler or Lovish Madaan.
- On brand: short, punchy, plain English. No clickbait the facts don't back, no emojis on slides.
- Plain text only: no HTML, markdown or URLs in slide texts.
- Founder quotes stay the founder's words (quote slides aren't editable).
- Change only what the instruction asks for.

## 4. Stop

When the pending list is empty, stop. Report how many requests you completed and any you skipped.
