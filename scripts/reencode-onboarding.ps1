# Re-encode onboarding PNGs (PowerShell)
# Requires: ImageMagick (`magick`) or pngcrush installed and on PATH.
# Run from project root in PowerShell:
#   ./scripts/reencode-onboarding.ps1

$assets = @(
  "assets/images/onboarding/grow.png",
  "assets/images/onboarding/work.png",
  "assets/images/onboarding/connect.png"
)

# Try ImageMagick first
foreach ($p in $assets) {
  if (Test-Path $p) {
    Write-Host "Re-encoding $p with ImageMagick..."
    $tmp = "$p.fixed.png"
    magick convert $p -strip -interlace None -colors 256 $tmp
    if (Test-Path $tmp) {
      Move-Item -Force $tmp $p
      Write-Host "Replaced $p"
    } else {
      Write-Warning "Failed to create $tmp with ImageMagick"
    }
  } else {
    Write-Warning "$p not found"
  }
}

Write-Host "Done. Please `git add` and commit the changed files, then run your EAS build again."
