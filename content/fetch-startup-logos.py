#!/usr/bin/env python3
"""Give every startup listing the company's own logo instead of a lettered tile.

    XF_SITE_URL=… XF_WP_USER=… XF_WP_APP_PASSWORD='…' python3 content/fetch-startup-logos.py [--limit N] [--dry-run]

The logo comes from the company's own website: the apple-touch-icon it publishes
for phone home screens (usually 180px and transparent), then its <link rel=icon>,
then its og:image. Nothing is scraped — these are the icons a site publishes for
exactly this purpose. Each one is uploaded to our media library and set as the
listing's featured image, so we serve it ourselves and it survives the company
redesigning its site.

Listings that already have a featured image are left alone, so this is safe to
re-run as new startups come in.
"""
import argparse
import base64
import html
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

UA = "100xFounderBot/1.0 (+https://100xfounder.com)"
# Links on our own listing pages that are never the company's own site.
NOT_THE_COMPANY = ("100xfounder.com", "producthunt.com", "instagram.com", "w.org",
                   "schema.org", "googlesyndication.com", "google.com", "gmpg.org",
                   "twitter.com", "x.com", "linkedin.com", "youtube.com")
OK_TYPES = ("image/png", "image/jpeg", "image/jpg", "image/webp", "image/x-icon",
            "image/vnd.microsoft.icon", "image/gif")
# Where a listing points at a platform rather than the company's own site, the
# icon we would find is the platform's logo. Better a lettered tile than
# GitHub's mark standing in for somebody's product.
PLATFORMS = ("github.com", "gitlab.com", "apple.com", "microsoft.com", "google.com",
             "mozilla.org", "itch.io", "gumroad.com", "notion.so", "notion.site",
             "figma.com", "replit.com", "producthunt.com")


def image_size(body):
    """Pixel size from the file header, so a wide banner can be told from a logo."""
    try:
        if body[:8] == b"\x89PNG\r\n\x1a\n":
            return int.from_bytes(body[16:20], "big"), int.from_bytes(body[20:24], "big")
        if body[:3] == b"GIF":
            return int.from_bytes(body[6:8], "little"), int.from_bytes(body[8:10], "little")
        if body[:4] == b"RIFF" and body[8:12] == b"WEBP":
            if body[12:16] == b"VP8X":
                return (int.from_bytes(body[24:27], "little") + 1,
                        int.from_bytes(body[27:30], "little") + 1)
            if body[12:16] == b"VP8 ":
                return (int.from_bytes(body[26:28], "little") & 0x3FFF,
                        int.from_bytes(body[28:30], "little") & 0x3FFF)
            return None
        if body[:2] == b"\xff\xd8":
            i = 2
            while i + 9 < len(body):
                if body[i] != 0xFF:
                    i += 1
                    continue
                marker, length = body[i + 1], int.from_bytes(body[i + 2:i + 4], "big")
                if 0xC0 <= marker <= 0xCF and marker not in (0xC4, 0xC8, 0xCC):
                    return int.from_bytes(body[i + 7:i + 9], "big"), int.from_bytes(body[i + 5:i + 7], "big")
                i += 2 + length
    except Exception:  # noqa: BLE001 - an unreadable header just means "unknown"
        pass
    return None


def get(url, timeout=20, limit=700_000):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read(limit), r.headers.get("Content-Type", ""), r.geturl()


def api(site, auth, method, path, body=None, raw=None, headers=None):
    h = {"Authorization": auth, "User-Agent": UA}
    h.update(headers or {})
    data = raw
    if body is not None:
        data = json.dumps(body).encode()
        h["Content-Type"] = "application/json"
    req = urllib.request.Request(site + "/wp-json" + path, data=data, method=method, headers=h)
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode() or "{}")


def company_site(listing_url):
    """The company's own website, as linked from our listing page."""
    try:
        page = get(listing_url)[0].decode("utf-8", "replace")
    except Exception:  # noqa: BLE001
        return ""
    # The "Visit <name>" button is the only link that is surely the company's own site.
    m = re.search(r'<a\b[^>]*href=["\'](https?://[^"\']+)["\'][^>]*>\s*Visit ', page)
    url = html.unescape(m.group(1)) if m else ""
    host = (urllib.parse.urlparse(url).hostname or "").lower()
    return url if host and not any(host == b or host.endswith("." + b) for b in NOT_THE_COMPANY) else ""


def icon_candidates(site_url):
    """Icons a site publishes about itself, best first."""
    try:
        body, _, final = get(site_url)
        page = body.decode("utf-8", "replace")
    except Exception:  # noqa: BLE001
        return []
    found = []  # (rank, size, url)
    for m in re.finditer(r"<link\b[^>]*>", page, re.I):
        tag = m.group(0)
        rel = (re.search(r'rel=["\']([^"\']+)', tag, re.I) or [None, ""])[1].lower()
        href = (re.search(r'href=["\']([^"\']+)', tag, re.I) or [None, ""])[1]
        if not href or "icon" not in rel:
            continue
        sizes = re.search(r'sizes=["\'](\d+)', tag, re.I)
        px = int(sizes.group(1)) if sizes else (180 if "apple" in rel else 32)
        # An Apple touch icon is made to be shown large; a favicon is not.
        found.append((0 if "apple" in rel else 1, -px, urllib.parse.urljoin(final, html.unescape(href))))
    for prop in ("og:image", "twitter:image"):
        m = re.search(r'<meta[^>]+(?:property|name)=["\']%s["\'][^>]+content=["\']([^"\']+)' % prop, page, re.I)
        if m:
            found.append((2, 0, urllib.parse.urljoin(final, html.unescape(m.group(1)))))
    found.append((3, 0, urllib.parse.urljoin(final, "/favicon.ico")))
    seen, out = set(), []
    for _, _, url in sorted(found):
        if url not in seen:
            seen.add(url)
            out.append(url)
    return out


def to_png(body, svg):
    """SVG (longest side 256px, aspect kept) or ICO converted to PNG with macOS sips; b"" if it fails."""
    with tempfile.TemporaryDirectory() as d:
        src, out = os.path.join(d, "in.svg" if svg else "in.ico"), os.path.join(d, "out.png")
        open(src, "wb").write(body)
        cmd = ["sips", "-s", "format", "png"] + (["-Z", "256"] if svg else []) + [src, "--out", out]
        if subprocess.run(cmd, capture_output=True).returncode or not os.path.exists(out):
            return b""
        return open(out, "rb").read()


def fetch_icon(urls):
    """The first candidate that is really an image file worth uploading."""
    for url in urls:
        try:
            body, ctype, final = get(url, timeout=15, limit=3_000_000)
        except Exception:  # noqa: BLE001
            continue
        ctype = ctype.split(";")[0].strip().lower()
        if ctype == "image/svg+xml" or url.lower().split("?")[0].endswith(".svg") or ctype.endswith("icon"):
            body, ctype = to_png(body, svg=not ctype.endswith("icon")), "image/png"  # WordPress takes neither SVG nor .ico
            if not body:
                continue
        if ctype not in OK_TYPES or len(body) < 700:
            continue
        size = image_size(body)
        if size:
            w, h = size
            # A logo is square-ish and big enough to show at 80px; a 1200x630
            # share banner is neither.
            if min(w, h) < 48 or not 0.7 <= w / max(h, 1) <= 1.45:
                continue
        ext = {"image/png": "png", "image/jpeg": "jpg", "image/jpg": "jpg",
               "image/webp": "webp", "image/gif": "gif"}[ctype]
        return body, ctype, ext, final
    return None


def slugify(s):
    return re.sub(r"-+", "-", re.sub(r"[^a-z0-9]+", "-", s.lower())).strip("-") or "logo"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--limit", type=int, default=100)
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()

    site = os.environ.get("XF_SITE_URL", "https://100xfounder.com").rstrip("/")
    user, pw = os.environ.get("XF_WP_USER", ""), os.environ.get("XF_WP_APP_PASSWORD", "")
    if not (user and pw) and not a.dry_run:
        sys.exit("Set XF_WP_USER and XF_WP_APP_PASSWORD (or pass --dry-run).")
    auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()

    listings, page = [], 1
    while True:
        try:
            batch = json.loads(get(
                f"{site}/wp-json/wp/v2/xf_startup?per_page=100&page={page}&_fields=id,slug,link,title,featured_media",
                limit=4_000_000,
            )[0].decode())
        except urllib.error.HTTPError:  # past the last page
            break
        listings += batch
        if len(batch) < 100:
            break
        page += 1
    todo = [p for p in listings if not p.get("featured_media")][: a.limit]
    print(f"{len(listings)} startups, {len(todo)} without a logo\n")

    done = 0
    for p in todo:
        name = html.unescape(p["title"]["rendered"])
        web = company_site(p["link"])
        if not web:
            print(f"  skip  {name[:26]:<26} no website linked")
            continue
        host = (urllib.parse.urlparse(web).hostname or "").lower()
        if any(host == b or host.endswith("." + b) for b in PLATFORMS):
            print(f"  skip  {name[:26]:<26} listed on {host}, not its own site")
            continue
        icon = fetch_icon(icon_candidates(web))
        if not icon:
            print(f"  skip  {name[:26]:<26} no usable icon at {host}")
            continue
        body, ctype, ext, src = icon
        if a.dry_run:
            print(f"  would {name[:26]:<26} {len(body) // 1024:>4}KB  {src[:64]}")
            continue
        try:
            media = api(site, auth, "POST", "/wp/v2/media", raw=body, headers={
                "Content-Type": ctype,
                "Content-Disposition": f'attachment; filename="{slugify(name)}-logo.{ext}"',
            })
            api(site, auth, "POST", f"/wp/v2/media/{media['id']}", {
                "alt_text": f"{name} logo",
                "caption": f"Logo published by {host}",
            })
            api(site, auth, "POST", f"/wp/v2/xf_startup/{p['id']}", {"featured_media": media["id"]})
        except urllib.error.HTTPError as err:
            print(f"  FAIL  {name[:26]:<26} {err.code} {err.read().decode()[:120]}")
            continue
        done += 1
        print(f"  ok    {name[:26]:<26} {host}")
        time.sleep(1)

    print(f"\n{done} logos set." if not a.dry_run else "\nDry run; nothing uploaded.")


if __name__ == "__main__":
    main()
