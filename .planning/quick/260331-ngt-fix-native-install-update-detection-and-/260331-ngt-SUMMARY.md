---
phase: quick
plan: 260331-ngt
subsystem: update
tags: [native-install, update, linux, error-messages]
key-files:
  modified:
    - src-tauri/src/commands/update.rs
    - src/lib/errors.ts
tech-stack:
  - Rust (install method detection)
  - TypeScript (error messages)
decisions: []
---

# Quick Task 260331-ngt: Fix Native Install Update Detection and Error Messages

## One-liner

Native install update detection now works on Linux (npx fallback is no longer Windows-only), and error messages for native users no longer mention Docker.

## Root Cause

1. **`npx openclaw --version` fallback was Windows-only** — `detect_install_method()` only tried `npx` on Windows. Linux users with npm-installed openclaw not on PATH got "unknown" install method.
2. **No config-directory detection** — If `~/.openclaw/` exists with config files but no `docker-compose.yml`, it's clearly a native install, but the code didn't check for this.
3. **Error messages mentioned Docker for native users** — The `update_failed` suggestion and the unknown-method error both referenced Docker, confusing native-only users.

## What Was Done

### Rust (`update.rs`)

- Made `npx openclaw --version` fallback work on all platforms (was Windows-only)
- Added config-directory check: if `~/.openclaw/` exists with `openclaw.json`/`config.yaml`/etc., assume native install
- Changed unknown-method error to: "Cannot determine how OpenClaw was installed" with npm-specific suggestion

### TypeScript (`errors.ts`)

- Simplified `update_failed` suggestion to remove Docker mention: "Check your internet connection and try again. For native installs, run: npm install -g openclaw@latest"

## Commits

| Hash | Message |
|------|---------|
| `6a6b9ec` | `fix: native install update detection works on Linux, error messages no longer mention Docker` |

## Self-Check: PASSED

- [x] `cargo check` passes
- [x] `npx tsc --noEmit` passes
- [x] npx fallback works on all platforms
- [x] Error messages are native-install-friendly
