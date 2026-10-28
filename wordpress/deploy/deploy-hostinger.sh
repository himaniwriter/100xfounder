#!/usr/bin/env bash
# Deploys the 100xFounder plugin + theme to WordPress on Hostinger over SSH.
#
# One-time, in hPanel:
#   1. Back up the current site (Files → File Manager → download public_html).
#   2. Websites → 100xfounder.com → Auto Installer → WordPress (creates the database and admin login).
#   3. Advanced → SSH Access: enable SSH; optionally add your public key so you aren't asked for the password.
#
# Run from the repo root on YOUR computer (never commit passwords):
#   XF_SSH_HOST=145.79.213.114 XF_SSH_PORT=65002 XF_SSH_USER=u840917216 \
#   XF_WP_PATH=domains/100xfounder.com/public_html bash wordpress/deploy/deploy-hostinger.sh
set -euo pipefail

: "${XF_SSH_HOST:?Set XF_SSH_HOST}" "${XF_SSH_USER:?Set XF_SSH_USER}"
PORT="${XF_SSH_PORT:-65002}"
WP_PATH="${XF_WP_PATH:-domains/100xfounder.com/public_html}"
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="$XF_SSH_USER@$XF_SSH_HOST"
SSH=(ssh -p "$PORT" -o ServerAliveInterval=30 "$REMOTE")
STAMP="$(date +%Y%m%d-%H%M%S)"

echo "→ Building plugin and theme zips…"
mkdir -p "$HERE/dist"
( cd "$HERE" && rm -f dist/100xfounder.zip dist/100xfounder-theme.zip \
  && zip -qr dist/100xfounder.zip 100xfounder -x '*.DS_Store' \
  && zip -qr dist/100xfounder-theme.zip 100xfounder-theme -x '*.DS_Store' )

echo "→ Checking the server (you may be asked for the SSH password)…"
"${SSH[@]}" "cd '$WP_PATH' && command -v wp >/dev/null && wp core is-installed" || {
  echo "✗ WordPress isn't installed at ~/$WP_PATH (or WP-CLI is missing)."
  echo "  Install WordPress with hPanel's Auto Installer first, then run this again."
  exit 1
}

echo "→ Backing up the database to ~/xf-backups/db-$STAMP.sql…"
"${SSH[@]}" "mkdir -p ~/xf-backups && cd '$WP_PATH' && wp db export ~/xf-backups/db-$STAMP.sql --quiet"

echo "→ Uploading…"
scp -P "$PORT" -q "$HERE/dist/100xfounder.zip" "$HERE/dist/100xfounder-theme.zip" "$REMOTE:xf-backups/"

echo "→ Installing and activating…"
"${SSH[@]}" bash -s <<REMOTE_SCRIPT
set -e
cd '$WP_PATH'
wp plugin install ~/xf-backups/100xfounder.zip --force --activate --quiet
wp theme install ~/xf-backups/100xfounder-theme.zip --force --activate --quiet
wp rewrite structure '/%postname%/' --quiet
wp eval '\$p = get_option("xf_pages"); if (!empty(\$p["home"])) { update_option("show_on_front", "page"); update_option("page_on_front", \$p["home"]); }'
wp rewrite flush --quiet
wp cache flush --quiet || true
echo "Active theme: \$(wp theme list --status=active --field=name)"
echo "Plugin: \$(wp plugin get 100xfounder --field=version)"
REMOTE_SCRIPT

echo "✓ Deployed. Check https://100xfounder.com and finish setup under 100xFounder → Settings."
echo "  Database backup: ~/xf-backups/db-$STAMP.sql on the server."
