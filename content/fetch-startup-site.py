#!/usr/bin/env python3
"""Pull the readable text of a startup's official site (and its pricing page) for research.

    python3 content/fetch-startup-site.py poddle sellio …

Reads content/startups/_index.json (made by listing the site's startups) for each
slug's website, fetches the home page and any pricing/plans page it links to, and
writes content/startups/_dossier/<slug>-site.txt. Prints a compact version so the
researcher can read it without opening each site. Only public pages are fetched.
"""
import html
import json
import os
import re
import sys
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "startups", "_dossier")
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"


def get(url, limit=900_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html,*/*"})
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read(limit).decode("utf-8", "replace"), r.geturl()


def text_of(page):
    t = re.sub(r"<script.*?</script>|<style.*?</style>|<svg.*?</svg>|<noscript.*?</noscript>", "", page, flags=re.S)
    t = re.sub(r"<(br|/p|/div|/li|/h\d|/section|/tr)[^>]*>", "\n", t)
    t = html.unescape(re.sub(r"<[^>]+>", " ", t))
    t = re.sub(r"[ \t]+", " ", re.sub(r"\n\s*\n+", "\n", t)).strip()
    return t


def compact(slug, r, body):
    """Title, description, headings and price lines: what a profile is written from."""
    title = re.search(r"TITLE: (.*)", body)
    meta = re.search(r"META: (.*)", body)
    lines = [l.strip() for l in body.splitlines() if l.strip()]
    heads = [l for l in lines if 12 <= len(l) <= 90 and not re.search(r"[{};=<>]|cookie|©|privacy", l, re.I)][2:9]
    prices = [l[:150] for l in lines if re.search(r"[$€£₹]\s?\d|\bfree\b|per month|/mo|/month|per year|one-time|lifetime|no credit card|subscription", l, re.I)][:10]
    out = [f"## {slug} ({r['title']}) site: {r['site']}", f"title: {title.group(1) if title else ''}", f"meta: {meta.group(1) if meta else ''}"]
    if "NOT READABLE" in body:
        out.append(re.search(r"NOT READABLE.*", body).group(0))
    out.append("headings: " + " | ".join(heads))
    out.append("price/free lines: " + " | ".join(prices))
    return "\n".join(out) + "\n"


def main():
    slugs = sys.argv[1:]
    index = {r["slug"]: r for r in json.load(open(os.path.join(HERE, "startups", "_index.json")))}
    os.makedirs(OUT, exist_ok=True)
    for slug in slugs:
        r = index.get(slug)
        if not r or not r.get("site"):
            print(f"## {slug}: no website on file\n")
            continue
        chunks, final = [], r["site"]
        try:
            page, final = get(r["site"])
            meta = re.search(r'<meta[^>]+name=["\']description["\'][^>]+content=["\']([^"\']*)', page, re.I)
            title = re.search(r"<title[^>]*>([^<]*)", page, re.I)
            chunks.append(f"URL: {final}\nTITLE: {html.unescape(title.group(1)).strip() if title else ''}\nMETA: {html.unescape(meta.group(1)) if meta else ''}\n\n{text_of(page)[:6000]}")
            links = re.findall(r'href=["\']([^"\'#]+)["\']', page)
            pricing = next((urllib.parse.urljoin(final, l) for l in links if re.search(r"pric|plans|buy|download|app-store|pro\b", l, re.I) and urllib.parse.urlparse(urllib.parse.urljoin(final, l)).netloc == urllib.parse.urlparse(final).netloc), "")
            if pricing and pricing.rstrip("/") != final.rstrip("/"):
                try:
                    p2, f2 = get(pricing)
                    chunks.append(f"\n\n--- PRICING/PLANS PAGE {f2} ---\n{text_of(p2)[:3500]}")
                except Exception as e:  # noqa: BLE001
                    chunks.append(f"\n\n--- pricing page {pricing} not readable: {e}")
        except Exception as e:  # noqa: BLE001
            chunks.append(f"URL: {r['site']}\nNOT READABLE: {e}")
        body = "".join(chunks)
        open(os.path.join(OUT, f"{slug}-site.txt"), "w").write(body)
        print(compact(slug, r, body))


if __name__ == "__main__":
    main()
