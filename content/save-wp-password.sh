#!/bin/bash
# Saves a WordPress application password for 100xfounder.com in the macOS Keychain,
# checks it works, and never prints it. Claude's upload scripts read it from there:
#   XF_WP_USER=$(security find-generic-password -s 100xfounder-wp -g 2>&1 | sed -n 's/.*"acct"<blob>="\(.*\)"/\1/p')
#   XF_WP_APP_PASSWORD=$(security find-generic-password -s 100xfounder-wp -w)
#
# Create the password first: WP admin → Users → (your user) → Application Passwords →
# name it "claude-uploads" → Add New → copy the 24-character code.
set -euo pipefail
SITE="https://100xfounder.com"

read -r -p "WordPress username (e.g. xf_owner): " WPUSER
read -r -s -p "Application password (input hidden): " WPPASS; echo
WPPASS="${WPPASS// /}"   # WordPress shows it in groups of four; spaces are optional

CODE=$(curl -s -o /tmp/xf-wp-check.json -w '%{http_code}' -u "$WPUSER:$WPPASS" "$SITE/wp-json/wp/v2/users/me?context=edit")
if [ "$CODE" != "200" ]; then
  echo "WordPress refused it (HTTP $CODE). Check the username and that you copied the whole password."
  rm -f /tmp/xf-wp-check.json; exit 1
fi
ROLE=$(grep -o '"roles":\[[^]]*\]' /tmp/xf-wp-check.json | sed 's/"roles":\[//; s/\]//; s/"//g' || true)
rm -f /tmp/xf-wp-check.json

security delete-generic-password -s 100xfounder-wp >/dev/null 2>&1 || true
security add-generic-password -s 100xfounder-wp -a "$WPUSER" -w "$WPPASS"
unset WPPASS
echo "Saved in Keychain as \"100xfounder-wp\" for $WPUSER (role: $ROLE). Tell Claude: \"password saved\"."
