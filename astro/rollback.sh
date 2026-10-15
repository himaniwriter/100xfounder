#!/usr/bin/env bash
# Hand "/" back to WordPress: remove the "100xFounder Astro" block from public_html/.htaccess
# (downloaded, backed up to backups/, edited, uploaded, verified). Re-enable with:
#   python3 astro/upload.py htaccess on
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"
python3 upload.py htaccess off
