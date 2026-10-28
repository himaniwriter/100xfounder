#!/usr/bin/env python3
"""Words and images a startup profile JSON will render (owner's 500-word / 2-image rule)."""
import json, re, sys

SKIP = {"url", "credit", "sources", "ph_url", "search_url", "profile_url", "logo", "photo", "photo_credit",
        "photo_source_type", "schema_category", "video_url", "currency", "as_of", "checked", "launched", "w", "h"}


def words(v, key=None):
    if key in SKIP:
        return 0
    if isinstance(v, str):
        return len(re.sub(r"<[^>]+>", " ", v).split())
    if isinstance(v, dict):
        return sum(words(x, k) for k, x in v.items())
    if isinstance(v, list):
        return sum(words(x) for x in v)
    return 0


assert words({"a": "<p>one two</p>", "url": "x y z", "b": ["three"]}) == 3
for f in sys.argv[1:]:
    d = json.load(open(f))
    p = d["profile"]
    gallery = len([g for g in (p.get("gallery") or p.get("screenshots") or []) if g.get("url")])
    print(f, "words", words(d["content"]) + words(p), "gallery", gallery)
