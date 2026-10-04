#!/usr/bin/env python3
"""Schedule the researched articles on a live site using only WordPress's built-in REST API.

Use this when the site runs a plugin version whose /xf/v1/drafts endpoint can't take images or
publish_at (before the 2026-10-04 release is deployed). The article itself still goes through
/xf/v1/drafts, so its sources are stored for the review checklist and NewsArticle citations; then
this script uploads the images to the media library itself, inserts the credited figures, sets the
slug and featured image, and schedules the post.

    XF_SITE_URL=https://100xfounder.com XF_WP_USER=… XF_WP_APP_PASSWORD='…' \
        python3 content/upload_rest.py [--per-day 10] [--start 2026-10-05] [--limit N] [files…]

Credentials only from the environment. Shares content/uploaded.json with upload.py.
"""
import argparse
import base64
import datetime as dt
import glob
import html
import json
import mimetypes
import os
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from upload import LEDGER, schedule  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
UA = "100xfounder-upload/1.0 (https://100xfounder.com)"
CATEGORY_NAMES = {"careers-salary": "Careers & Salary", "global": "Global", "francais": "Français", "deutsch": "Deutsch"}
REST_BASE = {"post": "posts", "xf_guide": "xf_guide"}
# Google's "How was this created?" question: say so plainly on every article.
DISCLOSURE = ('<p class="xf-disclosure"><em>How this article was made: researched and drafted with AI assistance by the '
              '100xFounder editorial desk, using only the sources listed in it; every figure links to its source. '
              'Read our <a href="/editorial-policy/">editorial policy</a>, or report an error through our '
              '<a href="/corrections-policy/">corrections policy</a>.</em></p>')


class Site:
    def __init__(self, url, user, pw):
        self.url = url.rstrip("/")
        self.auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()

    def call(self, method, path, body=None, raw=None, headers=None):
        h = {"Authorization": self.auth, "User-Agent": UA}
        data = None
        if raw is not None:
            data = raw
            h.update(headers or {})
        elif body is not None:
            data = json.dumps(body).encode()
            h["Content-Type"] = "application/json"
        req = urllib.request.Request(self.url + "/wp-json" + path, data=data, method=method, headers=h)
        with urllib.request.urlopen(req, timeout=180) as r:
            return json.loads(r.read().decode() or "{}")


def fetch_image(url):
    """Download politely; Wikimedia answers 429 when hurried."""
    for attempt in range(5):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                return r.read(), r.headers.get("Content-Type", "").split(";")[0]
        except urllib.error.HTTPError as e:
            if e.code == 429:
                time.sleep(10 * (attempt + 1))
                continue
            raise
    raise RuntimeError("rate-limited: " + url)


def upload_image(site, img, title):
    data, ctype = fetch_image(img["url"])
    if not ctype.startswith("image/"):
        raise RuntimeError("not an image: " + img["url"])
    ext = mimetypes.guess_extension(ctype) or ".jpg"
    ext = ".jpg" if ext in (".jpe", ".jfif") else ext
    name = re.sub(r"[^a-z0-9]+", "-", (img.get("alt") or title).lower()).strip("-")[:70] + ext
    media = site.call("POST", "/wp/v2/media", raw=data, headers={"Content-Type": ctype, "Content-Disposition": f'attachment; filename="{name}"'})
    site.call("POST", f"/wp/v2/media/{media['id']}", {"alt_text": img.get("alt", ""), "caption": img.get("credit", ""), "description": img.get("source_page", "")})
    sizes = (media.get("media_details") or {}).get("sizes") or {}
    src = (sizes.get("large") or sizes.get("full") or {}).get("source_url") or media["source_url"]
    return media["id"], src


def figure(src, img):
    credit = html.escape(img.get("credit", ""))
    if img.get("source_page"):
        credit = f'<a href="{html.escape(img["source_page"])}" rel="nofollow noopener" target="_blank">{credit}</a>'
    cap = html.escape(img.get("caption", ""))
    sep = " · " if cap and credit else ""
    return f'<figure class="xf-figure"><img src="{html.escape(src)}" alt="{html.escape(img.get("alt", ""))}" loading="lazy">' \
           f'<figcaption>{cap}{sep}{credit}</figcaption></figure>'


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="*")
    ap.add_argument("--per-day", type=int, default=10)
    ap.add_argument("--start", default=(dt.date.today() + dt.timedelta(days=1)).isoformat())
    ap.add_argument("--limit", type=int, default=0)
    ap.add_argument("--pause", type=float, default=15)
    a = ap.parse_args()
    site_url, user, pw = (os.environ.get(k, "") for k in ("XF_SITE_URL", "XF_WP_USER", "XF_WP_APP_PASSWORD"))
    if not (site_url and user and pw):
        sys.exit("Set XF_SITE_URL, XF_WP_USER and XF_WP_APP_PASSWORD.")
    site = Site(site_url, user, pw)
    ledger = json.load(open(LEDGER)) if os.path.exists(LEDGER) else {}
    done = ledger.setdefault(site.url, {})

    # Categories the drafts need but the live site may not have yet.
    have = {c["slug"] for c in site.call("GET", "/wp/v2/categories?per_page=100")}
    for slug, name in CATEGORY_NAMES.items():
        if slug not in have:
            site.call("POST", "/wp/v2/categories", {"name": name, "slug": slug})
            print("created category", slug)

    files = a.files or sorted(glob.glob(os.path.join(HERE, "drafts", "*.json")))
    todo = [(f, json.load(open(f))) for f in files if os.path.basename(f) not in done]
    by_cat = {}
    for f, p in todo:
        by_cat.setdefault(p.get("category") or p.get("type"), []).append((f, p))
    order = []
    while any(by_cat.values()):
        for k in list(by_cat):
            if by_cat[k]:
                order.append(by_cat[k].pop(0))
    if a.limit:
        order = order[: a.limit]
    # Continue the schedule after anything already scheduled on this site.
    taken = sorted(v["publish_at"] for v in done.values() if v.get("publish_at"))
    start = dt.date.fromisoformat(a.start)
    if taken:
        last = dt.datetime.fromisoformat(taken[-1]).date()
        per_day_used = sum(1 for t in taken if dt.datetime.fromisoformat(t).date() == last)
        start = max(start, last + dt.timedelta(days=1 if per_day_used >= a.per_day else 0))
    slots = [s for s in schedule(len(order) + len(taken) + a.per_day, a.per_day, start) if s.isoformat() not in taken][: len(order)]

    for (f, p), when in zip(order, slots):
        name = os.path.basename(f)
        try:
            images = p.pop("images", [])
            draft = site.call("POST", "/xf/v1/drafts", p)
            pid = draft["id"]
            content, featured = p["content"], 0
            for i, img in enumerate(images, start=1):
                marker = f"<!-- xf-image-{i} -->"
                try:
                    mid, src = upload_image(site, img, p["title"])
                except Exception as e:  # noqa: BLE001 - one bad image shouldn't sink the article
                    print(f"   image {i} skipped: {e}")
                    content = content.replace(marker, "")
                    continue
                if i == 1:
                    featured = mid
                    content += f'<p class="xf-image-credit">Featured image: {figure(src, img).split("<figcaption>")[1].split("</figcaption>")[0]}</p>'
                else:
                    content = content.replace(marker, figure(src, img)) if marker in content else content + figure(src, img)
                time.sleep(2)
            content = re.sub(r"<!-- xf-image-\d+ -->", "", content)
            if "xf-disclosure" not in content:
                content += DISCLOSURE
            upd = {"content": content, "status": "future" if when > dt.datetime.now(dt.timezone.utc) else "publish",
                   "date_gmt": when.astimezone(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")}
            if p.get("slug"):
                upd["slug"] = p["slug"]
            if featured:
                upd["featured_media"] = featured
            res = site.call("POST", f"/wp/v2/{REST_BASE.get(p.get('type', 'post'), 'posts')}/{pid}", upd)
        except urllib.error.HTTPError as e:
            print(f"FAIL {name}: {e.code} {e.read().decode()[:300]}")
            continue
        done[name] = {"id": pid, "status": res.get("status"), "url": res.get("link"), "publish_at": when.isoformat()}
        json.dump(ledger, open(LEDGER, "w"), indent=1)
        print(f"{res.get('status'):8} {when:%a %d %b %H:%M} IST  {p['title']}  → {res.get('link')}", flush=True)
        time.sleep(a.pause)


if __name__ == "__main__":
    main()
