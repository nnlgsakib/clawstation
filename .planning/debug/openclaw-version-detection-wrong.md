---
status: awaiting_human_verify
trigger: "openclaw-version-detection-wrong"
created: 2026-04-01T00:00:00Z
updated: 2026-04-01T00:15:00Z
---

## Current Focus
hypothesis: CONFIRMED AND FIXED - detect_install_method() and get_native_installed_version() in update.rs both lacked node_modules filtering
test: Build compiles successfully, awaiting human verification in real environment
expecting: UI shows correct global version 2026.3.31 instead of local 2026.3.24
next_action: Request human verification

## Symptoms
<!-- Written during gathering, then IMMUTABLE -->

expected: Show current installed version as 2026.3.31 (the actual global npm install version)
actual: Shows "Update available: 2026.3.24 → 2026.3.31" — the current version is incorrectly read as 2026.3.24
errors: No errors, just wrong version number
reproduction: Install OpenClaw globally, go to Install/Prerequisites page, check the version display
timeline: Started after the previous fix that skipped node_modules binaries for install detection

## Eliminated
<!-- APPEND only - prevents re-investigating -->

## Evidence
<!-- APPEND only - facts discovered -->

- timestamp: 2026-04-01T00:05:00Z
  checked: nodejs.rs check_openclaw() function (lines 117-205)
  found: Correctly uses resolve_command_path() to skip local node_modules binaries, then falls back to find_openclaw_binary()
  implication: This function correctly detects global version

- timestamp: 2026-04-01T00:06:00Z
  checked: update.rs detect_install_method() function (lines 324-375)
  found: Runs `cmd /c openclaw --version` directly without resolve_command_path() guard (line 329). No node_modules filtering.
  implication: This function picks up local node_modules binary, returning wrong version 2026.3.24

- timestamp: 2026-04-01T00:07:00Z
  checked: UI flow - install.tsx calls check_openclaw_update() for update message
  found: check_openclaw_update() calls detect_install_method() which returns wrong current_version
  implication: Root cause confirmed - detect_install_method() needs same node_modules guard as check_openclaw()

## Resolution
<!-- OVERWRITE as understanding evolves -->

root_cause: "Two functions in update.rs (detect_install_method and get_native_installed_version) ran openclaw --version directly via PATH without filtering out local node_modules binaries. The project's dev dependency openclaw (v2026.3.24 in node_modules) was found before the global installation (v2026.3.31). The same guard used in nodejs.rs check_openclaw() (resolve_command_path + node_modules check) was missing from update.rs."
fix: "1. Made resolve_command_path() public in nodejs.rs. 2. Imported it in update.rs. 3. Added node_modules guard to detect_install_method() - skips local binaries. 4. Added same guard to get_native_installed_version()."
verification: "Build compiles successfully (cargo check passed). Awaiting human verification in real environment."
files_changed: ["src-tauri/src/commands/nodejs.rs", "src-tauri/src/commands/update.rs"]
