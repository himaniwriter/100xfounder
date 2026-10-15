#!/usr/bin/env bash
# Rebuild the Astro front end from WordPress and publish it to public_html/astro/.
# WordPress stays the source of truth; this only snapshots it. Safe to run on a schedule:
# nothing is uploaded if the build fails; a page the parity gate finds different from WordPress is not
# uploaded (the home keeps its last good version; an article is handed back to WordPress).
# Routes: "/" (index.astro) and every published post "/{slug}/" ([...slug].astro).
#   bash astro/deploy.sh            build, check, upload
#   SKIP_UPLOAD=1 bash astro/deploy.sh   build and check only
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"
WP_URL="${XF_WP_URL:-https://100xfounder.com}"
# One deploy at a time (the scheduled task and a manual run share dist/ and the upload manifest).
mkdir .deploy.lock 2>/dev/null || { echo "Another deploy is running (astro/.deploy.lock); not starting." >&2; exit 1; }
trap 'rmdir .deploy.lock' EXIT

[[ -d node_modules ]] || npm ci --no-audit --no-fund
rm -rf dist dist-skipped
XF_WP_URL="$WP_URL" npm run build --silent

# Parity gate against WordPress's own rendering (a query string bypasses the static page).
home_ok=1
python3 parity.py dist/index.html "$WP_URL/?nocache=$(date +%s)" || { home_ok=0; rm -f dist/index.html; }
python3 parity.py posts dist "$WP_URL"   # moves any article that differs to dist-skipped/

[[ "${SKIP_UPLOAD:-}" == 1 ]] && { echo "Built and checked; upload skipped."; exit 0; }
python3 upload.py sync dist astro       # changed files only; skipped/removed articles become zero-byte
code=$(curl -s -o /dev/null -w '%{http_code}' "$WP_URL/")
[[ "$code" == 200 ]] || { echo "Home returned $code after upload" >&2; exit 1; }
[[ $home_ok == 1 ]] || { echo "Home failed the parity gate; its last good version stays live." >&2; exit 1; }
echo "Deployed $(date '+%Y-%m-%d %H:%M:%S')"
