---
status: awaiting_human_verify
trigger: "After reinstalling OpenClaw via the 'Reinstall' button, the UI shows 'Update available: unknown → 2026.3.31' — the current installed version is detected as 'unknown' instead of the actual version (2026.3.31). This happens in dev mode."
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T00:05:00Z
---

## Current Focus
hypothesis: RESOLVED — detect_install_method() used resolve_command_path("openclaw") which searches the PROCESS PATH via `where openclaw`, but the Tauri dev process PATH doesn't include npm global bin directory. Fixed by using get_npm_global_prefix() to find the global binary directly, bypassing PATH entirely.
test: Code compiles successfully
expecting: Fix verified via cargo check
next_action: Request human verification

## Symptoms

expected: After reinstall, show current version as 2026.3.31 (the version just installed)
actual: Shows "Update available: unknown → 2026.3.31" — current version is "unknown"
errors: No errors visible, just "unknown" version string
reproduction: Click "Reinstall" button, wait for install to complete, check version display on Install page
timeline: Happens consistently after reinstall in dev mode

## Eliminated

- hypothesis: Version check not being called after reinstall completes
  evidence: UI calls checkPrereqs() after reinstall, which calls check_openclaw() — that works correctly. The bug is in check_openclaw_update() which is called when user clicks "Check for Updates", not in the post-reinstall refresh.
  timestamp: 2026-04-01T00:02:00Z

- hypothesis: Stale cached state in frontend
  evidence: The "unknown" comes from backend detect_install_method(), not from frontend caching. The frontend correctly displays whatever the backend returns.
  timestamp: 2026-04-01T00:03:00Z

## Evidence

- timestamp: 2026-04-01T00:01:00Z
  checked: src-tauri/src/commands/update.rs detect_install_method()
  found: Uses resolve_command_path("openclaw") which calls `where openclaw` — this searches only the PROCESS PATH
  implication: In Tauri dev mode, the process PATH may not include npm global bin directory, so `where openclaw` returns nothing

- timestamp: 2026-04-01T00:01:30Z
  checked: src-tauri/src/commands/nodejs.rs check_openclaw()
  found: Uses get_npm_global_prefix() (npm prefix -g) to find global bin directory directly, then constructs full path to openclaw.cmd — bypasses PATH entirely
  implication: check_openclaw() works correctly, but detect_install_method() uses a different (broken) approach

- timestamp: 2026-04-01T00:01:45Z
  checked: src-tauri/src/commands/silent.rs silent_cmd()
  found: On Windows, silent_cmd() augments PATH via nodejs_path_env() which includes npm global bin dirs
  implication: Even though silent_cmd() augments PATH, resolve_command_path() uses std::process::Command directly (not silent_cmd), so it doesn't get the augmented PATH

- timestamp: 2026-04-01T00:02:00Z
  checked: src/pages/install.tsx handleReinstallOpenClaw() and handleCheckForUpdates()
  found: handleReinstallOpenClaw() calls checkPrereqs() after reinstall (which uses check_openclaw — works). handleCheckForUpdates() calls check_openclaw_update() (which uses detect_install_method — broken)
  implication: After reinstall, if user clicks "Check for Updates", they see "unknown" because detect_install_method() can't find the binary

- timestamp: 2026-04-01T00:04:00Z
  checked: cargo check compilation
  found: Compiles successfully with no errors
  implication: Fix is syntactically correct and type-safe

## Resolution

root_cause: detect_install_method() in update.rs used resolve_command_path("openclaw") which calls `where openclaw` — this searches only the process PATH. In Tauri dev mode, the process PATH doesn't include npm global bin directories. Meanwhile check_openclaw() in nodejs.rs correctly uses `npm prefix -g` to find the global binary directly. The two functions used different detection strategies, and the one in update.rs was broken for dev environments.
fix: Updated detect_install_method() to first try get_npm_global_prefix() (npm prefix -g) to construct the full path to the global openclaw binary directly, bypassing PATH entirely. Falls back to resolve_command_path() as a secondary check. Made get_npm_global_prefix() pub(crate) so update.rs can import it.
verification: cargo check passes with no errors. Fix mirrors the working approach in check_openclaw().
files_changed:
  - src-tauri/src/commands/update.rs: detect_install_method() now uses get_npm_global_prefix() first, imports get_npm_global_prefix from nodejs module
  - src-tauri/src/commands/nodejs.rs: get_npm_global_prefix() changed from private to pub(crate)
