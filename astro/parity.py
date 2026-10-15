#!/usr/bin/env python3
"""Parity gate: the Astro build must carry the same SEO head and page outline as WordPress.

Usage: python3 parity.py dist/index.html https://100xfounder.com/?nocache=1
Exits 1 (and prints the differences) if any checked field differs. Stdlib only.
"""
import html
import json
import re
import sys
import urllib.parse
import urllib.request


def fields(s, host):
    head = s[s.find('<head'):s.find('</head>')]
    main = s[s.find('<main'):s.rfind('</main>')]

    def meta(name):
        m = re.search(r'<meta\s+name=["\']%s["\']\s+content=["\']([^"\']*)' % name, head)
        return m.group(1) if m else None

    types = []
    for block in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', s, re.S):
        try:
            types.append(sorted(set(re.findall(r'"@type"\s*:\s*"([^"]+)"', block))))
        except Exception:  # noqa: BLE001
            types.append(['unparseable'])
    canon = re.search(r'<link\s+rel=["\']canonical["\']\s+href=["\']([^"\']+)', head)
    h1 = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    strip = lambda x: html.unescape(re.sub(r'<[^>]+>', '', x)).strip()
    ga = sorted(set(re.findall(r'\bG-[A-Z0-9]{6,}\b', s)))
    ext = [u for u in re.findall(r'<a\b[^>]*href="(https?://[^"]+)"', main) if urllib.parse.urlsplit(u).netloc not in (host, 'www.' + host)]
    return {
        'title': strip(re.search(r'<title>(.*?)</title>', head, re.S).group(1)) if '<title>' in head else None,
        'description': meta('description'),
        'canonical': canon.group(1) if canon else None,
        'robots': meta('robots'),
        'hreflang_count': len(re.findall(r'hreflang=', head)),
        'jsonld_count': len(types),
        'jsonld_types': types,
        'adsense_client_meta': meta('google-adsense-account'),
        'ga_ids': ga,
        'h1': strip(h1.group(1)) if h1 else None,
        'section_headings': [strip(h) for h in re.findall(r'<h2[^>]*>(.*?)</h2>', main, re.S)],
        'main_external_links': ext,
    }


def main():
    built, live = sys.argv[1], sys.argv[2]
    host = urllib.parse.urlsplit(live).netloc
    a = fields(open(built, encoding='utf-8').read(), host)
    req = urllib.request.Request(live, headers={'User-Agent': '100xfounder-parity/1.0'})
    b = fields(urllib.request.urlopen(req, timeout=60).read().decode('utf-8'), host)
    bad = [k for k in a if a[k] != b[k]]
    for k in a:
        print(('DIFF ' if k in bad else 'ok   ') + k + ': ' + json.dumps(a[k], ensure_ascii=False)[:160])
        if k in bad:
            print('     wp: ' + json.dumps(b[k], ensure_ascii=False)[:160])
    if not a['title'] or not a['canonical'] or not a['h1']:
        bad.append('missing core fields')
    if bad:
        print('PARITY FAILED: ' + ', '.join(bad))
        sys.exit(1)
    print('PARITY OK')


if __name__ == '__main__':
    main()
