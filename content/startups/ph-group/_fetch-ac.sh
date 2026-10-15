#!/bin/bash
# Re-fetch missing PH extracts politely: back off 3 min on a rate-limit, 30s between pages.
cd "$(dirname "$0")"
for u in $(cat part-ac); do
  s=${u##*/}; [ $s = portfolio-lab ] && continue
  for try in 1 2 3 4 5 6; do
    grep -q '"websiteUrl"' _ph-ac/$s.json 2>/dev/null && break
    /usr/bin/python3 ph_extract.py "$u" _ph-ac/$s.json
    grep -q '"websiteUrl"' _ph-ac/$s.json || sleep 180
  done
  sleep 30
done
echo DONE
