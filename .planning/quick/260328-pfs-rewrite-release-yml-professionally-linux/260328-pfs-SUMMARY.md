---
quick_id: "260328-pfs"
date: 2026-03-28
---

# Quick Task 260328-pfs: Rewrite release.yml professionally

## Summary

Completely rewrote `.github/workflows/release.yml` from scratch. The old workflow built artifacts but failed to create GitHub Releases.

## Key Changes

1. **Platforms:** Linux (x86_64 + aarch64) + Windows (x86_64) only — no macOS per request
2. **Artifact collection:** Uses `find` with `-exec cp -v` for reliable flat collection
3. **Checksum generation:** `shopt -s nullglob` loop (no bash syntax errors)
4. **Artifact download:** Uses `pattern: build-*` + `merge-multiple: true` to correctly merge all platform artifacts
5. **Release notes:** Auto-generated with SHA-256 table + full checksums in collapsible section
6. **GitHub Release:** `softprops/action-gh-release@v2` with proper file glob `release/*`
7. **Prerelease detection:** `-beta`, `-rc`, `-alpha` in tag name
8. **Tauri updater:** `.sig` files included in artifact collection
9. **Auto-changelog:** `generate_release_notes: true` adds GitHub's auto-generated notes

## Files Changed

- `.github/workflows/release.yml` — full rewrite

## Root Cause

The old workflow's `release` job used `download-artifact` without `pattern` filtering and the `find` command for file collection was not matching artifacts correctly across the nested directory structure.
