---
phase: quick
plan: 260327-bu3
subsystem: installation
tags: [docker, install, pre-built-image, gateway-config]
tech-stack: [tauri, rust, docker, docker-compose]
key-files:
  - src-tauri/src/install/docker_install.rs
decisions: []
---

# Quick Task 260327-bu3: Fix Docker Installation to Use Pre-Built Image Summary

## One-liner
Replaced broken `docker compose up --build -d` (builds from source, 10+ min, OOM-prone) with correct flow: pull pre-built image, write complete .env, configure gateway, start gateway.

## Changes Made

### `src-tauri/src/install/docker_install.rs`

**Added `OPENCLAW_IMAGE` constant** (line 11):
- `ghcr.io/openclaw/openclaw:latest` — official pre-built image

**Expanded `.env` file** (Step 4, lines 207-217):
- Now includes all 7 required vars: `OPENCLAW_IMAGE`, `OPENCLAW_CONFIG_DIR`, `OPENCLAW_WORKSPACE_DIR`, `OPENCLAW_GATEWAY_TOKEN`, `OPENCLAW_GATEWAY_PORT`, `OPENCLAW_BRIDGE_PORT`, `OPENCLAW_GATEWAY_BIND=lan`

**Created required subdirectories** (Step 4, lines 228-231):
- `identity/`, `agents/main/agent/`, `agents/main/sessions/` under config_dir

**New Step 5a — Pull pre-built image** (lines 233-269):
- `docker pull ghcr.io/openclaw/openclaw:latest`
- Streams stderr progress to log viewer
- Fails with clear error if pull fails

**New Step 5b — Configure gateway** (lines 271-307):
- Runs 3 `docker compose run --rm --no-deps -T --entrypoint node openclaw-gateway dist/index.js config set ...` commands:
  - `gateway.mode local`
  - `gateway.bind lan`
  - `gateway.controlUi.allowedOrigins` with localhost URLs
- Inlined (no closure) to avoid Rust lifetime issues

**New Step 5c — Start gateway** (lines 309-342):
- `docker compose up -d openclaw-gateway` (no `--build` flag)
- Streams output to log viewer

**Updated progress step labels**:
- `cloning_repo` (20-30%) for git operations
- `writing_env` (35%) for .env generation
- `pulling_image` (40-55%) for docker pull
- `configuring` (60%) for gateway config
- `starting_gateway` (75-85%) for compose up
- `verifying` (90%) for health check
- `complete` (100%) for success

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Rust lifetime error with closure**
- **Found during:** `cargo check`
- **Issue:** The `run_config` closure capturing `&AppHandle` in an async block caused lifetime errors
- **Fix:** Replaced closure with inlined loop over config command definitions
- **Files modified:** `src-tauri/src/install/docker_install.rs`
- **Commit:** f838e0a

## Verification

- `cargo check --manifest-path src-tauri/Cargo.toml` — PASSED (1 pre-existing warning about unused `emit_log_lines`)
- `.env` contains all 7 required vars
- No `--build` flag in any docker compose command
- Image pull uses `ghcr.io/openclaw/openclaw:latest`
- Progress percentages increase monotonically from 5% to 100%

## Self-Check: PASSED
- ✅ src-tauri/src/install/docker_install.rs exists
- ✅ SUMMARY.md exists
- ✅ Commit f838e0a exists
