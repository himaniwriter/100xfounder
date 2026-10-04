#!/usr/bin/env python3
"""Import researched events (content/research/india-events.json) into the live site.

    XF_SITE_URL=… XF_WP_USER=… XF_WP_APP_PASSWORD='…' python3 content/import-events.py [--publish N] [--dry-run]

Each event goes through the plugin's own /xf/v1/drafts endpoint as an xf_event, so it
lands as Pending for review like a feed import does. Events whose title and date already
exist on the site are skipped, so this is safe to re-run. The organiser's og:image is
fetched from their registration page and stored as a URL (never copied), the same way
the feed importer does it.
"""
import argparse
import base64
import datetime as dt
import html
import json
import os
import re
import sys
import time
import urllib.error
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "100xFounderBot/1.0 (+https://100xfounder.com)"
IST = dt.timezone(dt.timedelta(hours=5, minutes=30))


def api(site, auth, method, path, body=None):
    req = urllib.request.Request(
        site + "/wp-json" + path,
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"Authorization": auth, "Content-Type": "application/json", "User-Agent": UA},
    )
    with urllib.request.urlopen(req, timeout=180) as r:
        return json.loads(r.read().decode() or "{}")


def og_image(url):
    """The organiser's own share image, as published on their page."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": UA})
        with urllib.request.urlopen(req, timeout=25) as r:
            page = r.read(600_000).decode("utf-8", "replace")
    except Exception:  # noqa: BLE001 - a missing image must never block the import
        return ""
    for prop in ("og:image:secure_url", "og:image", "twitter:image"):
        for pattern in (
            r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]+content=["\']([^"\']+)' % re.escape(prop),
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+(?:property|name)=["\']%s["\']' % re.escape(prop),
        ):
            m = re.search(pattern, page, re.I)
            if m:
                img = html.unescape(m.group(1))
                if img.startswith("//"):
                    img = "https:" + img
                if img.startswith("http"):
                    return img
    return ""


def to_utc(iso):
    """'2026-10-18T10:00:00+05:30' -> '2026-10-18 04:30:00' (what the plugin stores)."""
    if not iso:
        return ""
    try:
        t = dt.datetime.fromisoformat(iso)
    except ValueError:
        return ""
    if t.tzinfo is None:
        t = t.replace(tzinfo=IST)
    return t.astimezone(dt.timezone.utc).strftime("%Y-%m-%d %H:%M:%S")


def norm(title):
    return re.sub(r"[^a-z0-9]+", " ", html.unescape(title).lower()).strip()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--file", default=os.path.join(HERE, "research", "india-events.json"))
    ap.add_argument("--publish", type=int, default=0, help="publish the N soonest after importing")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    site = os.environ.get("XF_SITE_URL", "").rstrip("/")
    user, pw = os.environ.get("XF_WP_USER", ""), os.environ.get("XF_WP_APP_PASSWORD", "")
    if not (site and user and pw) and not a.dry_run:
        sys.exit("Set XF_SITE_URL, XF_WP_USER and XF_WP_APP_PASSWORD.")
    auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()
    events = json.load(open(a.file))

    existing = set()
    if not a.dry_run:
        for status in ("publish", "pending", "draft", "future"):
            try:
                for p in api(site, auth, "GET", f"/wp/v2/xf_event?per_page=100&status={status}"):
                    existing.add(norm(p["title"]["rendered"]))
            except Exception:  # noqa: BLE001
                pass

    made = []
    for e in events:
        if norm(e["title"]) in existing:
            print(f"  skip (already on site): {e['title'][:58]}")
            continue
        start = to_utc(e.get("start", ""))
        if not start:
            print(f"  skip (no usable date): {e['title'][:58]}")
            continue
        body = {
            "type": "xf_event",
            "title": e["title"],
            "excerpt": e.get("description", "")[:160],
            "content": "<p>" + html.escape(e.get("description", "")) + "</p>",
            "fields": {
                "start": start,
                "end": to_utc(e.get("end", "")),
                "venue": e.get("venue", ""),
                "city": e.get("city", ""),
                "url": e.get("url", ""),
                "organizer": e.get("organiser", ""),
                "kind": e.get("type", ""),
                "price": e.get("price", ""),
                "image": og_image(e["url"]) if e.get("url") else "",
            },
        }
        if a.dry_run:
            print(f"  would add [{e['city']}] {e['title'][:52]}")
            continue
        try:
            res = api(site, auth, "POST", "/xf/v1/drafts", body)
        except urllib.error.HTTPError as err:
            print(f"  FAIL {e['title'][:48]}: {err.code} {err.read().decode()[:160]}")
            continue
        made.append((res["id"], e["city"], e["title"], start))
        print(f"  added [{e['city']}] {e['title'][:52]}")
        time.sleep(1)

    print(f"\n{len(made)} imported as Pending.")
    if a.publish and made:
        for pid, city, title, _ in sorted(made, key=lambda x: x[3])[: a.publish]:
            r = api(site, auth, "POST", f"/wp/v2/xf_event/{pid}", {"status": "publish"})
            print(f"  published [{city}] {title[:46]} → {r['link']}")


if __name__ == "__main__":
    main()
