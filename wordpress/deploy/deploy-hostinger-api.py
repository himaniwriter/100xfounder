#!/usr/bin/env python3
"""Deploy the 100xFounder plugin and theme to Hostinger through its REST API.

This is how the site went live on 2026-10-04 and how releases ship from any
machine that can reach https://developers.hostinger.com (no SSH or FTP needed).

Needs the environment variable HOSTINGER_API_TOKEN (hPanel → profile → API).
Never put the token in a file in this repo. Optional: XF_DOMAIN, XF_HOSTING_USER.

Steps: upload every plugin/theme file over TUS into a temporary directory under
wp-content, then ask Hostinger to deploy it (it swaps the directory in and keeps
the plugin/theme active), then purge the LiteSpeed cache.
"""
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = "https://developers.hostinger.com"
TOKEN = os.environ.get("HOSTINGER_API_TOKEN", "").strip()
DOMAIN = os.environ.get("XF_DOMAIN", "100xfounder.com")
USER = os.environ.get("XF_HOSTING_USER", "u840917216")
HERE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))  # wordpress/
UA = {"User-Agent": "100xfounder-deploy/1.0", "Accept": "application/json"}


def api(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = dict(UA, Authorization="Bearer " + TOKEN)
    if data:
        headers["Content-Type"] = "application/json"
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            text = r.read().decode() or "{}"
            return r.status, (json.loads(text) if text.strip()[:1] in "[{" else text)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:1000]


def upload_creds():
    status, d = api("POST", "/api/hosting/v1/files/upload-urls", {"username": USER, "domain": DOMAIN})
    if status not in (200, 201):
        sys.exit(f"upload-urls failed: {status} {d}")
    return d


def upload(creds, local, remote):
    """TUS 1.0.0 upload of one file to public_html/<remote>."""
    size = os.path.getsize(local)
    url = creds["url"].rstrip("/") + "/" + urllib.parse.quote(remote) + "?override=true"
    h = dict(UA, **{"X-Auth": creds["auth_key"], "X-Auth-Rest": creds["rest_auth_key"], "Tus-Resumable": "1.0.0"})
    req = urllib.request.Request(url, data=b"", method="POST", headers=dict(h, **{"upload-length": str(size), "upload-offset": "0"}))
    with urllib.request.urlopen(req, timeout=60) as r:
        assert r.status == 201, r.status
    if size == 0:
        return
    with open(local, "rb") as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, method="PATCH", headers=dict(h, **{"Upload-Offset": "0", "Content-Type": "application/offset+octet-stream"}))
    with urllib.request.urlopen(req, timeout=300) as r:
        assert r.status in (200, 204), r.status


def upload_dir(local_dir, remote_prefix):
    creds = upload_creds()
    n = 0
    for root, _, files in os.walk(local_dir):
        for fn in sorted(files):
            if fn.startswith(".") or fn.endswith(".md"):
                continue
            path = os.path.join(root, fn)
            rel = os.path.relpath(path, local_dir).replace(os.sep, "/")
            for attempt in range(3):
                try:
                    upload(creds, path, remote_prefix + "/" + rel)
                    break
                except Exception as e:  # noqa: BLE001 - retry with fresh credentials
                    if attempt == 2:
                        sys.exit(f"upload failed for {rel}: {e}")
                    creds = upload_creds()
            n += 1
            print(f"  {rel}")
    return n


def main():
    if not TOKEN:
        sys.exit("Set HOSTINGER_API_TOKEN first (hPanel → profile → API). Do not commit it.")
    status, installs = api("GET", "/api/hosting/v1/wordpress/installations")
    site = next((i for i in installs if i["domain"] == DOMAIN), None) if status == 200 else None
    if not site:
        sys.exit(f"No WordPress installation found for {DOMAIN}. Install it first (see docs/WORDPRESS_SETUP.md).")
    stamp = time.strftime("%Y%m%d%H%M%S")

    print("→ Uploading plugin…")
    n = upload_dir(os.path.join(HERE, "100xfounder"), f"wp-content/plugins/100xfounder-{stamp}")
    print(f"  {n} files")
    print("→ Deploying plugin…")
    print("  ", api("POST", f"/api/hosting/v1/accounts/{USER}/websites/{DOMAIN}/wordpress/plugins/deploy",
                    {"slug": "100xfounder", "plugin_path": f"100xfounder-{stamp}"}))

    print("→ Uploading theme…")
    n = upload_dir(os.path.join(HERE, "100xfounder-theme"), f"wp-content/themes/100xfounder-theme-{stamp}")
    print(f"  {n} files")
    print("→ Deploying theme…")
    print("  ", api("POST", f"/api/hosting/v1/accounts/{USER}/websites/{DOMAIN}/wordpress/themes/deploy",
                    {"slug": "100xfounder-theme", "theme_path": f"100xfounder-theme-{stamp}", "is_activated": True}))

    print("→ Purging cache…")
    print("  ", api("POST", f"/api/hosting/v1/accounts/{USER}/wordpress/{site['id']}/litespeed-cache/purge", {}))
    print(f"Done. Check https://{DOMAIN}/ and the plugin dashboard. The deploy jobs finish within a minute.")


if __name__ == "__main__":
    main()
