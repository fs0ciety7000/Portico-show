#!/usr/bin/env bash
# Renders the packages of the latest Portico release that cannot reach their
# usual home yet, with Portico's own render scripts (same files as the ones
# meant for those channels), and publishes them on this site:
#   - Arch Linux: public/arch/<package>/PKGBUILD (AUR registration is closed)
#     -> `makepkg -si` on one of them
#   - Scoop: public/scoop/portico.json (until the bucket is published)
#     -> `scoop install https://<site>/scoop/portico.json`
#
# Reads the version from src/data/upstream.json (run sync-upstream.mjs first).
# Writes src/data/packages.json ({ version, arch, scoop }) for the site, and
# prints `changed` or `unchanged`.
set -euo pipefail

root=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
repo=$(node -p "require('$root/src/data/upstream.json').repo")
tag=$(node -p "require('$root/src/data/upstream.json').release?.tag ?? ''")
[ -n "$tag" ] || { echo "no release" >&2; echo unchanged; exit 0; }
version=${tag#v}

tmp=$(mktemp -d)
trap 'rm -rf "$tmp"' EXIT

# Portico at the release tag: packaging/ and the licence files (their sums go in portico-gui-bin).
git -c advice.detachedHead=false clone --quiet --depth 1 --branch "$tag" --filter=blob:none --sparse "https://github.com/$repo" "$tmp/portico"
git -C "$tmp/portico" sparse-checkout set --no-cone /packaging/ /LICENSE-MIT /LICENSE-APACHE
curl -fsSL -o "$tmp/SHA256SUMS" "https://github.com/$repo/releases/download/$tag/SHA256SUMS"

snapshot() { (cat "$root"/public/arch/*/PKGBUILD "$root"/public/scoop/*.json 2>/dev/null || true) | sha256sum; }
before=$(snapshot)
export PORTICO_REPO_URL="https://github.com/$repo"

# Arch Linux
arch=()
if LICENSE_DIR="$tmp/portico" bash "$tmp/portico/packaging/aur/render.sh" "$version" "$tmp/SHA256SUMS" "$tmp/aur" > /dev/null 2>&1; then
  rm -rf "$root/public/arch"
  for dir in "$tmp"/aur/*/; do
    pkg=$(basename "$dir")
    mkdir -p "$root/public/arch/$pkg"
    cp "$dir/PKGBUILD" "$root/public/arch/$pkg/PKGBUILD"
    arch+=("\"$pkg\"")
  done
else
  echo "warning: no Arch packages for $tag" >&2
fi

# Scoop (only when the release has a Windows build and Portico has the template)
scoop=false
if [ -x "$tmp/portico/packaging/scoop/render.sh" ] || [ -f "$tmp/portico/packaging/scoop/render.sh" ]; then
  if bash "$tmp/portico/packaging/scoop/render.sh" "$version" "$tmp/SHA256SUMS" "$tmp/scoop" > /dev/null 2>&1; then
    mkdir -p "$root/public/scoop"
    cp "$tmp/scoop/bucket/portico.json" "$root/public/scoop/portico.json"
    scoop=true
  else
    echo "warning: no Scoop manifest for $tag" >&2
  fi
fi
[ "$scoop" = true ] || rm -rf "$root/public/scoop"

after=$(snapshot)
printf '{\n  "version": "%s",\n  "arch": [%s],\n  "scoop": %s\n}\n' \
  "$version" "$(IFS=,; echo "${arch[*]}" | sed 's/,/, /g')" "$scoop" > "$root/src/data/packages.json"
[ "$before" = "$after" ] && echo unchanged || echo changed
