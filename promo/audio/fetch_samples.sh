#!/usr/bin/env bash
# Fetch the recorded instrument samples used by make_score.py into promo/.cache/vsco.
# Source: VS Chamber Orchestra Community Edition (github.com/sgossner/VSCO-2-CE)
# License: CC0 1.0 (public domain) — commercial use OK, NO attribution required.
set -euo pipefail
DEST="$(cd "$(dirname "$0")/.." && pwd)/.cache/vsco"
if [ ! -d "$DEST/.git" ]; then
  git clone --depth 1 --filter=blob:none --sparse https://github.com/sgossner/VSCO-2-CE "$DEST"
fi
cd "$DEST"
git sparse-checkout set --no-cone "/LICENSE" "/Keys/Upright Nr1/" "/Strings/Violin Section/susVib/" \
  "/Strings/Cello Section/susvib/" "/Strings/Solo Contrabass/SusVib/" "/Strings/Harp/"
head -1 LICENSE
