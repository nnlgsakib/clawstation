# Phase 15: Production Build Fixes - Context

**Gathered:** 2026-03-28
**Status:** Ready for planning
**Source:** Production build bug report

<domain>
## Phase Boundary

Fix two critical Windows-specific bugs that manifest only in production builds (not dev builds):

1. **CMD window flashing** — Every `tokio::process::Command::new("cmd")` call on Windows spawns a visible console window in production builds. The `#![windows_subsystem = "windows"]` attribute only prevents the *main* app console window, not child process windows. This affects ~20 command call sites across 9 Rust source files.

2. **Installation verification hang** — After `yarn global add openclaw@latest` completes, the verification step (`check_openclaw()` in `commands/nodejs.rs`) tries multiple shell commands sequentially. These shell-wrapped commands (`cmd /c openclaw --version`, `cmd /c npx openclaw --version`) can hang indefinitely in production, stalling the entire install flow.

These bugs block the beta release — they make the app feel broken and unusable on Windows.
</domain>

<decisions>
## Implementation Decisions

### CMD Window Suppression
- Use `CREATE_NO_WINDOW` (0x08000000) via `std::os::windows::process::CommandExt::creation_flags()` on all Windows child process spawns
- Create a shared helper function `silent_command()` in a new module `src-tauri/src/commands/silent.rs` that wraps the pattern
- Apply to ALL files that spawn child processes on Windows — no exceptions

### Files Requiring CMD Fix
- `commands/nodejs.rs` — check_nodejs, check_openclaw, detect_package_managers, install_openclaw_script, reinstall_openclaw
- `commands/gateway.rs` — start_gateway, stop_gateway, restart_gateway, kill_gateway_on_port_internal
- `commands/docker.rs` — check_docker_windows (where, wsl commands)
- `docker/check.rs` — check_docker_windows (where command)
- `commands/uninstall.rs` — stop_native_process (taskkill)
- `commands/system_check.rs` — check_nodejs
- `install/native_install.rs` — native_install, get_node_version, get_openclaw_version
- `install/verify.rs` — verify_native_install
- `install/docker_install.rs` — git commands, docker commands
- `commands/update.rs` — docker compose, npm install, openclaw version

### Hang Fix
- Add 30-second timeouts to all `.output().await` calls using `tokio::time::timeout`
- Replace `cmd /c` wrapper pattern with direct binary calls where possible (e.g., call `node` directly instead of `cmd /c node`)
- On Windows, use `which` crate or `where` to find binary paths instead of relying on cmd to resolve them

### the agent's Discretion
- Whether to create a shared `silent_command()` helper or apply `.creation_flags()` inline — shared helper preferred for DRY
- Timeout duration — 30s for quick checks, 120s for install/update operations
- Whether to also fix `std::process::Command` calls (sync, in docker.rs check functions) — yes, fix all
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Windows Process Creation
- `src-tauri/src/commands/nodejs.rs` — Primary problem file: all shell-wrapped commands
- `src-tauri/src/commands/gateway.rs` — Gateway process management: cmd /c wrappers
- `src-tauri/src/install/native_install.rs` — Native install flow: npm/node/openclaw commands
- `src-tauri/src/install/verify.rs` — Verification: openclaw doctor
- `src-tauri/src/commands/docker.rs` — Docker detection: where/wsl commands
- `src-tauri/src/docker/check.rs` — Docker health: where command

### Reference: CREATE_NO_WINDOW Pattern
```rust
use std::os::windows::process::CommandExt;
// 0x08000000 = CREATE_NO_WINDOW
tokio::process::Command::new("cmd")
    .args(["/c", "node", "--version"])
    .creation_flags(0x08000000)
    .output()
    .await
```

</canonical_refs>

<specifics>
## Specific Ideas

- The `process-wrap` crate (already in STACK.md) provides cross-platform process management but is overkill for this fix — the `creation_flags()` approach is simpler and more targeted
- The `tauri-plugin-shell` crate is listed as a dependency but unused for command execution — consider migrating to it in future phases, but for now the direct `tokio::process::Command` approach with flags is the correct fix
- Both `tokio::process::Command` (async) and `std::process::Command` (sync) calls need the fix — they both support `CommandExt::creation_flags()`
</specifics>

<deferred>
## Deferred Ideas

- Migrating from raw `tokio::process::Command` to `tauri-plugin-shell` for all command execution — architecturally cleaner but too large a refactor for a bug fix phase
- Adding `process-wrap` crate for process group management — not needed for this fix, useful for future process lifecycle work
- Platform-specific testing infrastructure — manual testing on Windows production build sufficient for this fix
</deferred>

---

*Phase: 15-production-build-fixes*
*Context gathered: 2026-03-28 via production bug report*
