#!/usr/bin/env python3
"""Back up the live site before a deploy (owner, 2026-10-15).

Asks the plugin to make a server backup (database dump + plugin/theme zip, newest 7 kept in
wp-content/xf-backups/), then downloads both files to backups/<id>/ in this repo (gitignored,
newest 14 kept). Exits non-zero if either step fails, so deploys stop.

Credentials come from the macOS Keychain (service 100xfounder-wp, user `author`) and are never
printed. Usage: python3 wordpress/deploy/backup-live.py
"""
import base64, json, os, shutil, subprocess, sys, urllib.request

SITE = "https://100xfounder.com"
USER = os.environ.get("XF_WP_USER", "author")
LOCAL = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "backups")
KEEP_LOCAL = 14


def auth():
    pw = os.environ.get("XF_WP_APP_PASSWORD") or subprocess.run(
        ["security", "find-generic-password", "-s", "100xfounder-wp", "-w"],
        capture_output=True, text=True, check=True).stdout.strip()
    return "Basic " + base64.b64encode(f"{USER}:{pw}".encode()).decode()


def call(method, path, a, timeout=900):
    req = urllib.request.Request(SITE + "/wp-json/xf/v1" + path, method=method,
                                 headers={"Authorization": a, "User-Agent": "xf-backup"})
    return urllib.request.urlopen(req, timeout=timeout)


def backup():
    a = auth()
    made = json.load(call("POST", "/backup", a))
    bid = made["id"]
    dest = os.path.join(LOCAL, bid)
    os.makedirs(dest, exist_ok=True)
    for f, name in (("db", "db.sql.gz"), ("code", "code.zip")):
        if f == "code" and not isinstance(made["files"].get("code"), int):
            print("  server: code zip skipped:", made["files"].get("code"))
            continue
        with call("GET", f"/backup/{bid}/{f}", a) as r, open(os.path.join(dest, name), "wb") as out:
            shutil.copyfileobj(r, out)
        size = os.path.getsize(os.path.join(dest, name))
        if size != made["files"][f]:
            raise SystemExit(f"backup {bid}: {name} downloaded {size} bytes, server has {made['files'][f]}")
    for old in sorted(os.listdir(LOCAL))[:-KEEP_LOCAL]:
        shutil.rmtree(os.path.join(LOCAL, old), ignore_errors=True)
    print(f"Backup {bid}: server wp-content/xf-backups/{bid}/, local {os.path.relpath(dest)}")
    return bid


if __name__ == "__main__":
    try:
        backup()
    except Exception as e:  # any failure must stop the deploy
        sys.exit(f"Backup failed, not deploying: {e}")
