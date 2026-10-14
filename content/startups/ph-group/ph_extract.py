#!/usr/bin/env python3
"""Fetch a Product Hunt launch page and print the facts a profile needs as JSON.

Usage: python3 ph_extract.py https://www.producthunt.com/posts/<slug> [out.json] [--fallback]
--fallback: when the launch block is missing, also read the launches and makers pages (2 extra requests).
Reads PH's server-rendered Apollo data (what the page displays). Comments carry
PH's aiDetectionConfidence so "Likely AI" ones can be skipped.
"""
import json, re, subprocess, sys

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36"


def fetch(url):
    r = subprocess.run(["curl", "-sL", "-m", "40", "-A", UA, "-w", "\n__URL__%{url_effective}", url], capture_output=True, text=True)
    body, _, final = r.stdout.rpartition("\n__URL__")
    return body, final


def blobs(h):
    dec = json.JSONDecoder()
    for m in re.finditer(r'\{"data":\{', h):
        try:
            yield dec.raw_decode(h, m.start())[0]["data"]
        except Exception:
            pass


def text(html):
    return re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", html or "")).strip()


def comments(edges, out, depth=0):
    for e in edges or []:
        c = e["node"]
        u = c.get("user") or {}
        out.append({"id": c["id"], "depth": depth, "author": u.get("name"), "username": u.get("username"),
                    "ai": c.get("aiDetectionConfidence"), "score": c.get("score"),
                    "badges": [b.get("node", {}).get("__typename") for b in (c.get("badges") or {}).get("edges", [])] if isinstance(c.get("badges"), dict) else c.get("badges"),
                    "text": text(c.get("bodyHtml") or c.get("body"))[:1200]})
        comments((c.get("replies") or {}).get("edges"), out, depth + 1)


def main(url):
    h, final = fetch(url)
    want = url.rstrip("/").rsplit("/", 1)[-1]
    res = {"input": url, "final_url": final, "launch": {}, "product": {}, "comments": []}
    for d in blobs(h):
        p = d.get("product") or {}
        if p.get("name") and "reviewsCount" in p:
            res["product"].update({k: p.get(k) for k in ["name", "slug", "tagline", "description", "websiteUrl", "reviewsCount", "reviewsRating",
                                                          "followersCount", "twitterUrl", "linkedinUrl", "instagramUrl", "githubUrl", "iosUrl", "androidUrl", "postsCount"] if p.get(k) is not None})
            sd = p.get("structuredData") or {}
            if sd.get("screenshot"):
                res["product"]["screenshots"] = sd["screenshot"]
            posts = (p.get("posts") or {}).get("edges") or []
            if posts:
                res["product"]["launches"] = [{k: e["node"].get(k) for k in ("slug", "featuredAt", "dailyRank", "latestScore", "commentsCount")} for e in posts]
            alts = p.get("alternatives")
            if isinstance(alts, dict) and alts.get("edges"):
                res["product"]["alternatives"] = [{k: e["node"].get(k) for k in ("name", "slug", "tagline", "reviewsRating", "reviewsCount")} for e in alts["edges"]]
        l = (p.get("pageVariant") or {}).get("launch") or {}
        if "makers" in l:
            res["launch"] = {
                "slug": l.get("slug"), "name": l.get("name"), "tagline": l.get("tagline"), "featuredAt": l.get("featuredAt"),
                "dailyRank": l.get("dailyRank"), "weeklyRank": l.get("weeklyRank"), "points": l.get("latestScore"),
                "commentsCount": l.get("commentsCount"), "pricingType": l.get("pricingType"), "description": l.get("description"),
                "makers": [{k: m.get(k) for k in ("name", "username", "headline")} for m in l.get("makers") or []],
                "hunter": (l.get("user") or {}).get("name"),
                "media": [{"uuid": m.get("imageUuid"), "type": m.get("mediaType"), "w": m.get("originalWidth"), "h": m.get("originalHeight"),
                           "video": (m.get("metadata") or {}).get("url")} for m in l.get("media") or []],
                "links": [x.get("websiteName") for x in l.get("links") or []],
                "badges": [(b["node"].get("period"), b["node"].get("position")) for b in (l.get("badges") or {}).get("edges", []) if b["node"].get("period")],
            }
        post = d.get("post")
        if isinstance(post, dict) and post.get("threads") and not res["comments"]:
            comments(post["threads"].get("edges"), res["comments"])
    if not res["launch"].get("slug") and res["product"].get("slug") and len(sys.argv) > 3:
        # shortcut: multi-launch products don't server-render the launch block; take stats from the
        # launches page and makers from /makers (no gallery uuids or comments available this way)
        import time
        p = res["product"]["slug"]
        time.sleep(20)
        h2, _ = fetch("https://www.producthunt.com/products/%s/launches/%s" % (p, want))
        for d in blobs(h2):
            for e in ((d.get("product") or {}).get("posts") or {}).get("edges") or []:
                n = e["node"]
                if n.get("slug") == want:
                    res["launch"] = {"slug": want, "featuredAt": n.get("featuredAt"), "dailyRank": n.get("dailyRank"), "points": n.get("latestScore"),
                                     "commentsCount": n.get("commentsCount"), "source": "launches page (no gallery/comments)"}
        time.sleep(20)
        h3, _ = fetch("https://www.producthunt.com/products/%s/makers" % p)
        ms = {}
        for m in re.finditer(r'"__typename":"User","id":"\d+","name":"([^"]+)","username":"([^"]+)","headline":(null|"[^"]*")', h3):
            ms[m.group(2)] = {"name": m.group(1), "username": m.group(2), "headline": json.loads(m.group(3))}
        if ms:
            res["launch"]["makers"] = list(ms.values())
    if res["launch"].get("slug") and res["launch"]["slug"] != want:
        res["warning"] = "launch slug %s != requested %s" % (res["launch"]["slug"], want)
    return res


if __name__ == "__main__":
    r = main(sys.argv[1])
    s = json.dumps(r, ensure_ascii=False, indent=1)
    if len(sys.argv) > 2:
        open(sys.argv[2], "w").write(s)
        print(sys.argv[2], r["product"].get("name"), r["product"].get("websiteUrl"), len(r["comments"]), "comments", r.get("warning", ""))
    else:
        print(s)
