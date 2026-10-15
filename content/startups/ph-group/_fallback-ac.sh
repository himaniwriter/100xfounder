#!/bin/bash
# Re-fetch launch stats + makers for multi-launch products whose launch block PH doesn't server-render.
cd "$(dirname "$0")"
for s in "$@"; do
  u=https://www.producthunt.com/posts/$s
  /usr/bin/python3 ph_extract.py "$u" _ph-ac/$s.json --fallback
  sleep 25
done
echo DONE
