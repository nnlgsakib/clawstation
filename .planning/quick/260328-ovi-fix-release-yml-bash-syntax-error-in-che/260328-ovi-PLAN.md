---
quick_id: "260328-ovi"
mode: quick
date: 2026-03-28
---

# Quick Task 260328-ovi: Fix release.yml bash syntax error in checksum loop

## Problem

The "Prepare release assets" step in `.github/workflows/release.yml` line 94 has a broken `for` loop:

```bash
for f in *.AppImage *.deb *.rpm *.msi *.exe *.dmg *.zip 2>/dev/null; do
```

The `2>/dev/null` cannot redirect glob expansion in a `for` loop. When globs don't match (e.g., no `.AppImage` files on a Windows build), bash treats `*` as a literal token and the `2` causes a syntax error: `syntax error near unexpected token '2'`.

## Fix

Replace the broken loop with `shopt -s nullglob` which properly handles unmatched globs by expanding them to nothing (empty list) instead of literal strings.

## Task 1: Fix the checksum loop in release.yml

**Files:** `.github/workflows/release.yml`
**Action:** Replace lines 93-102 with nullglob-based approach:

```bash
cd release-artifacts
shopt -s nullglob
for f in *.AppImage *.deb *.rpm *.msi *.exe *.dmg *.zip; do
  if command -v sha256sum &> /dev/null; then
    sha256sum "$f" > "$f.sha256"
  else
    shasum -a 256 "$f" > "$f.sha256"
  fi
  echo "Checksummed: $f"
done
shopt -u nullglob
```

**Verify:** The `for` loop no longer has `2>/dev/null` appended, uses `shopt -s nullglob` before the loop
**Done:** File is valid YAML, bash syntax is correct
