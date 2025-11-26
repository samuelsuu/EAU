#!/usr/bin/env bash
# Re-encode onboarding PNGs (Linux / macOS)
# Requires ImageMagick (`magick`) or pngcrush / zopflipng in PATH.
# Run from project root:
#   ./scripts/reencode-onboarding.sh

set -euo pipefail

ASSETS=(
  "assets/images/onboarding/grow.png"
  "assets/images/onboarding/work.png"
  "assets/images/onboarding/connect.png"
)

for p in "${ASSETS[@]}"; do
  if [ -f "$p" ]; then
    echo "Re-encoding $p with ImageMagick..."
    tmp="$p.fixed.png"
    if command -v magick >/dev/null 2>&1; then
      magick convert "$p" -strip -interlace None -colors 256 "$tmp"
      mv -f "$tmp" "$p"
      echo "Replaced $p"
    elif command -v pngcrush >/dev/null 2>&1; then
      echo "Using pngcrush..."
      pngcrush -rem alla -reduce -ow "$p"
    else
      echo "Neither ImageMagick nor pngcrush found. Install one of them and re-run this script." >&2
      exit 1
    fi
  else
    echo "$p not found, skipping"
  fi
done

echo "Done. Please git add/commit the changed files and re-run your EAS build."
