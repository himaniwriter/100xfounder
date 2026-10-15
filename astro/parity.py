#!/usr/bin/env python3
"""Parity gate: the Astro build must carry the same SEO head and page outline as WordPress.

  python3 parity.py dist/index.html https://100xfounder.com/?nocache=1   one page (the home)
  python3 parity.py posts dist https://100xfounder.com                 every built article

One page: exits 1 (and prints the differences) if any checked field differs.
Articles: each is compared with WordPress (fetched with a query string, so WP renders it); a post with
any difference is moved out of dist/ into dist-skipped/ so it is not uploaded and WordPress keeps
serving it. Prints one line per post and exits 0 (the report is the output). Stdlib only.
"""
import hashlib
import html
import json
import os
import re
import shutil
import sys
import time
import urllib.parse
import urllib.request


def text_of(fragment):
    fragment = re.sub(r'<(script|style|noscript|svg)\b.*?</\1>', ' ', fragment, flags=re.S | re.I)
    return html.unescape(re.sub(r'<[^>]+>', ' ', fragment))


def shingles(s):
    """8-word runs, hashed the way includes/headless.php hashes the hidden [xf_reveal] text."""
    w = re.findall(r'[a-z0-9]+', text_of(s).lower())
    return {hashlib.sha256(' '.join(w[i:i + 8]).encode()).hexdigest()[:16] for i in range(len(w) - 7)}


def article_fields(s, host):
    f = fields(s, host)
    main = s[s.find('<main'):s.rfind('</main>')]
    og = re.search(r'<meta\s+property=["\']og:image["\']\s+content=["\']([^"\']*)', s)
    src = re.search(r'<details class="xf-sources">(.*?)</details>', main, re.S)
    f.update({
        'og_image': og.group(1) if og else None,
        'sources': re.findall(r'href="([^"]+)"', src.group(1)) if src else [],
        'words': len(text_of(main).split()),
    })
    return f


def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': '100xfounder-parity/1.0'})
    for i in range(3):
        try:
            return urllib.request.urlopen(req, timeout=60).read().decode('utf-8')
        except Exception:  # noqa: BLE001
            if i == 2:
                raise
            time.sleep(5)


def check_post(built, slug, wp):
    """Return the list of problems for one built article (empty = parity)."""
    host = urllib.parse.urlsplit(wp).netloc
    a_html = open(built, encoding='utf-8').read()
    b_html = fetch('%s/%s/?nocache=%d' % (wp, slug, time.time()))
    a, b = article_fields(a_html, host), article_fields(b_html, host)
    bad = [k for k in a if k != 'words' and a[k] != b[k]]
    if not b['words'] or abs(a['words'] - b['words']) > 0.02 * b['words']:
        bad.append('words %d vs %d' % (a['words'], b['words']))
    if not a['title'] or not a['canonical'] or not a['h1']:
        bad.append('missing core fields')
    probe = set(json.loads(fetch('%s/wp-json/xf/v1/headless/post?slug=%s' % (wp, slug))).get('reveal_probe') or [])
    if probe & shingles(a_html):
        bad.append('HIDDEN [xf_reveal] TEXT IN BUILD')
    for k in bad:
        if k in a:
            bad[bad.index(k)] = '%s: astro=%s wp=%s' % (k, json.dumps(a[k], ensure_ascii=False)[:120], json.dumps(b[k], ensure_ascii=False)[:120])
    return bad, a['words'], bool(probe)


def check_posts(dist, wp):
    wp = wp.rstrip('/')
    skipped = os.path.join(os.path.dirname(os.path.abspath(dist)), 'dist-skipped')
    shutil.rmtree(skipped, ignore_errors=True)
    slugs = sorted(d for d in os.listdir(dist) if d != '_astro' and os.path.isfile(os.path.join(dist, d, 'index.html')))
    ok = 0
    for slug in slugs:
        try:
            bad, words, gated = check_post(os.path.join(dist, slug, 'index.html'), slug, wp)
        except Exception as e:  # noqa: BLE001 - can't compare = don't upload
            bad, words, gated = ['compare failed: %s' % e], 0, False
        if bad:
            os.makedirs(skipped, exist_ok=True)
            shutil.move(os.path.join(dist, slug), os.path.join(skipped, slug))
            print('SKIP %s\n     %s' % (slug, '\n     '.join(bad)), flush=True)
        else:
            ok += 1
            print('ok   %s (%d words%s)' % (slug, words, ', gated list hidden' if gated else ''), flush=True)
    print('ARTICLES: %d ok, %d skipped' % (ok, len(slugs) - ok))


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
    if sys.argv[1:2] == ['posts']:
        return check_posts(sys.argv[2], sys.argv[3])
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
