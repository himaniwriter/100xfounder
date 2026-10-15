#!/usr/bin/env python3
"""Fetch WordPress's own render of every public URL in the enabled stages, incrementally.

  python3 fetch.py https://100xfounder.com A,B,C,D,E

Stages: A startup listings, B single types (guides, spotlights, events, rounds...), C pages and
virtual pages (tools, jobs landing pages, funding report), D archives, E jobs and translations.

Reads GET /wp-json/xf/v1/headless/urls, then GET /headless/page?path= only for a URL whose version
or the deployed code version changed, or whose render is 7+ days old (the rating, review, meter and
popup tokens in a page are valid for 14 days). Cache: astro/.cache/pages/*.json and .cache/index.json.
Writes .cache/build.json (what [...path].astro builds) and .cache/stage-X.txt (each stage's paths, for
a one-stage rollback). A page WordPress marks per-request (it prints a nonce) or that fails to load is
left out, so WordPress keeps serving it. Stdlib only.
"""
import concurrent.futures as cf
import datetime
import hashlib
import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(HERE, '.cache')
STAGES = {'startup': 'A', 'single': 'B', 'page': 'C', 'archive': 'D', 'job': 'E', 'translation': 'E'}
TOKEN_MAX_AGE = 7 * 86400   # re-render a week after the tokens were minted (they last 14 days)
KEEP_ON_ERROR = 12 * 86400  # a page that fails to refetch keeps its last good render this long
WORKERS = 5


def get(url):
    """JSON from WordPress with retries and backoff; (status, data)."""
    req = urllib.request.Request(url, headers={'Accept': 'application/json', 'User-Agent': '100xfounder-astro-build'})
    for i in range(4):
        try:
            with urllib.request.urlopen(req, timeout=90) as r:
                return r.status, json.loads(r.read().decode('utf-8'))
        except urllib.error.HTTPError as e:
            if e.code in (404, 409):
                return e.code, json.loads(e.read().decode('utf-8') or '{}')
            err = e
        except Exception as e:  # noqa: BLE001
            err = e
        time.sleep(2 ** (i + 1))
    raise err


def issued(page):
    """When WordPress minted the page's tokens (its render time)."""
    try:
        return datetime.datetime.fromisoformat(page['built'].replace('Z', '+00:00')).timestamp()
    except (KeyError, TypeError, ValueError):
        return time.time()


def main():
    wp, stages = sys.argv[1].rstrip('/'), set(sys.argv[2].upper().split(',')) if len(sys.argv) > 2 else set('ABCDE')
    os.makedirs(os.path.join(CACHE, 'pages'), exist_ok=True)
    try:
        with open(os.path.join(CACHE, 'index.json'), encoding='utf-8') as f:
            index = json.load(f)
    except (OSError, ValueError):
        index = {}
    if not stages & set('ABCDE'):  # no generic stage live: nothing to fetch, [...path].astro builds nothing
        with open(os.path.join(CACHE, 'build.json'), 'w', encoding='utf-8') as f:
            f.write('[]')
        print('PAGES: no generic stages enabled')
        return
    _, d = get(wp + '/wp-json/xf/v1/headless/urls?type=all&t=%d' % time.time())
    code = str(d['code_ver'])
    urls = [u for u in d['urls'] if STAGES.get(u['type']) in stages]
    now = time.time()

    def stale(u):
        e = index.get(u['path'])
        return not e or e.get('ver') != u['ver'] or e.get('code_ver') != code or (
            e.get('status') == 'ok' and now - e.get('tokens', 0) > TOKEN_MAX_AGE)

    todo = [u for u in urls if stale(u)]
    print('urls: %d in stages %s, %d to fetch' % (len(urls), ','.join(sorted(stages)), len(todo)), flush=True)

    def one(u):
        path = u['path']
        f = os.path.join(CACHE, 'pages', hashlib.sha1(path.encode()).hexdigest() + '.json')
        try:
            status, page = get(wp + '/wp-json/xf/v1/headless/page?' + urllib.parse.urlencode({'path': path, 't': int(now)}))
        except Exception as e:  # noqa: BLE001
            return path, None, 'error: %s' % e
        if status != 200 or page.get('error') or not page.get('main'):
            return path, {'ver': u['ver'], 'code_ver': code, 'status': page.get('error') or str(status), 'fetched': now}, None
        with open(f, 'w', encoding='utf-8') as fh:
            json.dump(page, fh, ensure_ascii=False)
        return path, {'ver': u['ver'], 'code_ver': code, 'status': 'ok', 'fetched': now, 'tokens': issued(page), 'file': f}, None

    done = 0
    with cf.ThreadPoolExecutor(WORKERS) as ex:
        for path, entry, err in ex.map(one, todo):
            done += 1
            if err:
                old = index.get(path)
                print('fetch failed %s: %s%s' % (path, err[:120], ' (keeping last render)' if old and old.get('status') == 'ok' else ''), flush=True)
                continue
            index[path] = entry
            if done % 100 == 0:
                print('  fetched %d/%d' % (done, len(todo)), flush=True)
    with open(os.path.join(CACHE, 'index.json'), 'w', encoding='utf-8') as f:
        json.dump(index, f, indent=0, sort_keys=True)

    build, skipped, by_stage = [], {}, {}
    for u in urls:
        e = index.get(u['path'], {})
        st = STAGES[u['type']]
        by_stage.setdefault(st, []).append(u['path'])
        if e.get('status') == 'ok' and now - e.get('tokens', 0) < KEEP_ON_ERROR and os.path.exists(e.get('file', '')):
            build.append({'path': u['path'], 'file': e['file'], 'stage': st})
        else:
            skipped[e.get('status', 'not fetched')] = skipped.get(e.get('status', 'not fetched'), 0) + 1
    for st, paths in by_stage.items():
        with open(os.path.join(CACHE, 'stage-%s.txt' % st), 'w', encoding='utf-8') as f:
            f.write('\n'.join(sorted(paths)) + '\n')
    with open(os.path.join(CACHE, 'build.json'), 'w', encoding='utf-8') as f:
        json.dump(build, f, indent=0)
    print('PAGES: %d to build, left to WordPress: %s' % (len(build), json.dumps(skipped)), flush=True)


if __name__ == '__main__':
    main()
