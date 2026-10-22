#!/usr/bin/env bash
# Renders the Arch Linux packages of the latest Portico release with Portico's
# own packaging/aur/render.sh (same PKGBUILDs as the ones meant for the AUR),
# and publishes them on this site under public/arch/<package>/PKGBUILD.
# While AUR registration is closed, this is how Arch users get a pacman
# package: `makepkg -si` on one of these PKGBUILDs.
#
# Reads the version from src/data/upstream.json (run sync-upstream.mjs first).
# Writes src/data/arch.json ({ version, packages }) for the site, and prints
# `changed` or `unchanged`.
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
git -C "$tmp/portico" sparse-checkout set --no-cone /packaging/aur/ /LICENSE-MIT /LICENSE-APACHE
curl -fsSL -o "$tmp/SHA256SUMS" "https://github.com/$repo/releases/download/$tag/SHA256SUMS"

PORTICO_REPO_URL="https://github.com/$repo" LICENSE_DIR="$tmp/portico" \
  bash "$tmp/portico/packaging/aur/render.sh" "$version" "$tmp/SHA256SUMS" "$tmp/out" > /dev/null

before=$( (cat "$root"/public/arch/*/PKGBUILD 2>/dev/null || true) | sha256sum)
packages=()
for dir in "$tmp"/out/*/; do
  pkg=$(basename "$dir")
  mkdir -p "$root/public/arch/$pkg"
  cp "$dir/PKGBUILD" "$root/public/arch/$pkg/PKGBUILD"
  packages+=("\"$pkg\"")
done
after=$(cat "$root"/public/arch/*/PKGBUILD | sha256sum)

printf '{\n  "version": "%s",\n  "packages": [%s]\n}\n' "$version" "$(IFS=,; echo "${packages[*]}" | sed 's/,/, /g')" > "$root/src/data/arch.json"
[ "$before" = "$after" ] && echo unchanged || echo changed
