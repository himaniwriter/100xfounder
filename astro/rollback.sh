#!/usr/bin/env bash
# Hand pages back to WordPress.
#   bash astro/rollback.sh        remove the "100xFounder Astro" block from public_html/.htaccess (downloaded,
#                                 backed up to backups/, edited, uploaded, verified): WordPress serves every URL.
#                                 Re-enable with: python3 astro/upload.py htaccess on
#   bash astro/rollback.sh A      one stage (A-E, see deploy.sh): drop it from stages.txt and blank its live
#                                 pages (zero-byte index.html), so WordPress serves them; the rest stays static.
#                                 Re-enable: add the letter back to stages.txt and run bash astro/deploy.sh
set -euo pipefail
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/bin:/bin:$PATH"
if [[ -z "${1:-}" ]]; then
  python3 upload.py htaccess off
  exit
fi
stage=$(tr '[:lower:]' '[:upper:]' <<<"$1")
[[ "$stage" =~ ^[A-E]$ ]] || { echo "Stage must be one of A-E." >&2; exit 1; }
[[ -f .cache/stage-$stage.txt ]] || { echo "No .cache/stage-$stage.txt (run a deploy with that stage first)." >&2; exit 1; }
tr -d ' \n' < stages.txt 2>/dev/null | tr ',' '\n' | grep -vx "$stage" | grep . | paste -sd, - > stages.txt.new || true
mv stages.txt.new stages.txt
python3 upload.py blank ".cache/stage-$stage.txt"
echo "Stage $stage handed back to WordPress; live stages: $(cat stages.txt)"
