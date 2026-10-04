#!/usr/bin/env bash
# Tiny client for the 100xFounder content API. Needs XF_SITE_URL, XF_WP_USER, XF_WP_APP_PASSWORD.
set -euo pipefail
: "${XF_SITE_URL:?Set XF_SITE_URL}" "${XF_WP_USER:?Set XF_WP_USER}" "${XF_WP_APP_PASSWORD:?Set XF_WP_APP_PASSWORD}"
API="${XF_SITE_URL%/}/wp-json/xf/v1"
AUTH=(-u "$XF_WP_USER:$XF_WP_APP_PASSWORD")
case "${1:-}" in
  queue)      curl -fsS "${AUTH[@]}" "$API/queue?type=${2:-news}&limit=${3:-3}" ;;
  recent)     curl -fsS "${AUTH[@]}" "$API/recent?days=${2:-3}" ;;
  categories) curl -fsS "${AUTH[@]}" "$API/categories" ;;
  add)        curl -fsS "${AUTH[@]}" -H 'Content-Type: application/json' -d "{\"type\":\"${2}\",\"title\":$(printf '%s' "$3" | python3 -c 'import json,sys;print(json.dumps(sys.stdin.read()))')}" "$API/queue" ;;
  draft)      curl -fsS "${AUTH[@]}" -H 'Content-Type: application/json' --data-binary @"$2" "$API/drafts" ;;
  *) echo "usage: xf.sh queue [type] [limit] | recent [days] | categories | add <type> <title> | draft <file.json>"; exit 1 ;;
esac
echo
