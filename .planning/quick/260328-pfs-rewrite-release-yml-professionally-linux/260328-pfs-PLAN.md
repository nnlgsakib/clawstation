---
quick_id: "260328-pfs"
mode: quick
date: 2026-03-28
---

# Quick Task 260328-pfs: Rewrite release.yml professionally

## Problem

The current release.yml builds artifacts for all architectures but fails to create GitHub Releases on tag push. The release job's artifact collection and GitHub Release creation are broken.

## Solution

Delete the existing release.yml and write a new one from scratch with:
- Linux (x86_64 + aarch64) and Windows (x86_64) builds only — no macOS
- Proper artifact upload/download pipeline
- GitHub Release creation with SHA-256 checksums
- Auto-generated changelogs
- Prerelease detection for beta/rc/rc tags
- Tauri updater signature support

## Task 1: Write new release.yml

**Files:** `.github/workflows/release.yml`
**Action:** Replace entire file with professional release workflow
**Verify:** YAML is valid, workflow triggers on tag push, creates GitHub Release
**Done:** File written, syntax correct
