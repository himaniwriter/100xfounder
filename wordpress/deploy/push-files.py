#!/usr/bin/env python3
"""Deploy a handful of changed files to the live site (owner, 2026-10-15: work on live,
back up first).

    python3 wordpress/deploy/push-files.py <staging dir> <remote dir> <file to upload last>

<staging dir> mirrors the remote layout, e.g. stg/includes/foo.php -> <remote dir>/includes/foo.php.
<remote dir> is relative to public_html, e.g. wp-content/plugins/100xfounder.
The main plugin file (or theme functions.php) goes last so the site never loads a half update.
Runs backup-live.py first and stops if it fails. Token: HOSTINGER_API_TOKEN, else the
Keychain entry 100xfounder-hostinger.
"""
import importlib.util
import os
import subprocess
import sys
import time
import urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
if not os.environ.get("HOSTINGER_API_TOKEN"):
    os.environ["HOSTINGER_API_TOKEN"] = subprocess.run(
        ["security", "find-generic-password", "-s", "100xfounder-hostinger", "-w"],
        capture_output=True, text=True).stdout.strip()
ARGS = sys.argv[1:]
if len(ARGS) != 3:
    sys.exit(__doc__)
sys.argv = ["x"]  # the deploy module parses argv on import
spec = importlib.util.spec_from_file_location("d", os.path.join(HERE, "deploy-hostinger-api.py"))
d = importlib.util.module_from_spec(spec)
spec.loader.exec_module(d)


def creds():
    for i in range(10):
        try:
            return d.upload_creds()
        except BaseException as e:  # flaky upload-urls endpoint: retry
            print("creds retry", i, str(e)[:80], flush=True)
            time.sleep(20)
    raise SystemExit("no upload creds")


def push(src, dest, last):
    c, files, fails = creds(), [], []
    for root, _, fs in os.walk(src):
        for f in fs:
            if not f.startswith("."):
                p = os.path.join(root, f)
                files.append((p, os.path.relpath(p, src)))
    files.sort(key=lambda x: x[1] == last)
    for p, rel in files:
        for _ in range(5):
            try:
                d.upload(c, p, dest + "/" + rel)
                break
            except BaseException:
                time.sleep(5)
                c = creds()
        else:
            fails.append(rel)
    print(dest, len(files), "fails", fails, flush=True)
    return fails


subprocess.run([sys.executable, os.path.join(HERE, "backup-live.py")], check=True)
fails = push(*ARGS)
time.sleep(5)
print("home", urllib.request.urlopen("https://100xfounder.com/?v=z" + str(time.time()), timeout=30).status)
sys.exit(1 if fails else 0)
