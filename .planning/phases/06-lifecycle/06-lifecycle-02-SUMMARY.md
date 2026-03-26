---
phase: 06-lifecycle
plan: "02"
subsystem: lifecycle
tags: [tauri, updater, auto-update, plugin-updater, plugin-process]

# Dependency graph
requires:
  - phase: 05-monitoring
    provides: monitoring dashboard, settings page stub
provides:
  - tauri-plugin-updater and tauri-plugin-process registered in Rust and frontend
  - Desktop app auto-update hook (useAppUpdate) with check, download, install, relaunch flow
  - Settings page "Desktop App Update" card with version display and progress bar
  - Updater capabilities (updater:default, process:allow-restart)
affects: [settings, app-lifecycle]

# Tech tracking
tech-stack:
  added:
    - tauri-plugin-updater "2" (Rust)
    - tauri-plugin-process "2.3" (Rust)
    - @tauri-apps/plugin-updater (frontend)
    - @tauri-apps/plugin-process (frontend)
  patterns:
    - useAppUpdate hook pattern: useState + useCallback for check/install with DownloadEvent discriminated union handling
    - Standalone checkForAppUpdates() export for startup update checks
    - Settings page card pattern: Card + CardHeader + CardContent with Button and Progress

key-files:
  created:
    - src/hooks/use-app-update.ts — Desktop app update hook (checkForUpdates, installUpdate, checkForAppUpdates)
  modified:
    - src-tauri/Cargo.toml — Added tauri-plugin-updater and tauri-plugin-process dependencies
    - src-tauri/src/lib.rs — Registered updater and process plugins
    - src-tauri/tauri.conf.json — Added createUpdaterArtifacts, updater endpoint, and pubkey placeholder
    - src-tauri/capabilities/default.json — Added updater:default, process:default, process:allow-restart, dialog:allow-ask
    - src/pages/settings.tsx — Added Desktop App Update card with check/install flow

key-decisions:
  - "DownloadEvent is a discriminated union: capture contentLength from Started event, track chunkLength from Progress event for percentage calculation"
  - "Placeholder pubkey 'GENERATE_WITH_tauri_signer_generate' used — user must replace via signer generate command"
  - "Updater endpoint uses GitHub raw URL for latest.json manifest hosting"
  - "checkForAppUpdates() exported as standalone function for one-shot startup checks (separate from hook)"

patterns-established:
  - "App update hook pattern: check() returns Update|null, downloadAndInstall() with DownloadEvent callback, relaunch() after install"
  - "Settings page card pattern for lifecycle features"

requirements-completed: [LIFE-02]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 06 Plan 02: Desktop App Auto-Update Summary

**tauri-plugin-updater integration with check/download/install/relaunch flow, exposed via useAppUpdate hook and Settings page card**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T04:58:56Z
- **Completed:** 2026-03-26T05:01:45Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- Registered `tauri-plugin-updater` and `tauri-plugin-process` in Rust backend (Cargo.toml + lib.rs)
- Configured updater endpoint (GitHub raw URL) and placeholder signing pubkey in tauri.conf.json
- Added `updater:default`, `process:default`, `process:allow-restart`, and `dialog:allow-ask` capabilities
- Created `useAppUpdate` hook with check, download (progress tracking), install, and relaunch
- Wired Settings page with "Desktop App Update" card showing version, update banner, progress bar, and install button

## Task Commits

Each task was committed atomically:

1. **Task 1: Add updater plugin dependencies and configure Tauri** - `c7eeb9e` (feat)
2. **Task 2: Create app update hook and wire to settings page** - `a03e957` (feat)

## Files Created/Modified
- `src-tauri/Cargo.toml` — Added `tauri-plugin-updater = "2"` and `tauri-plugin-process = "2.3"`
- `src-tauri/src/lib.rs` — Registered `.plugin(tauri_plugin_updater::Builder::new().build())` and `.plugin(tauri_plugin_process::init())`
- `src-tauri/tauri.conf.json` — Added `createUpdaterArtifacts: true`, updater endpoint, pubkey placeholder, plugins section
- `src-tauri/capabilities/default.json` — Added 4 new permissions for updater, process, and dialog
- `src/hooks/use-app-update.ts` — New hook with `useAppUpdate()` and `checkForAppUpdates()` exports
- `src/pages/settings.tsx` — Added Desktop App Update card (was existing stub + uninstall card)
- `package.json` / `pnpm-lock.yaml` — Added `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process`

## Decisions Made
- Used `DownloadEvent` discriminated union properly: `contentLength` from `Started`, `chunkLength` from `Progress`
- Placeholder pubkey used (user must generate real key via `npx @tauri-apps/cli signer generate`)
- Exported standalone `checkForAppUpdates()` for future startup auto-check integration

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed DownloadEvent progress calculation**
- **Found during:** Task 2
- **Issue:** Plan used `progress.data.chunkLength / progress.data.contentLength` but `DownloadEvent` is a discriminated union — `contentLength` only exists on `Started` event, `chunkLength` only on `Progress` event
- **Fix:** Refactored to capture `contentLength` from `Started` event, then track `chunkLength` from `Progress` events for percentage calculation
- **Files modified:** src/hooks/use-app-update.ts
- **Verification:** TypeScript compiles cleanly (`npx tsc --noEmit`)

**2. [Rule 2 - Missing Critical] Preserved existing dialog:allow-open capability**
- **Found during:** Task 1
- **Issue:** Plan's capability update could have removed existing `dialog:allow-open` permission when adding `dialog:allow-ask`
- **Fix:** Added `dialog:allow-ask` alongside existing `dialog:allow-open` (both needed for different dialog types)
- **Files modified:** src-tauri/capabilities/default.json
- **Verification:** Capabilities file has both permissions

---

**Total deviations:** 2 auto-fixed (1 bug fix, 1 missing critical)
**Impact on plan:** Both auto-fixes necessary for correctness. No scope creep.

## Issues Encountered
- None

## User Setup Required

**External services require manual configuration.** See [06-lifecycle-02-USER-SETUP.md](./06-lifecycle-02-USER-SETUP.md) for:
- Tauri signing key generation (`npx @tauri-apps/cli signer generate`)
- Replacing pubkey placeholder in tauri.conf.json
- Hosting latest.json update manifest on GitHub

## Next Phase Readiness
- Desktop app auto-update infrastructure complete (LIFE-02)
- User must generate signing key and host update manifest before updates work in production
- Ready for additional lifecycle features or phase completion verification

---

*Phase: 06-lifecycle*
*Completed: 2026-03-26*

## Self-Check: PASSED
