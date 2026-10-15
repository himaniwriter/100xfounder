#!/usr/bin/env python3
"""Re-time every scheduled post onto the current publishing pattern.

    XF_SITE_URL=… XF_WP_USER=… XF_WP_APP_PASSWORD='…' python3 content/reschedule.py [--per-day 4] [--dry-run]

Takes the posts that are still scheduled ("future") on the site, keeps their
order, and gives them new times from upload.py's schedule (four a day at
random times since 6 Oct 2026), starting with today's remaining slots.

Breaking news jumps the queue: pass part of a draft's file name to --first
(e.g. --first moneyview --first world-labs) and it goes out before the
evergreen guides, because a funding round is only news for a day or two.
Starts tomorrow unless --today is given, so a day that has already had its
share of posts is not topped up.
"""
import argparse
import base64
import datetime as dt
import json
import os
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from upload import LEDGER, schedule  # noqa: E402

UA = "100xFounderBot/1.0 (+https://100xfounder.com)"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--per-day", type=int, default=4)
    ap.add_argument("--first", action="append", default=[], help="part of a file name to publish first")
    ap.add_argument("--today", action="store_true", help="use today's remaining slots too")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    site = os.environ.get("XF_SITE_URL", "https://100xfounder.com").rstrip("/")
    user, pw = os.environ.get("XF_WP_USER", ""), os.environ.get("XF_WP_APP_PASSWORD", "")
    if not (user and pw):
        sys.exit("Set XF_WP_USER and XF_WP_APP_PASSWORD.")
    auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()

    def call(method, path, body=None):
        req = urllib.request.Request(site + "/wp-json" + path, method=method,
                                     data=json.dumps(body).encode() if body is not None else None,
                                     headers={"Authorization": auth, "User-Agent": UA, "Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=120) as r:
            return json.loads(r.read().decode() or "{}")

    ledger = json.load(open(LEDGER))
    done = ledger.get(site, {})
    now = dt.datetime.now(dt.timezone.utc)

    queue = []
    for fname, v in done.items():
        if v.get("status") != "future":
            continue
        route = "xf_guide" if "post_type=xf_guide" in v.get("url", "") else "posts"
        try:
            live = call("GET", f"/wp/v2/{route}/{v['id']}?context=edit&_fields=id,status,date_gmt,title")
        except Exception as err:  # noqa: BLE001
            print(f"  skip  {fname}: {err}")
            continue
        if live.get("status") != "future":
            v["status"] = live.get("status", v["status"])  # it went out already; keep the ledger honest
            continue
        queue.append({"file": fname, "route": route, "id": v["id"], "when": live["date_gmt"],
                      "urgent": any(k in fname for k in a.first), "title": live["title"]["raw"]})

    queue.sort(key=lambda q: (not q["urgent"], q["when"]))
    cutoff = now + dt.timedelta(minutes=20)
    today = now.astimezone(dt.timezone(dt.timedelta(hours=5, minutes=30))).date()
    first_day = today if a.today else today + dt.timedelta(days=1)
    slots = [s for s in schedule(len(queue) + a.per_day * 2, a.per_day, first_day) if s > cutoff][: len(queue)]

    print(f"{len(queue)} scheduled posts → {a.per_day} a day, last one {slots[-1].strftime('%a %d %b') if slots else '—'}\n")
    for q, when in zip(queue, slots):
        flag = "news " if q["urgent"] else "     "
        print(f"  {flag}{when.strftime('%a %d %b %H:%M')}  {q['title'][:70]}")
        if a.dry_run:
            continue
        call("POST", f"/wp/v2/{q['route']}/{q['id']}", {"date_gmt": when.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S"), "status": "future"})
        done[q["file"]]["publish_at"] = when.isoformat()

    if not a.dry_run:
        json.dump(ledger, open(LEDGER, "w"), indent=1)
        print("\nRescheduled and ledger updated.")
    else:
        print("\nDry run; nothing changed.")


if __name__ == "__main__":
    main()
