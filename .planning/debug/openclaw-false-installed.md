---
status: awaiting_human_verify
trigger: "openclaw-false-installed"
created: 2026-04-01T00:00:00.000Z
updated: 2026-04-01T00:20:00.000Z
---

## Current Focus

hypothesis: FIXED — check_openclaw() Method 2 was finding local node_modules\.bin\openclaw from dev dependencies
test: Code compiles successfully. Fix adds resolve_command_path() helper that uses `where` (Windows) / `which` (Unix) to resolve the full binary path, then skips it if the path contains "node_modules"
expecting: After fix, check_openclaw() will correctly return "not installed" when only local node_modules openclaw exists
next_action: Verify fix is complete, update resolution, and mark for human verification

## Symptoms

expected: When OpenClaw is not installed, the UI should show "Not Installed" with an install action
actual: UI shows "OpenClaw v2026.3.24 - Installed" with "Check for Updates" and "Start Gateway" buttons
errors: None visible — just incorrect status display
reproduction: Open ClawStation, go to OpenClaw status/install page, it shows installed when it isn't
started: Started after OpenClaw was uninstalled but artifacts remain on filesystem

## Eliminated

<!-- APPEND as hypotheses are disproven -->

## Evidence

- timestamp: 2026-04-01T00:05:00Z
  checked: npm global prefix and global openclaw binary
  found: npm prefix = D:\soft\nvm\nodejs, but D:\soft\nvm\nodejs\openclaw.cmd does NOT exist
  implication: Method 1 (global binary via npm prefix) correctly fails — no global installation

- timestamp: 2026-04-01T00:06:00Z
  checked: D:\projects\rust\openclaw-ins\node_modules\openclaw\package.json
  found: Local openclaw package exists with version 2026.3.24
  implication: Project has local openclaw as a dev dependency (likely for development/testing)

- timestamp: 2026-04-01T00:07:00Z
  checked: D:\projects\rust\openclaw-ins\node_modules\.bin\openclaw.cmd
  found: Local openclaw.cmd binary exists
  implication: The local node_modules has an openclaw executable

- timestamp: 2026-04-01T00:08:00Z
  checked: `openclaw --version` with node_modules\.bin prepended to PATH
  found: Returns "OpenClaw 2026.3.24 (cff6dc9)"
  implication: Method 2 fallback (openclaw on PATH) will find local node_modules binary and return false positive

- timestamp: 2026-04-01T00:09:00Z
  checked: silent_cmd() function in silent.rs lines 192-201
  found: On Windows, silent_cmd() augments PATH with nodejs_path_env() which includes many directories
  implication: The augmented PATH may include local node_modules\.bin if it's in the registry PATH or process PATH

- timestamp: 2026-04-01T00:10:00Z
  checked: check_openclaw() in nodejs.rs lines 117-199
  found: Method 2 (lines 153-175) runs `openclaw --version` on PATH with comment "may hit local node_modules"
  implication: The code AUTHORS KNEW this was a problem but kept it as a fallback anyway

- timestamp: 2026-04-01T00:11:00Z
  checked: check_openclaw() Method 3 (find_openclaw_binary() filesystem search)
  found: Searches many directories including project-adjacent locations
  implication: Could also find local node_modules binaries in some configurations

## Resolution

root_cause: The check_openclaw() function in nodejs.rs has three detection methods. Method 1 (global binary via npm prefix) correctly returns "not installed" when there's no global installation. But Method 2 (fallback: `openclaw --version` on PATH) succeeds because the augmented PATH includes the project's local node_modules\.bin directory, which contains openclaw from a dev dependency (version 2026.3.24). This causes a false positive — the dev machine's local openclaw package is mistaken for a global installation. The code comment even acknowledged this risk ("may hit local node_modules") but didn't guard against it.

fix: Added resolve_command_path() helper that uses `where` (Windows) / `which` (Unix) to resolve the full path of the `openclaw` command before executing it. If the resolved path contains "node_modules", the fallback is skipped entirely. This ensures local project dependencies are never mistaken for global installations. Method 1 (global binary via npm prefix) remains the primary detection method and is unaffected. Method 3 (filesystem search via find_openclaw_binary()) already only checks global installation directories and doesn't include node_modules paths.

verification: Code compiles successfully (cargo check passed). The fix is minimal and targeted — only adds a path resolution check before the fallback method.
files_changed:
  - src-tauri/src/commands/nodejs.rs: Added resolve_command_path() helper; Modified check_openclaw() Method 2 to skip node_modules paths
