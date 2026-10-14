#!/usr/bin/env python3
"""Give every company on the job board its own logo instead of initials.

    XF_SITE_URL=… XF_WP_USER=… XF_WP_APP_PASSWORD='…' python3 content/fetch-company-logos.py [--dry-run] [--redo]

Same method as fetch-startup-logos.py: the icon the company publishes on its
own website for phone home screens, uploaded to our media library and saved on
the company (term meta `xf_logo_id`). Careers pages are often hosted by Lever,
Greenhouse or Ashby, whose icon is theirs, not the employer's, so the company's
own domain is used: its Website field when set, otherwise the checked list
below. If a site refuses robots, the company's favicon is fetched through
Google's favicon service at 128px; that is still the company's own icon.
"""
import argparse
import base64
import html
import importlib.util
import json
import os
import re
import sys
import time
import urllib.error
import urllib.parse

HERE = os.path.dirname(os.path.abspath(__file__))
spec = importlib.util.spec_from_file_location("startup_logos", os.path.join(HERE, "fetch-startup-logos.py"))
sl = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sl)

# Official domains for the companies on the board, checked by hand.
DOMAINS = {
    "agoda": "agoda.com", "airbnb": "airbnb.com", "anthropic": "anthropic.com", "atlan": "atlan.com",
    "coinbase": "coinbase.com", "cred": "cred.club", "databricks": "databricks.com", "druva": "druva.com",
    "elastic": "elastic.co", "elevenlabs": "elevenlabs.io", "fampay": "famapp.in", "figma": "figma.com",
    "gitlab": "gitlab.com", "glean": "glean.com", "groww": "groww.in", "hevo-data": "hevodata.com",
    "highradius": "highradius.com", "meesho": "meesho.com", "mindtickle": "mindtickle.com",
    "mongodb": "mongodb.com", "new-relic": "newrelic.com", "notion": "notion.com", "observe-ai": "observe.ai",
    "okta": "okta.com", "openai": "openai.com", "paytm": "paytm.com", "rubrik": "rubrik.com",
    "sarvam-ai": "sarvam.ai", "sigmoid": "sigmoid.com", "stripe": "stripe.com", "tekion": "tekion.com",
    "toast": "toasttab.com", "vercel": "vercel.com", "zeta": "zeta.tech", "zscaler": "zscaler.com",
}
ATS_HOSTS = ("lever.co", "greenhouse.io", "ashbyhq.com", "workable.com", "smartrecruiters.com", "myworkdayjobs.com")


def google_favicon(domain):
    """The site's own favicon, as Google's crawler fetched it; 128px when the site has one that big."""
    try:
        body, ctype, _ = sl.get(f"https://www.google.com/s2/favicons?domain={domain}&sz=128", timeout=15)
    except Exception:  # noqa: BLE001
        return None
    size = sl.image_size(body)
    # Google answers with a 16px globe when it has nothing; that is not a logo.
    if not ctype.startswith("image/png") or not size or min(size) < 48:
        return None
    return body, "image/png", "png", f"favicon of {domain}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--redo", action="store_true", help="replace logos that are already set")
    a = ap.parse_args()

    site = os.environ.get("XF_SITE_URL", "https://100xfounder.com").rstrip("/")
    user, pw = os.environ.get("XF_WP_USER", ""), os.environ.get("XF_WP_APP_PASSWORD", "")
    if not (user and pw):
        sys.exit("Set XF_WP_USER and XF_WP_APP_PASSWORD (the term meta is only readable when signed in).")
    auth = "Basic " + base64.b64encode(f"{user}:{pw}".encode()).decode()

    companies = sl.api(site, auth, "GET", "/wp/v2/xf_company?per_page=100&context=edit&_fields=id,slug,name,meta")
    done = 0
    for c in companies:
        name = html.unescape(c["name"])
        meta = c.get("meta") or {}
        if meta.get("xf_logo_id") and not a.redo:
            print(f"  have  {name}")
            continue
        site_url = meta.get("xf_website") or ""
        host = (urllib.parse.urlparse(site_url).hostname or "").lower()
        if not host or any(host.endswith(h) for h in ATS_HOSTS):
            host = DOMAINS.get(c["slug"], "")
            site_url = f"https://{host}/" if host else ""
        if not site_url:
            print(f"  skip  {name}: no website")
            continue

        icon = sl.fetch_icon(sl.icon_candidates(site_url)) or google_favicon(host)
        if not icon:
            print(f"  skip  {name}: no usable icon at {host}")
            continue
        body, ctype, ext, src = icon
        if a.dry_run:
            print(f"  would {name:<14} {len(body) // 1024:>4}KB {sl.image_size(body)}  {src[:70]}")
            continue
        try:
            media = sl.api(site, auth, "POST", "/wp/v2/media", raw=body, headers={
                "Content-Type": ctype,
                "Content-Disposition": f'attachment; filename="{c["slug"]}-company-logo.{ext}"',
            })
            sl.api(site, auth, "POST", f"/wp/v2/media/{media['id']}", {"alt_text": f"{name} logo", "caption": f"Logo published by {host}"})
            new_meta = {"xf_logo_id": media["id"]}
            if not meta.get("xf_website"):
                new_meta["xf_website"] = f"https://{host}/"
            sl.api(site, auth, "POST", f"/wp/v2/xf_company/{c['id']}", {"meta": new_meta})
        except urllib.error.HTTPError as err:
            print(f"  FAIL  {name}: {err.code} {err.read().decode()[:160]}")
            continue
        done += 1
        print(f"  ok    {name:<14} {host}")
        time.sleep(1)
    print(f"\n{done} company logos set." if not a.dry_run else "\nDry run; nothing uploaded.")


if __name__ == "__main__":
    main()
