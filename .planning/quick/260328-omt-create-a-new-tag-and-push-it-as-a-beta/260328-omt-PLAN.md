---
quick_id: "260328-omt"
mode: quick
date: 2026-03-28
---

# Quick Task 260328-omt: Create a new tag and push it as a beta

## Task 1: Create and push beta tag

**Files:** None (git operations only)
**Action:**
1. Determine next beta version: current tag is `v1.0`, so create `v1.1.0-beta.1`
2. Create annotated git tag `v1.1.0-beta.1` with message "Beta release v1.1.0-beta.1"
3. Push the tag to origin with `git push origin v1.1.0-beta.1`

**Verify:** `git tag -l "v1.1.0-beta.1"` returns the tag, and `git ls-remote --tags origin` shows it on remote
**Done:** Tag `v1.1.0-beta.1` exists locally and is pushed to origin
