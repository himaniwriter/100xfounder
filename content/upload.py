#!/usr/bin/env python3
"""Upload the researched articles in content/drafts/ to WordPress, scheduled a few per day.

    XF_SITE_URL=https://100xfounder.com XF_WP_USER=claude XF_WP_APP_PASSWORD='xxxx xxxx …' \
        python3 content/upload.py [--per-day 4] [--start 2026-10-05] [--dry-run] [files…]

- Each JSON payload goes to POST /wp-json/xf/v1/drafts (the plugin sideloads its images).
- With Settings → Claude (MCP) → "Allow publishing through MCP" on and a user who may publish,
  posts are scheduled across the day in IST (up to 10 slots, --per-day N); otherwise
  they land as Pending review.
- content/uploaded.json records what went up per site, so re-runs skip those files.
Credentials come only from the environment. Never put them in this repo.
"""
import argparse
import base64
import datetime as dt
import glob
import json
import os
import sys
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.path.join(HERE, "uploaded.json")
# Ten slots spread over the day; --per-day N uses the first N in this spread order.
SLOTS_IST = ["07:00", "14:00", "10:30", "17:30", "21:00", "08:45", "12:15", "15:45", "19:15", "22:30"]
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))


def schedule(n, per_day, start):
    slots, day = [], start
    while len(slots) < n:
        for t in SLOTS_IST[:per_day]:
            h, m = map(int, t.split(":"))
            slots.append(dt.datetime(day.year, day.month, day.day, h, m, tzinfo=IST))
        slots[-min(per_day, len(SLOTS_IST)):] = sorted(slots[-min(per_day, len(SLOTS_IST)):])
        day += dt.timedelta(days=1)
    return slots[:n]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--per-day", type=int, default=10)
    ap.add_argument("--start", default=(dt.date.today() + dt.timedelta(days=1)).isoformat())
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    site = os.environ.get("XF_SITE_URL", "").rstrip("/")
    user, pw = os.environ.get("XF_WP_USER", ""), os.environ.get("XF_WP_APP_PASSWORD", "")
    if not (site and user and pw) and not a.dry_run:
        sys.exit("Set XF_SITE_URL, XF_WP_USER and XF_WP_APP_PASSWORD.")
    ledger = json.load(open(LEDGER)) if os.path.exists(LEDGER) else {}
    done = ledger.setdefault(site or "dry-run", {})

    files = a.files or sorted(glob.glob(os.path.join(HERE, "drafts", "*.json")))
    todo = [f for f in files if os.path.basename(f) not in done]
    # Interleave categories so one day isn't all apply guides.
    payloads = [(f, json.load(open(f))) for f in todo]
    by_cat = {}
    for f, p in payloads:
        by_cat.setdefault(p.get("category") or p.get("type"), []).append((f, p))
    order = []
    while any(by_cat.values()):
        for k in list(by_cat):
            if by_cat[k]:
                order.append(by_cat[k].pop(0))
    when = schedule(len(order), a.per_day, dt.date.fromisoformat(a.start))

    auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()
    for (f, p), t in zip(order, when):
        p["publish_at"] = t.isoformat()
        name = os.path.basename(f)
        if a.dry_run:
            print(f"{t:%a %d %b %H:%M} IST  {p.get('category', ''):15} {p['title']}")
            continue
        req = urllib.request.Request(site + "/wp-json/xf/v1/drafts", data=json.dumps(p).encode(), method="POST",
                                     headers={"Authorization": auth, "Content-Type": "application/json", "User-Agent": "100xfounder-upload/1.0"})
        try:
            with urllib.request.urlopen(req, timeout=300) as r:
                res = json.loads(r.read().decode())
        except urllib.error.HTTPError as e:
            print(f"FAIL {name}: {e.code} {e.read().decode()[:300]}")
            continue
        done[name] = {"id": res.get("id"), "status": res.get("status"), "url": res.get("url"), "publish_at": p["publish_at"]}
        json.dump(ledger, open(LEDGER, "w"), indent=1)
        print(f"{res.get('status'):8} {t:%d %b %H:%M}  {p['title']}  → {res.get('url')}")


if __name__ == "__main__":
    main()
