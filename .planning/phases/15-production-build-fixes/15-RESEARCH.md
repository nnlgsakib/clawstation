# Phase 15: Production Build Fixes - Research

## RESEARCH COMPLETE

## Problem Analysis

### Issue 1: CMD Window Flashing in Production

**Root cause:** `#![windows_subsystem = "windows"]` in `main.rs` only hides the *main application's* console window. Each `tokio::process::Command::new("cmd")` spawn creates a new console process that *still gets a visible window* because the default `CreateProcess` behavior creates a console for console-mode executables.

**Why dev build works:** In `tauri dev` mode, the app runs inside an existing console window, so child processes inherit that console rather than creating new windows. In production (release build), the app has no console, so each `cmd /c` call creates its own.

**Affected patterns:**
1. `tokio::process::Command::new("cmd").args(["/c", ...])` — Most common, ~20 call sites
2. `std::process::Command::new("where").arg("docker")` — Docker check
3. `std::process::Command::new("wsl").args(["-l", "-v"])` — WSL detection
4. `std::process::Command::new("taskkill").args([...])` — Process termination
5. `tokio::process::Command::new("node").arg("--version")` — Direct binary calls (less likely to flash but still affected on some Windows configurations)

**Solution:** `CREATE_NO_WINDOW` flag (0x08000000) via `std::os::windows::process::CommandExt::creation_flags()`. This tells Windows to suppress the console window for the child process.

**Reference:** Tokio PR #7249 merged into v1.45.0 adds `spawn_with` for more complex cases, but `creation_flags()` is the stable, simple approach available now.

### Issue 2: Installation Verification Hang

**Root cause:** The `check_openclaw()` function in `nodejs.rs` (line 77-110) loops through 3 shell-wrapped commands without any timeout:
```rust
("cmd", vec!["/c", "openclaw", "--version"]),
("cmd", vec!["/c", "npx", "openclaw "--version"]),
("cmd", vec!["/c", "pnpm", "exec", "openclaw", "--version"]),
```

If `openclaw` is not yet on PATH after yarn completes, or if the PATH hasn't refreshed, each call can hang for 30+ seconds. Three sequential hangs = 90+ seconds of apparent freeze.

Similarly, `install_openclaw_script()` calls `check_openclaw()` after successful install (line 249) which can hang.

**Solution:**
1. Add `tokio::time::timeout(Duration::from_secs(30), ...)` around all `.output().await` calls
2. Reduce command count: if openclaw is installed via yarn, call it directly instead of trying multiple fallbacks
3. Add a brief sleep (2s) after package manager install completes to let PATH refresh

## Implementation Strategy

### Shared Helper Module

Create `src-tauri/src/commands/silent.rs`:

```rust
use std::time::Duration;
use tokio::time::timeout;

/// Default timeout for quick checks (version, status).
const QUICK_TIMEOUT: Duration = Duration::from_secs(30);

/// Default timeout for install/update operations.
const INSTALL_TIMEOUT: Duration = Duration::from_secs(120);

/// Spawn a command with CREATE_NO_WINDOW on Windows (no visible console window).
#[cfg(target_os = "windows")]
pub fn silent_cmd(program: &str) -> tokio::process::Command {
    use std::os::windows::process::CommandExt;
    let mut cmd = tokio::process::Command::new(program);
    cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    cmd
}

#[cfg(not(target_os = "windows"))]
pub fn silent_cmd(program: &str) -> tokio::process::Command {
    tokio::process::Command::new(program)
}

/// Run a command with a timeout, returning output or error string.
pub async fn run_with_timeout(
    mut cmd: tokio::process::Command,
    timeout_secs: u64,
) -> Result<std::process::Output, String> {
    timeout(
        Duration::from_secs(timeout_secs),
        cmd.output(),
    )
    .await
    .map_err(|_| format!("Command timed out after {}s", timeout_secs))?
    .map_err(|e| format!("Command failed: {}", e))
}
```

### Migration Pattern

**Before:**
```rust
let output = if cfg!(target_os = "windows") {
    tokio::process::Command::new("cmd")
        .args(["/c", "node", "--version"])
        .output()
        .await
} else {
    tokio::process::Command::new("node")
        .arg("--version")
        .output()
        .await
};
```

**After:**
```rust
let output = if cfg!(target_os = "windows") {
    silent_cmd("cmd")
        .args(["/c", "node", "--version"])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
} else {
    silent_cmd("node")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .output()
        .await
};
// Or with timeout:
let output = run_with_timeout(/* ... */).await;
```

### Files to Modify

| File | Changes | Effort |
|------|---------|--------|
| `src-tauri/src/commands/silent.rs` | **NEW** — shared helper | Medium |
| `src-tauri/src/commands/mod.rs` | Add `pub mod silent;` | Trivial |
| `src-tauri/src/commands/nodejs.rs` | Replace all Command::new with silent_cmd, add timeouts | Medium |
| `src-tauri/src/commands/gateway.rs` | Replace cmd wrappers with silent_cmd | Medium |
| `src-tauri/src/commands/docker.rs` | Replace where/wsl with silent_cmd | Small |
| `src-tauri/src/docker/check.rs` | Replace where with silent_cmd | Small |
| `src-tauri/src/commands/uninstall.rs` | Replace taskkill with silent_cmd | Trivial |
| `src-tauri/src/commands/system_check.rs` | Replace node check with silent_cmd | Trivial |
| `src-tauri/src/install/native_install.rs` | Replace npm/node/openclaw with silent_cmd, add timeouts | Medium |
| `src-tauri/src/install/verify.rs` | Replace openclaw doctor with silent_cmd | Small |
| `src-tauri/src/install/docker_install.rs` | Replace git/docker with silent_cmd | Medium |
| `src-tauri/src/commands/update.rs` | Replace docker/npm/openclaw with silent_cmd | Medium |

## Risks

1. **Low risk:** `CREATE_NO_WINDOW` is the standard Windows approach — used by Chromium, VS Code, and most Tauri apps
2. **Low risk:** Timeout addition is backward-compatible — commands that complete quickly are unaffected
3. **Medium risk:** Some commands may legitimately need more than 30s (docker pull, git clone) — use INSTALL_TIMEOUT for those
4. **Low risk:** The `silent_cmd` wrapper is a thin layer — easy to remove if a better approach emerges

## Sources

- [Tauri Issue #8591](https://github.com/tauri-apps/tauri/issues/8591) — Hiding sidecar terminal windows
- [Chinese Tauri CMD fix guide](https://juejin.cn/post/7512259761195876363) — CREATE_NO_WINDOW pattern for Tauri
- [Rust CommandExt docs](https://doc.rust-lang.org/std/os/windows/process/trait.CommandExt.html) — `creation_flags()` method
- [Tokio PR #7249](https://github.com/tokio-rs/tokio/pull/7249) — `spawn_with` for advanced use cases
- [SO: Hide console window](https://stackoverflow.com/questions/60750113/) — CREATE_NO_WINDOW flag value
