---
id: 260326-w1f
date: 2026-03-26
status: complete
---

# Quick Task 260326-w1f: Add install dir selection, clean install, cancel — Summary

## Changes

### 1. src-tauri/src/commands/install.rs
- Added `install_dir: Option<String>` to `InstallRequest`
- `install_openclaw` passes `install_dir` to `docker_install`
- Added `clean_install_dir(path: String)` — removes directory tree
- Added `cancel_install(install_dir: Option<String>)` — runs `docker compose down` in repo dir
- Updated tests for new fields

### 2. src-tauri/src/install/docker_install.rs
- `docker_install` now accepts `install_dir: Option<&str>` parameter
- Uses provided path or falls back to `~/.openclaw`

### 3. src-tauri/src/lib.rs
- Registered `clean_install_dir` and `cancel_install` commands

### 4. src/hooks/use-install.ts
- Added `installDir?: string` to `InstallRequest` interface
- Exported `cleanInstallDir(path)` and `cancelInstall(installDir?)` async functions

### 5. src/stores/use-onboarding-store.ts
- Added `installDir: string | null` to state
- Added `setInstallDir(dir)` setter

### 6. src/components/install/step-install.tsx
- **Install directory picker**: text field showing current dir + folder open button (uses `@tauri-apps/plugin-dialog`)
- **Clean install button**: calls `cleanInstallDir()` to remove existing dir
- **Cancel button**: shown during installation, calls `cancelInstall()` and resets state
- Passes `installDir` to the mutation call

## Result

Users can now: choose their install directory, clean it before installing, and cancel in-progress installations.
