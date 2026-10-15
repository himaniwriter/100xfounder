#!/usr/bin/env python3
"""Upload Shark Tank India brand files (content/shark-tank/**.json, shape in content/shark-tank/SCHEMA.md)
as ordinary xf_startup listings, using WordPress's REST API plus the plugin's POST /xf/v1/shark-tank.

    python3 content/upload-shark-tank.py --check content/shark-tank/season-2      # validate only, no network
    python3 content/upload-shark-tank.py --dry-run content/shark-tank              # show what would happen
    XF_WP_USER=… python3 content/upload-shark-tank.py [--status pending|publish] paths…
    python3 content/upload-shark-tank.py --self-test

The app password comes from XF_WP_APP_PASSWORD, else the macOS keychain item "100xfounder-wp".
It is never printed. Files below the publishing bar always upload as pending, never published.
"""
import argparse
import base64
import json
import mimetypes
import os
import re
import subprocess
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

UA = "100xfounder-upload/1.0 (https://100xfounder.com)"
MEDIA_TYPES = {"brand_site", "press_kit", "official_social", "commons", "founder_sent"}
OFFICIAL_CHANNELS = {"shark tank india", "sony liv", "sonyliv", "set india"}
NONE = "Not publicly disclosed"


def inr(n):
    """₹ in lakh/crore, matching xf_st_inr() in shark-tank.php."""
    n = float(n)
    fmt = lambda x: f"{x:,.2f}".rstrip("0").rstrip(".")  # noqa: E731
    if n >= 1e7:
        return f"₹{fmt(n / 1e7)} crore"
    if n >= 1e5:
        return f"₹{fmt(n / 1e5)} lakh"
    return f"₹{n:,.0f}"


def src_url(s):
    """A source's URL (object or bare string), or '' when it has none."""
    url = s if isinstance(s, str) else (s or {}).get("url", "") if isinstance(s, dict) else ""
    return url if re.match(r"^https?://", url or "", re.I) else ""


def slugify(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def validate(d):
    """(errors, report). errors = malformed; report = what is sourced and whether it meets the bar."""
    errs = []
    if not isinstance(d, dict):
        return ["not a JSON object"], {}
    st = d.get("shark_tank")
    if not d.get("name"):
        errs.append("name missing")
    if not (d.get("industry_term") or d.get("industry")):
        errs.append("industry_term missing")
    if (d.get("industry_term") or d.get("industry") or "") == "shark-tank":
        errs.append('industry_term may not be "shark-tank"')
    if not isinstance(st, dict):
        return errs + ["shark_tank missing"], {}
    for k in ("ask_amount", "ask_equity", "ask_valuation"):
        if k in st and not isinstance(st[k], (int, float)):
            errs.append(f"shark_tank.{k} must be a number")
    deal = st.get("deal", {})
    if not isinstance(deal, dict) or ("made" in deal and not isinstance(deal["made"], bool)):
        errs.append("shark_tank.deal.made must be true or false")
        deal = {}
    if st.get("air_date") and not re.match(r"^\d{4}-\d{2}-\d{2}$", str(st["air_date"])):
        errs.append("shark_tank.air_date must be YYYY-MM-DD")
    pitch_src = any(src_url(s) for s in st.get("sources") or [])
    pitch = {
        "season": bool(st.get("season")), "episode/air_date": bool(st.get("episode") or st.get("air_date")),
        "ask_amount": "ask_amount" in st, "ask_equity": "ask_equity" in st, "deal.made": "made" in deal,
        "deal terms": bool(deal.get("amount") and deal.get("equity")) if deal.get("made") else "made" in deal,
        "pitch_revenue": bool((st.get("pitch_revenue") or {}).get("value")),
    }
    pitch = {k: v and pitch_src for k, v in pitch.items()}
    now = d.get("now") or {}
    now_rep = {
        "status": bool(now.get("status") not in (None, "unknown") and src_url(now.get("status_source"))),
        "revenue": bool((now.get("latest_revenue") or {}).get("value") and src_url((now.get("latest_revenue") or {}).get("source"))),
        "funding": bool((now.get("latest_funding") or {}).get("amount") and src_url((now.get("latest_funding") or {}).get("source"))),
        "valuation": bool((now.get("latest_valuation") or {}).get("value") and src_url((now.get("latest_valuation") or {}).get("source"))),
    }
    bar = all(pitch[k] for k in ("season", "episode/air_date", "ask_amount", "ask_equity", "deal.made"))
    pv = d.get("pitch_video") or {}
    if pv and str(pv.get("channel", "")).strip().lower() not in OFFICIAL_CHANNELS:
        errs.append("pitch_video.channel is not an official channel (it will not be shown)")
    return errs, {"pitch": pitch, "now": now_rep, "meets_bar": bar}


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


def password():
    pw = os.environ.get("XF_WP_APP_PASSWORD", "")
    if pw:
        return pw
    try:
        return subprocess.run(["security", "find-generic-password", "-s", "100xfounder-wp", "-w"],
                              capture_output=True, text=True, check=True).stdout.strip()
    except (OSError, subprocess.CalledProcessError):
        return ""


def upload_media(site, item, title):
    req = urllib.request.Request(item["url"], headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=60) as r:
        data, ctype = r.read(), r.headers.get("Content-Type", "").split(";")[0]
    if not ctype.startswith("image/"):
        raise RuntimeError("not an image: " + item["url"])
    ext = mimetypes.guess_extension(ctype) or ".jpg"
    name = slugify(item.get("alt") or item.get("name") or title)[:70] + ext
    m = site.call("POST", "/wp/v2/media", raw=data, headers={"Content-Type": ctype, "Content-Disposition": f'attachment; filename="{name}"'})
    alt = item.get("alt") or item.get("name") or title
    site.call("POST", f"/wp/v2/media/{m['id']}", {"alt_text": alt, "caption": item.get("credit", ""), "description": item.get("source_url", "")})
    return m["id"], m["source_url"]


def files_from(paths):
    out = []
    for p in paths:
        if os.path.isdir(p):
            for root, _, names in os.walk(p):
                out += [os.path.join(root, n) for n in sorted(names) if n.endswith(".json") and not n.startswith("_")]
        else:
            out.append(p)
    return out


def upload(site, d, status, dry):
    slug = d.get("existing_listing_slug") or d.get("slug") or slugify(d["name"])
    term_slug = d.get("industry_term") or d.get("industry")
    found = site.call("GET", "/wp/v2/xf_startup?status=any&context=edit&slug=" + urllib.parse.quote(slug))
    terms = site.call("GET", "/wp/v2/xf_industry?slug=" + urllib.parse.quote(term_slug))
    if not terms:
        raise RuntimeError(f"industry term {term_slug!r} does not exist on the site")
    post = {"title": d["name"], "slug": slug, "xf_industry": [terms[0]["id"]]}
    for k in ("excerpt", "content"):
        if d.get(k):
            post[k] = d[k]
    if not found:
        post["status"] = status
    elif status == "publish" and found[0]["status"] != "publish":
        post["status"] = "publish"  # never demote a live listing; only promote one that meets the bar
    action = f"update #{found[0]['id']}" if found else "create"
    if dry:
        return f"would {action} slug={slug} status={post.get('status', found[0]['status'] if found else status)} industry={term_slug}"
    pid = site.call("POST", f"/wp/v2/xf_startup/{found[0]['id']}" if found else "/wp/v2/xf_startup", post)["id"]
    media = d.get("media") or {}
    groups = [("logo", [media["logo"]] if media.get("logo") else []), ("gallery", media.get("gallery") or []),
              ("founder_photos", media.get("founder_photos") or [])]
    # shortcut: re-running a file uploads its media again; add a ledger if re-runs become routine.
    for group, items in groups:
        for item in items:
            if item.get("source_type") not in MEDIA_TYPES or not item.get("credit") or not src_url(item.get("url")):
                print(f"   media skipped ({group}): source_type/credit/url not allowed")
                continue
            try:
                mid, url = upload_media(site, item, d["name"])
            except (urllib.error.URLError, RuntimeError) as e:
                print(f"   media skipped ({group}): {e}")
                continue
            item["url"] = url  # serve our copy, not the brand's
            if group == "logo":
                site.call("POST", f"/wp/v2/xf_startup/{pid}", {"featured_media": mid})
            time.sleep(1)
    site.call("POST", "/xf/v1/shark-tank", {"id": pid, "data": d})
    return f"{action} → #{pid}"


def self_test():
    assert inr(5000000) == "₹50 lakh", inr(5000000)
    assert inr(15000000) == "₹1.5 crore"
    assert inr(10000000000) == "₹1,000 crore"
    assert inr(12345) == "₹12,345"
    good = {"name": "X", "industry_term": "food-drinks", "shark_tank": {
        "season": 1, "episode": 4, "ask_amount": 5000000, "ask_equity": 5, "deal": {"made": False},
        "sources": [{"label": "a", "url": "https://example.com"}]}}
    e, r = validate(good)
    assert not e and r["meets_bar"], (e, r)
    bare = json.loads(json.dumps(good))
    bare["shark_tank"]["sources"] = ["no-url"]
    assert validate(bare)[1]["meets_bar"] is False
    bad = json.loads(json.dumps(good))
    bad["industry_term"] = "shark-tank"
    bad["shark_tank"]["ask_amount"] = "50 lakh"
    assert len(validate(bad)[0]) == 2
    now = {"latest_revenue": {"value": 1, "source": "https://x.com"}, "latest_funding": {"amount": 5}}
    good["now"] = now
    assert validate(good)[1]["now"] == {"status": False, "revenue": True, "funding": False, "valuation": False}
    print("self-test ok")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="*")
    ap.add_argument("--status", choices=["pending", "publish"], default="pending")
    ap.add_argument("--check", action="store_true")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--self-test", action="store_true")
    ap.add_argument("--base-url", default="https://100xfounder.com")
    a = ap.parse_args()
    if a.self_test:
        return self_test()
    files = files_from(a.paths)
    if not files:
        sys.exit("No brand files given.")
    docs, bad = [], 0
    for f in files:
        try:
            d = json.load(open(f, encoding="utf-8"))
        except (OSError, ValueError) as e:
            print(f"MALFORMED {f}: {e}")
            bad += 1
            continue
        errs, rep = validate(d)
        hard = [e for e in errs if "will not be shown" not in e]
        if a.check or hard:
            yes = lambda m: ", ".join(k for k, v in m.items() if v) or "none"  # noqa: E731
            print(f"{'MALFORMED' if hard else 'ok':9} {f}  bar={'yes' if rep.get('meets_bar') else 'no'}"
                  f"  pitch sourced: {yes(rep.get('pitch', {}))}  now sourced: {yes(rep.get('now', {}))}")
            for e in errs:
                print("          -", e)
        bad += bool(hard)
        if not hard:
            docs.append((f, d, rep))
    if a.check:
        sys.exit(1 if bad else 0)
    if bad:
        sys.exit(f"{bad} malformed file(s); fix them or run --check.")
    user, pw = os.environ.get("XF_WP_USER", ""), password()
    if not (user and pw):
        sys.exit("Set XF_WP_USER, and XF_WP_APP_PASSWORD or the keychain item 100xfounder-wp.")
    site = Site(a.base_url, user, pw)
    for f, d, rep in docs:
        status = a.status if rep["meets_bar"] else "pending"
        try:
            print(f"{os.path.basename(f)}: {upload(site, d, status, a.dry_run)}", flush=True)
        except (urllib.error.URLError, RuntimeError, KeyError) as e:
            detail = e.read().decode()[:300] if isinstance(e, urllib.error.HTTPError) else str(e)
            print(f"FAIL {os.path.basename(f)}: {detail}")


if __name__ == "__main__":
    main()
