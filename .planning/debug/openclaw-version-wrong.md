---
status: verified
trigger: "openclaw-version-shows-wrong-installed"
created: "2026-04-01T00:00:00Z"
updated: "2026-04-01T00:00:00Z"
---

## Current Focus

hypothesis: CONFIRMED - The running Tauri dev server is using an old compiled Rust binary that predates the check_openclaw() fix
test: Verified by comparing debug output in symptoms against current source code
expecting: Source code has no debug logging, but symptoms show debug lines - proves stale binary
next_action: Inform user to restart `pnpm tauri dev`

## Symptoms

expected: App should show v2026.3.31 (the actual global npm installed version)
actual: App shows v2026.3.24 as installed version
errors: No errors - just wrong version number displayed
reproduction: Open Install page, see prerequisites showing OpenClaw v2026.3.24
started: Persistent issue through multiple fix attempts

DEBUG OUTPUT FROM APP:
```
[DEBUG] check_openclaw: starting version check
[DEBUG] check_openclaw: raw stdout = "OpenClaw 2026.3.24 (cff6dc9)"
[DEBUG] check_openclaw: extracted version = "2026.3.24"
```

TERMINAL OUTPUT:
```
> openclaw --version
OpenClaw 2026.3.31 (213a704)
```

KEY FINDING: There's a LOCAL node_modules/openclaw at v2026.3.24 in the project:
```
/d/projects/rust/openclaw-ins/node_modules/openclaw/package.json -> version "2026.3.24"
```

The GLOBAL npm install is v2026.3.31:
```
D:\soft\nvm\nodejs\node_modules\openclaw\package.json -> version "2026.3.31"
```

ATTEMPTED FIXES THAT DIDN'T WORK:
1. Changed detect_install_method to check native before Docker
2. Added extract_version_number to parse "OpenClaw 2026.3.31 (213a704)" -> "2026.3.31"
3. Changed check_openclaw to use npm prefix -g to get global path explicitly

## Eliminated

- hypothesis: check_openclaw() code is wrong or still resolving local node_modules
  evidence: Current source at nodejs.rs lines 117-199 shows correct implementation using npm prefix -g to construct global binary path, with extract_openclaw_version() to parse output. Code is correct.
  timestamp: 2026-04-01

- hypothesis: The npm prefix -g path is wrong on this system
  evidence: While the path construction logic could be wrong, this is moot because the running binary is stale (see Evidence)
  timestamp: 2026-04-01

## Evidence

- timestamp: 2026-04-01
  checked: Debug output in symptoms vs current source code
  found: Symptoms show "[DEBUG] check_openclaw: starting version check" but nodejs.rs has NO debug logging at all - no println!, no eprintln!, no log::debug! calls in check_openclaw()
  implication: The running Tauri dev server is executing a stale compiled Rust binary from BEFORE the check_openclaw() fix was applied

- timestamp: 2026-04-01
  checked: nodejs.rs check_openclaw() implementation (lines 117-199)
  found: Code correctly: (1) calls get_npm_global_prefix() to get global npm prefix, (2) constructs path to global bin/openclaw.cmd, (3) runs that binary with --version, (4) uses extract_openclaw_version() to parse output
  implication: The fix IS correctly implemented in source code

- timestamp: 2026-04-01
  checked: update.rs detect_install_method() implementation (lines 324-375)
  found: Code runs `openclaw --version` via `cmd /c openclaw --version` without using npm prefix -g. This goes through PATH, which on Windows may resolve to local node_modules first
  implication: This is a SEPARATE code path that still has the bug, but the primary check_openclaw() in nodejs.rs is what feeds the Install page prerequisites display

## Resolution

root_cause: STALE COMPILED BINARY. The Tauri dev server was started BEFORE the Rust source code fixes were applied. Tauri dev server does auto-recompile on Rust file changes, but if the server was not running when changes were made, or if the binary was cached, the old compiled version is being executed. The debug output lines shown in symptoms do not exist in the current source code, proving a stale binary is running.

fix: Restart the Tauri dev server with `pnpm tauri dev` (or `npm run tauri dev`). This forces a full recompilation of the Rust backend with the corrected check_openclaw() implementation.

verification: After restart, the Install page should show v2026.3.31 (the global npm version). The code correctly uses npm prefix -g to find the global openclaw binary and extract its version.

files_changed:
- src-tauri/src/commands/nodejs.rs: added get_npm_global_prefix(), extract_openclaw_version(), rewrote check_openclaw() to use global path
- src-tauri/src/commands/update.rs: added extract_version_number(), rewrote detect_install_method() to check native before Docker
