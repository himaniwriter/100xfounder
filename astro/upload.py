#!/usr/bin/env python3
"""Hostinger file operations for the Astro front end (TUS upload logic from
wordpress/deploy/deploy-hostinger-api.py, copied so astro/ stands alone).

  python3 upload.py push dist astro        upload dist/ to public_html/astro/ (index.html last)
  python3 upload.py sync dist astro        upload only files whose hash changed since the last sync
                                           (manifest: astro/.upload-manifest.json), then blank (zero-byte
                                           index.html) every page uploaded before that is not in dist/
                                           any more, so the .htaccess -s test hands it back to WordPress
  python3 upload.py htaccess on|off        add/remove the "/" -> /astro/index.html block in public_html/.htaccess
  python3 upload.py htaccess status        print whether the block is live

The API token comes from the macOS Keychain (service 100xfounder-hostinger), or HOSTINGER_API_TOKEN
in the environment. It is never printed or written to disk.
"""
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.parse
import urllib.request

BASE = 'https://developers.hostinger.com'
USER = os.environ.get('XF_HOSTING_USER', 'u840917216')
DOMAIN = os.environ.get('XF_DOMAIN', '100xfounder.com')
UA = {'User-Agent': '100xfounder-astro/1.0', 'Accept': 'application/json'}
HERE = os.path.dirname(os.path.abspath(__file__))
BEGIN, END = '# BEGIN 100xFounder Astro', '# END 100xFounder Astro'

# Serve a static page for a plain anonymous GET/HEAD of a trailing-slash URL when the build has a
# non-empty astro{URI}index.html for it ("/" and every article). Anything not built (wp-admin, wp-json,
# feeds, sitemaps, /page/2/, drafts) and every logged-in, commenter or preview request stays WordPress.
# A zero-byte index.html (an unpublished or skipped post) fails -s, so WordPress answers (404/410).
BLOCK = BEGIN + r'''
<IfModule mod_rewrite.c>
RewriteEngine On
RewriteCond %{THE_REQUEST} ^[A-Z]+\s/astro/(?:[^\s?]*/)?index\.html[\s?]
RewriteRule ^astro/(.*/)?index\.html$ /$1 [R=301,L]
RewriteCond %{THE_REQUEST} ^[A-Z]+\s/astro/
RewriteCond %{THE_REQUEST} !^[A-Z]+\s/astro/_astro/
RewriteRule ^astro/ - [E=XF_ASTRO_NOINDEX:1]
RewriteCond %{REQUEST_METHOD} ^(GET|HEAD)$
RewriteCond %{QUERY_STRING} ^$
RewriteCond %{REQUEST_URI} ^/(?:[a-z0-9-]+/)?$
RewriteCond %{HTTP_COOKIE} !(wordpress_logged_in|comment_author_|wp-postpass_) [NC]
RewriteCond %{DOCUMENT_ROOT}/astro%{REQUEST_URI}index.html -s
RewriteRule ^ /astro%{REQUEST_URI}index.html [L,E=XF_ASTRO_HOME:1]
</IfModule>
AddDefaultCharset UTF-8
<IfModule mod_headers.c>
# The security headers WordPress sends (includes/security.php), for the static home too
# (LiteSpeed keeps the env name across the rewrite, Apache prefixes REDIRECT_).
Header set X-Content-Type-Options "nosniff" env=XF_ASTRO_HOME
Header set X-Content-Type-Options "nosniff" env=REDIRECT_XF_ASTRO_HOME
Header set Referrer-Policy "strict-origin-when-cross-origin" env=XF_ASTRO_HOME
Header set Referrer-Policy "strict-origin-when-cross-origin" env=REDIRECT_XF_ASTRO_HOME
Header set X-Frame-Options "SAMEORIGIN" env=XF_ASTRO_HOME
Header set X-Frame-Options "SAMEORIGIN" env=REDIRECT_XF_ASTRO_HOME
Header set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()" env=XF_ASTRO_HOME
Header set Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=()" env=REDIRECT_XF_ASTRO_HOME
Header set Strict-Transport-Security "max-age=31536000" env=XF_ASTRO_HOME
Header set Strict-Transport-Security "max-age=31536000" env=REDIRECT_XF_ASTRO_HOME
Header set X-Robots-Tag "noindex" env=XF_ASTRO_NOINDEX
Header set X-Robots-Tag "noindex" env=REDIRECT_XF_ASTRO_NOINDEX
</IfModule>
''' + END + '\n\n'


def token():
    try:
        out = subprocess.run(['security', 'find-generic-password', '-s', '100xfounder-hostinger', '-w'],
                             capture_output=True, text=True, timeout=10)
        if out.returncode == 0 and out.stdout.strip():
            return out.stdout.strip()
    except Exception:  # noqa: BLE001 - not on macOS / no Keychain
        pass
    t = os.environ.get('HOSTINGER_API_TOKEN', '').strip()
    if t:
        return t
    sys.exit('No Hostinger API token. Save it once in the Keychain (you will be prompted for it):\n'
             '  security add-generic-password -s 100xfounder-hostinger -a hostinger -w\n'
             'Get the token from hPanel -> profile -> API.')


TOKEN = None


def api(method, path, body=None):
    global TOKEN
    TOKEN = TOKEN or token()
    data = json.dumps(body).encode() if body is not None else None
    headers = dict(UA, Authorization='Bearer ' + TOKEN)
    if data:
        headers['Content-Type'] = 'application/json'
    req = urllib.request.Request(BASE + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            text = r.read().decode() or '{}'
            return r.status, (json.loads(text) if text.strip()[:1] in '[{' else text)
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()[:500]


def upload_creds():
    for i in range(10):
        status, d = api('POST', '/api/hosting/v1/files/upload-urls', {'username': USER, 'domain': DOMAIN})
        if status in (200, 201):
            return d
        print('upload-urls retry', i, status, flush=True)
        time.sleep(20)
    sys.exit('Could not get upload credentials from Hostinger.')


def upload(creds, local, remote):
    """TUS 1.0.0 upload of one file to public_html/<remote>."""
    size = os.path.getsize(local)
    url = creds['url'].rstrip('/') + '/' + urllib.parse.quote(remote) + '?override=true'
    h = dict(UA, **{'X-Auth': creds['auth_key'], 'X-Auth-Rest': creds['rest_auth_key'], 'Tus-Resumable': '1.0.0'})
    req = urllib.request.Request(url, data=b'', method='POST', headers=dict(h, **{'upload-length': str(size), 'upload-offset': '0'}))
    with urllib.request.urlopen(req, timeout=60) as r:
        assert r.status == 201, r.status
    if size == 0:
        return
    with open(local, 'rb') as f:
        data = f.read()
    req = urllib.request.Request(url, data=data, method='PATCH', headers=dict(h, **{'Upload-Offset': '0', 'Content-Type': 'application/offset+octet-stream'}))
    with urllib.request.urlopen(req, timeout=300) as r:
        assert r.status in (200, 204), r.status


def push(src, dest, last='index.html'):
    """Upload every file under src to public_html/dest; `last` goes last so the page never points at missing assets."""
    c = upload_creds()
    files = []
    for root, _, fs in os.walk(src):
        for f in fs:
            if not f.startswith('.'):
                p = os.path.join(root, f)
                files.append((p, os.path.relpath(p, src).replace(os.sep, '/')))
    files.sort(key=lambda x: x[1] == last)
    fails = []
    for p, rel in files:
        for _ in range(5):
            try:
                upload(c, p, dest + '/' + rel)
                break
            except BaseException:  # noqa: BLE001 - retry with fresh credentials
                time.sleep(5)
                c = upload_creds()
        else:
            fails.append(rel)
    print(dest, len(files), 'files, fails:', fails, flush=True)
    return fails


MANIFEST = os.path.join(HERE, '.upload-manifest.json')
STAMP = re.compile(rb'<!-- astro-build: [^>]* -->')


def digest(path):
    with open(path, 'rb') as f:
        return hashlib.sha256(STAMP.sub(b'', f.read())).hexdigest()  # the build stamp alone is no change


def sync(src, dest):
    """Upload changed files only (assets, then pages, the home last); blank pages that left the build."""
    try:
        with open(MANIFEST, encoding='utf-8') as f:
            seen = json.load(f)
    except (OSError, ValueError):
        seen = {}
    files = {}
    for root, _, fs in os.walk(src):
        for f in fs:
            if not f.startswith('.'):
                p = os.path.join(root, f)
                files[os.path.relpath(p, src).replace(os.sep, '/')] = p
    order = lambda rel: (rel.endswith('.html'), rel == 'index.html', rel)
    todo = sorted((r for r in files if seen.get(r) != digest(files[r])), key=order)
    # Pages uploaded before but gone from this build (unpublished, deleted or skipped by the gate).
    gone = sorted(r for r, h in seen.items() if r.endswith('/index.html') and r not in files and h != 'blank')
    if not todo and not gone:
        print(dest, 'nothing changed')
        return []
    c = upload_creds()
    fails = []
    with tempfile.TemporaryDirectory() as tmp:
        empty = os.path.join(tmp, 'empty')
        open(empty, 'wb').close()
        for rel in todo + gone:
            local, h = (files[rel], digest(files[rel])) if rel in files else (empty, 'blank')
            for _ in range(5):
                try:
                    upload(c, local, dest + '/' + rel)
                    seen[rel] = h
                    break
                except BaseException:  # noqa: BLE001 - retry with fresh credentials
                    time.sleep(5)
                    c = upload_creds()
            else:
                fails.append(rel)
            with open(MANIFEST, 'w', encoding='utf-8') as f:
                json.dump(seen, f, indent=0, sort_keys=True)
    print(dest, len(todo), 'uploaded,', len(gone), 'blanked', gone, 'fails:', fails, flush=True)
    return fails


def read_htaccess():
    status, d = api('GET', f'/api/hosting/v1/accounts/{USER}/domains/{DOMAIN}/files/content?path=.htaccess&max_lines=5000')
    if status != 200 or not isinstance(d, dict) or 'content' not in d:
        sys.exit(f'Could not read .htaccess ({status}).')
    text = d['content']
    size = int(d.get('size_bytes') or 0)
    if d.get('total_lines') and text.count('\n') + 1 < int(d['total_lines']):
        sys.exit('.htaccess came back truncated; not touching it.')
    # The API drops the file's final newline; put it back so untouched lines stay byte-identical.
    if len(text.encode()) == size - 1:
        text += '\n'
    if len(text.encode()) != size:
        sys.exit(f'.htaccess size mismatch ({len(text.encode())} vs {size}); not touching it.')
    return text


def strip_block(text):
    while BEGIN in text:
        a = text.index(BEGIN)
        b = text.index(END, a) + len(END)
        while text[b:b + 1] == '\n':
            b += 1
        text = text[:a] + text[b:]
    return text


def write_htaccess(enable):
    old = read_htaccess()
    os.makedirs(os.path.join(HERE, '..', 'backups'), exist_ok=True)
    backup = os.path.join(HERE, '..', 'backups', 'htaccess-' + time.strftime('%Y%m%d-%H%M%S'))
    with open(backup, 'w', encoding='utf-8', newline='') as f:
        f.write(old)
    base = strip_block(old)
    if enable:
        at = base.find('# BEGIN WordPress')
        new = base[:at] + BLOCK + base[at:] if at >= 0 else BLOCK + base
    else:
        new = base
    if new == old:
        print('.htaccess already', 'on' if enable else 'off')
        return
    # Everything outside our block must be untouched.
    assert strip_block(new) == base and base in new.replace(BLOCK, ''), 'refusing: edit would change other blocks'
    with tempfile.TemporaryDirectory() as tmp:
        p = os.path.join(tmp, 'htaccess')
        with open(p, 'w', encoding='utf-8', newline='') as f:
            f.write(new)
        upload(upload_creds(), p, '.htaccess')
    after = read_htaccess()
    if after != new:
        sys.exit('.htaccess verification failed after upload; backup at ' + backup)
    print('.htaccess', 'on' if enable else 'off', '(backup:', os.path.relpath(backup, os.path.join(HERE, '..')) + ')')


def selftest():
    sample = '# BEGIN WordPress\nX\n# END WordPress\n'
    on = sample[:0] + BLOCK + sample
    assert strip_block(on) == sample and strip_block(strip_block(on)) == sample


if __name__ == '__main__':
    selftest()
    args = sys.argv[1:]
    if args[:1] in (['push'], ['sync']) and len(args) == 3:
        sys.exit(1 if (push if args[0] == 'push' else sync)(args[1], args[2]) else 0)
    elif args[:1] == ['htaccess'] and args[1:] in (['on'], ['off']):
        write_htaccess(args[1] == 'on')
    elif args == ['htaccess', 'status']:
        print('on' if BEGIN in read_htaccess() else 'off')
    else:
        sys.exit(__doc__)
