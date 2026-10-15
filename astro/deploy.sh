#!/usr/bin/env bash
# Rebuild the Astro front end from WordPress and publish it to public_html/astro/.
# WordPress stays the source of truth; this only snapshots it. Safe to run on a schedule:
# it stops before uploading if the build fails or the parity gate finds an SEO/outline difference.
#   bash astro/deploy.sh            build, check, upload
#   SKIP_UPLOAD=1 bash astro/deploy.sh   build and check only
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"
WP_URL="${XF_WP_URL:-https://100xfounder.com}"

[[ -d node_modules ]] || npm ci --no-audit --no-fund
rm -rf dist
XF_WP_URL="$WP_URL" npm run build --silent

# Parity gate against WordPress's own rendering (a query string bypasses the static page).
python3 parity.py dist/index.html "$WP_URL/?nocache=$(date +%s)"

[[ "${SKIP_UPLOAD:-}" == 1 ]] && { echo "Built and checked; upload skipped."; exit 0; }
python3 upload.py push dist astro
code=$(curl -s -o /dev/null -w '%{http_code}' "$WP_URL/")
[[ "$code" == 200 ]] || { echo "Home returned $code after upload" >&2; exit 1; }
echo "Deployed $(date '+%Y-%m-%d %H:%M:%S')"
