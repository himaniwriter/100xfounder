#!/usr/bin/env python3
"""Put a researched profile on a startup listing.

    XF_WP_USER=… XF_WP_APP_PASSWORD='…' python3 content/upload-startup-profile.py content/startups/launchreel.json [--logo]

The JSON holds {"slug", "content", "excerpt", "profile"}; the profile's shape is
documented at the top of wordpress/100xfounder/includes/startup-profile.php.
The page body, excerpt and profile are saved in one request through
/xf/v1/startup-profile/<id>, which also refreshes the listing's indexable flag,
so a profiled page enters the sitemap on its own.

Screenshots stay on Product Hunt's image host and are shown with credit; they are
not copied. The logo is the company's own icon, fetched by fetch-startup-logos.py.
"""
import argparse
import base64
import json
import os
import sys
import urllib.error
import urllib.request

UA = "100xFounderBot/1.0 (+https://100xfounder.com)"


def call(site, auth, method, path, body=None):
    req = urllib.request.Request(
        site + "/wp-json" + path, method=method,
        data=json.dumps(body).encode() if body is not None else None,
        headers={"Authorization": auth, "Content-Type": "application/json", "User-Agent": UA})
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read().decode() or "{}")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("file")
    ap.add_argument("--dry-run", action="store_true")
    a = ap.parse_args()
    site = os.environ.get("XF_SITE_URL", "https://100xfounder.com").rstrip("/")
    user, pw = os.environ.get("XF_WP_USER", ""), os.environ.get("XF_WP_APP_PASSWORD", "")
    if not (user and pw):
        sys.exit("Set XF_WP_USER and XF_WP_APP_PASSWORD.")
    auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()
    d = json.load(open(a.file))
    prof = d["profile"]

    # Guard rails: a rating needs reviews behind it, and every section needs a source.
    rv = prof.get("reviews") or {}
    if rv.get("rating") and not rv.get("count"):
        sys.exit("reviews.rating is set but reviews.count is 0: a rating needs real reviews behind it.")
    if not prof.get("sources"):
        sys.exit("profile.sources is empty: list where the facts came from.")

    found = call(site, auth, "GET", f"/wp/v2/xf_startup?slug={d['slug']}&status=publish,draft,pending&_fields=id,link")
    if not found:
        sys.exit(f"No startup listing with slug {d['slug']!r}.")
    sid = found[0]["id"]
    if a.dry_run:
        print("would update", found[0]["link"], "sections:", [k for k in ("audience", "pricing", "alternatives", "community", "faq") if prof.get(k)])
        return
    res = call(site, auth, "POST", f"/xf/v1/startup-profile/{sid}",
               {"profile_b64": base64.b64encode(json.dumps(prof, ensure_ascii=False).encode()).decode(),
                "content": d.get("content"), "excerpt": d.get("excerpt"),
                # Ignored by plugins older than the one that added `meta` to /xf/v1/startup-profile.
                "meta": {"website": d.get("website") or (prof.get("sources") or [{}])[0].get("url"),
                         "ph_url": d.get("ph_url"), "tagline": prof.get("summary_short")}})
    print(res)


if __name__ == "__main__":
    main()
