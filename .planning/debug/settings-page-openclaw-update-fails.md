# Debug Report: Settings Page OpenClaw Update Fails

**Issue ID:** settings-page-openclaw-update-fails
**Date:** 2026-04-01
**Status:** Fixed (pending commit)

## Summary

Settings page OpenClaw update fails with "Check your internet connection and try again" error while Install page reinstall works correctly using the same `@latest` command.

## Symptoms

- **Expected:** Settings page should download/update OpenClaw to latest version successfully
- **Actual:** Shows error "Check your internet connection and try again. For native installs, run: npm install -g openclaw@latest"
- **Working Comparison:** Install page reinstall button works fine with the same `@latest` approach

## Root Cause Analysis

### Code Path Comparison

#### Install Page: `reinstall_openclaw` (Working)

**File:** `src-tauri/src/commands/nodejs.rs` (lines 383-428)

```rust
pub async fn reinstall_openclaw(app: tauri::AppHandle) -> Result<String, String> {
    // ... uninstall logic ...

    // Calls install_openclaw_script which does:
    install_openclaw_script(app).await
}

pub async fn install_openclaw_script(app: tauri::AppHandle) -> Result<String, String> {
    // ...
    let install_args: Vec<&str> = match pkg_manager.as_str() {
        "npm" => vec!["install", "-g", "openclaw@latest"],  // <-- Uses @latest directly
        // ...
    };
    // Runs npm directly - npm resolves @latest itself
}
```

**Key point:** Does NOT call GitHub API. Lets npm resolve `@latest` tag.

#### Settings Page: `update_openclaw` (Failing)

**File:** `src-tauri/src/commands/update.rs` (lines 88-111, 227-268)

```rust
pub async fn update_openclaw(...) -> Result<UpdateResult, AppError> {
    // ...
    match install_method.as_str() {
        "native" => update_native(&app_handle).await,
        // ...
    }
}

async fn update_native(app_handle: &AppHandle) -> Result<UpdateResult, AppError> {
    // PROBLEM: Fetches version from GitHub API FIRST
    let latest_tag = fetch_latest_version().await?;  // <-- FAILS HERE

    // If above succeeds, runs npm with specific version
    cmd.args(["install", "-g", &format!("openclaw@{latest_tag}")]);
}

async fn fetch_latest_version() -> Result<String, AppError> {
    // Makes HTTP request to GitHub API
    let release: GithubRelease = client
        .get(GITHUB_RELEASES_URL)  // "https://api.github.com/repos/openclaw/openclaw/releases/latest"
        .send()
        .await
        .map_err(|e| AppError::InstallationFailed {
            reason: format!("Failed to fetch latest release: {e}"),
            suggestion: "Check your internet connection and try again.".into(),  // <-- THE ERROR MESSAGE
        })?
        // ...
}
```

**Key point:** Calls GitHub API first to get exact version tag. If that fails, returns the error.

### Why Install Works But Update Fails

| Aspect | Install Page | Settings Page |
|--------|--------------|---------------|
| Command | `reinstall_openclaw` | `update_openclaw` |
| GitHub API call | **NO** | **YES** (fails) |
| npm command | `npm install -g openclaw@latest` | `npm install -g openclaw@{github_tag}` |
| Version resolution | npm resolves `@latest` | Requires GitHub API response first |

The GitHub API call in `update_native()` is failing. Possible reasons:
1. Network/firewall blocking `api.github.com`
2. GitHub API rate limiting (60 requests/hour for unauthenticated)
3. DNS resolution issues
4. Corporate proxy not configured

## The Fix

The `update_native` function should follow the same pattern as `install_openclaw_script` - just use `@latest` and let npm resolve it, rather than fetching the version from GitHub first.

### Option A: Simple Fix (Recommended)

Modify `update_native` to use `@latest` directly instead of fetching from GitHub:

**File:** `src-tauri/src/commands/update.rs`

```rust
async fn update_native(app_handle: &AppHandle) -> Result<UpdateResult, AppError> {
    emit_progress(
        app_handle,
        "downloading",
        20,
        "Downloading latest version...",
    );

    // CHANGE: Don't call GitHub API, just use @latest like install does
    emit_progress(app_handle, "installing", 70, "Installing update...");

    let mut cmd = silent_cmd("npm");
    cmd.args(["install", "-g", "openclaw@latest"]);  // <-- Use @latest directly
    let output = run_with_timeout(&mut cmd, INSTALL_TIMEOUT)
        .await
        .map_err(|e| AppError::InstallationFailed {
            reason: format!("Failed to update openclaw: {e}"),
            suggestion:
                "Ensure npm is installed and you have permission to install global packages. \
                         Try: npm install -g openclaw@latest"
                    .into(),
        })?;

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        return Err(AppError::InstallationFailed {
            reason: format!("npm install failed: {stderr}"),
            suggestion: "Try running: npm install -g openclaw@latest".into(),
        });
    }

    emit_progress(app_handle, "complete", 100, "Update complete!");

    // Get actual installed version after update
    let new_version = get_installed_version().await;

    Ok(UpdateResult {
        success: true,
        new_version,
        method: "native".into(),
    })
}

// Helper to get installed version after update
async fn get_installed_version() -> Option<String> {
    let mut cmd = silent_cmd("openclaw");
    cmd.arg("--version");
    if let Ok(output) = run_with_timeout(&mut cmd, QUICK_TIMEOUT).await {
        if output.status.success() {
            return Some(String::from_utf8_lossy(&output.stdout).trim().to_string());
        }
    }
    None
}
```

### Option B: Fallback Pattern

Keep GitHub API call but fall back to `@latest` if it fails:

```rust
async fn update_native(app_handle: &AppHandle) -> Result<UpdateResult, AppError> {
    emit_progress(app_handle, "downloading", 20, "Checking for latest version...");

    // Try to get exact version from GitHub, fall back to @latest
    let version_spec = match fetch_latest_version().await {
        Ok(tag) => format!("openclaw@{tag}"),
        Err(_) => {
            // GitHub API failed, just use @latest
            "openclaw@latest".to_string()
        }
    };

    emit_progress(app_handle, "installing", 70, "Installing update...");

    let mut cmd = silent_cmd("npm");
    cmd.args(["install", "-g", &version_spec]);
    // ... rest of function
}
```

## Files to Modify

1. `src-tauri/src/commands/update.rs` - `update_native` function (lines 227-268)

## Fix Applied

Changed `update_native` function to:
1. Try GitHub API to get exact version tag
2. **Fall back to `@latest`** if GitHub API fails (instead of returning error)
3. After successful npm install, query the actual installed version
4. Added `get_native_installed_version()` helper to detect installed version

This matches the behavior of `install_openclaw_script` which always uses `@latest` and lets npm resolve it.

**Compilation verified:** `cargo check` passes

## Testing

1. Disconnect from internet / block api.github.com
2. Go to Settings page
3. Click Update button
4. Should now work (uses npm @latest instead of GitHub API)
5. Verify by checking installed version after update

## Related Code

- `src-tauri/src/commands/nodejs.rs` - `install_openclaw_script` (reference for working pattern)
- `src/pages/settings.tsx` - Settings page UI
- `src/hooks/use-update.ts` - Frontend hook calling `update_openclaw`
