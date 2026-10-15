#!/usr/bin/env python3
"""Publish one draft immediately, with its photos and rendered graphics.

    XF_WP_USER=… XF_WP_APP_PASSWORD='…' python3 content/publish-now.py content/drafts/<file>.json [--graphics semrush-graphics] [--draft]

For a piece the owner has approved to go out now, outside the daily queue.
Photos fill <!-- xf-image-N --> (image 1 becomes the featured image); graphics
rendered by render-graphics.py fill <!-- xf-graphic-NAME --> and are uploaded to
the media library, so the site serves them itself. --draft uploads without
publishing, for a preview.
"""
import argparse
import json
import os
import pathlib
import re
import sys
import time

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
from upload_rest import LEDGER, Site, figure, slug_without_year, upload_image  # noqa: E402

BRAND = HERE.parent / "wordpress/100xfounder/assets/brand"

DISCLOSURE = ('<p class="xf-disclosure"><em>How this article was made: researched and drafted with AI assistance by the '
              '100xFounder editorial desk from vendors\' own pricing and help pages, regulatory filings and published '
              'independent reviews, checked on the dates given in the text. Read our '
              '<a href="/editorial-policy/">editorial policy</a>, or report an error through our '
              '<a href="/corrections-policy/">corrections policy</a>.</em></p>')


def graphic_html(src, name, title):
    alt = name.replace("-", " ")
    return (f'<figure class="xf-figure xf-graphic"><img src="{src}" alt="{title}: {alt}" loading="lazy" width="1600" height="1000">'
            '<figcaption>Graphic: 100xFounder, from the figures in this article.</figcaption></figure>')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--graphics", default="")
    ap.add_argument("--draft", action="store_true")
    a = ap.parse_args()

    site = Site(os.environ.get("XF_SITE_URL", "https://100xfounder.com"), os.environ["XF_WP_USER"], os.environ["XF_WP_APP_PASSWORD"])
    p = json.load(open(a.file))
    images = p.pop("images", [])
    if p.get("slug"):
        p["slug"] = slug_without_year(p["slug"])
    if p.get("sources"):
        pid = site.call("POST", "/xf/v1/drafts", p)["id"]
    else:
        # The drafts route insists on sources (CLAUDE.md). An owner-approved
        # piece without them goes in through core instead.
        def term_id(tax, slug):
            hit = site.call("GET", f"/wp/v2/{tax}?slug={slug}&_fields=id")
            if hit:
                return hit[0]["id"]
            return site.call("POST", f"/wp/v2/{tax}", {"name": slug.replace("-", " ").title(), "slug": slug})["id"]
        pid = site.call("POST", "/wp/v2/posts", {
            "title": p["title"], "excerpt": p.get("excerpt", ""), "content": p["content"], "status": "draft",
            "slug": p.get("slug", ""), "categories": [term_id("categories", p["category"])] if p.get("category") else [],
            "tags": [term_id("tags", t) for t in p.get("tags", [])],
        })["id"]
    print("created", pid)

    content, featured = p["content"], 0
    for i, img in enumerate(images, start=1):
        mid, src = upload_image(site, img, p["title"])
        if i == 1:
            featured = mid
        else:
            content = content.replace(f"<!-- xf-image-{i} -->", figure(src, img))
        print(" photo", i, "ok")
        time.sleep(2)

    for name in re.findall(r"<!-- xf-graphic-([a-z0-9-]+) -->", content):
        path = BRAND / f"graphic-{name}.jpg"
        if not path.exists():
            content = content.replace(f"<!-- xf-graphic-{name} -->", "")
            print(" graphic", name, "missing, marker removed")
            continue
        media = site.call("POST", "/wp/v2/media", raw=path.read_bytes(), headers={
            "Content-Type": "image/jpeg", "Content-Disposition": f'attachment; filename="{p.get("slug", "post")}-{name}.jpg"'})
        site.call("POST", f"/wp/v2/media/{media['id']}", {"alt_text": f"{p['title']}: {name.replace('-', ' ')}"})
        content = content.replace(f"<!-- xf-graphic-{name} -->", graphic_html(media["source_url"], name, p["title"]))
        print(" graphic", name, "ok")

    content = re.sub(r"<!-- xf-(?:image|graphic)-[a-z0-9-]+ -->", "", content)
    if "xf-disclosure" not in content:
        content += DISCLOSURE
    upd = {"content": content, "status": "draft" if a.draft else "publish"}
    if p.get("slug"):
        upd["slug"] = p["slug"]
    if featured:
        upd["featured_media"] = featured
    res = site.call("POST", f"/wp/v2/posts/{pid}", upd)

    ledger = json.load(open(LEDGER))
    ledger.setdefault(site.url, {})[os.path.basename(a.file)] = {"id": pid, "status": res.get("status"), "url": res.get("link")}
    json.dump(ledger, open(LEDGER, "w"), indent=1)
    print(res.get("status"), res.get("link"))


if __name__ == "__main__":
    main()
