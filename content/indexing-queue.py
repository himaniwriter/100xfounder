#!/usr/bin/env python3
"""Which published pages still need a manual "Request indexing" in Search Console.

    python3 content/indexing-queue.py            # print the next URLs to request (newest first)
    python3 content/indexing-queue.py --mark URL [URL ...]   # record that they were requested
    python3 content/indexing-queue.py --status   # counts

Reads the live sitemaps (no login needed), compares them with
content/indexing-requested.json and prints what is left. Search Console allows
roughly ten indexing requests a day per property, so the list is capped
(--limit, default 8) and the routine spends the allowance on the pages that
matter most: new articles and guides first, then researched startup profiles,
then the rest. Jobs are not listed here: they go to Google through the
Indexing API (see CLAUDE.md), and events and tag pages are left to the sitemap.
"""
import argparse
import datetime as dt
import json
import os
import re
import sys
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
LEDGER = os.path.join(HERE, "indexing-requested.json")
SITE = "https://100xfounder.com"
UA = "100xFounderBot/1.0 (+https://100xfounder.com)"
# Highest value first. Each is a core sitemap that lists only indexable pages.
SITEMAPS = [
    ("article", "/wp-sitemap-posts-post-1.xml"),
    ("guide", "/wp-sitemap-posts-xf_guide-1.xml"),
    ("startup", "/wp-sitemap-posts-xf_startup-1.xml"),
    ("page", "/wp-sitemap-posts-page-1.xml"),
]


def load():
    try:
        return json.load(open(LEDGER))
    except (OSError, ValueError):
        return {}


def save(d):
    json.dump(d, open(LEDGER, "w"), indent=1, sort_keys=True)


def sitemap_urls(path):
    req = urllib.request.Request(SITE + path, headers={"User-Agent": UA})
    xml = urllib.request.urlopen(req, timeout=30).read().decode("utf-8", "replace")
    out = []
    for m in re.finditer(r"<url>\s*<loc>([^<]+)</loc>(?:\s*<lastmod>([^<]+)</lastmod>)?", xml):
        out.append((m.group(1), m.group(2) or ""))
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=8)
    ap.add_argument("--mark", nargs="+")
    ap.add_argument("--status", action="store_true")
    a = ap.parse_args()
    ledger = load()
    today = dt.date.today().isoformat()

    if a.mark:
        for u in a.mark:
            ledger[u] = {"requested": today}
        save(ledger)
        print(f"recorded {len(a.mark)}")
        return

    todo = []
    for kind, path in SITEMAPS:
        try:
            urls = sitemap_urls(path)
        except Exception as err:  # noqa: BLE001
            print(f"# could not read {path}: {err}", file=sys.stderr)
            continue
        # Newest first within a kind, so today's story is requested before last week's.
        for u, lastmod in sorted(urls, key=lambda x: x[1], reverse=True):
            if u in ledger or u.rstrip("/") == SITE:
                continue
            todo.append((kind, u))

    used_today = sum(1 for v in ledger.values() if v.get("requested") == today)
    room = max(0, a.limit - used_today)
    if a.status:
        print(f"requested so far: {len(ledger)}; today: {used_today}; waiting: {len(todo)}; room today: {room}")
        return
    for kind, u in todo[:room]:
        print(u)


if __name__ == "__main__":
    main()
