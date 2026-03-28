---
quick_id: "260328-ovi"
date: 2026-03-28
---

# Quick Task 260328-ovi: Fix release.yml bash syntax error in checksum loop

## Summary

Fixed bash syntax error in `.github/workflows/release.yml` "Prepare release assets" step.

## Problem

Line 94 had `for f in *.AppImage *.deb *.rpm *.msi *.exe *.dmg *.zip 2>/dev/null; do` — the `2>/dev/null` cannot redirect glob expansion in a `for` loop. When globs don't match (e.g., no `.AppImage` files on Windows builds), bash treats `*` as a literal token and `2` as a syntax error:

```
/home/runner/work/_temp/xxx.sh: line 13: syntax error near unexpected token `2'
```

## Fix

Replaced the broken `2>/dev/null` approach with `shopt -s nullglob`:
- Added `shopt -s nullglob` before the loop (unmatched globs expand to empty)
- Removed `[ -f "$f" ] || continue` (no longer needed with nullglob)
- Added `shopt -u nullglob` after the loop to restore default behavior

## Files Changed

- `.github/workflows/release.yml` — lines 93-102

## Verification

- Bash syntax is correct with nullglob
- Loop handles all platforms: Linux (has .AppImage/.deb/.rpm), Windows (has .msi/.exe), macOS (has .dmg)
- When no files match a pattern, nullglob silently skips it
