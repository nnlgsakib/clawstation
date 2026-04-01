# Quick Task Summary: 260401-kzd

## Task
Remove failing OpenClaw update functionality from Settings page and consolidate update/reinstall into the Install page with working `npm install -g openclaw@latest` approach.

## Problem
1. **Settings page OpenClaw update fails** - Uses `check_openclaw_update()` which calls GitHub API and fails with "Check your internet connection" due to API rate limits/network issues
2. **Install page reinstall works** - Uses `reinstall_openclaw()` which directly runs `npm install -g openclaw@latest` without GitHub API dependency
3. **Duplicated functionality** - Both Settings and Install pages had OpenClaw version management with different approaches

## Solution Implemented

### Task 1: Remove OpenClaw Update from Settings Page
**File:** `src/pages/settings.tsx`

Removed:
- Imports: `useOpenClawUpdateCheck`, `useUpdateOpenClaw`, `formatError`, `listen`, `cn`, `Badge`, `CheckCircle2`, `AlertCircle`
- State: `openclawProgress`, `UpdateProgress` interface
- `useEffect` for OpenClaw update progress events
- `useEffect` for OpenClaw update toast
- Entire "OpenClaw Update" Card component (~110 lines)
- `VersionRow` helper function (only used by removed card)

Kept:
- Desktop App Update card (uses Tauri's built-in updater)
- About card
- Danger Zone (uninstall)

### Tasks 2 & 3: Add Update Detection and UI to Install Page
**File:** `src/pages/install.tsx`

Added:
- Import: `RefreshCw` icon, `useOpenClawUpdateCheck` hook
- `updateCheck` state via `useOpenClawUpdateCheck()` hook
- `handleUpdateOpenClaw()` function using `reinstall_openclaw` backend
- Update check refetch after prerequisites check (when OpenClaw is installed)
- Version diff display: "Update available: 1.0.0 → 1.2.0"
- "Update" button (primary) when newer version detected
- "Reinstall" button (outline) with RefreshCw icon always visible when installed
- Both buttons disabled during install operations

## Files Modified

| File | Lines Changed | Action |
|------|---------------|--------|
| `src/pages/settings.tsx` | -163 lines | Remove OpenClaw Update card, unused imports, VersionRow |
| `src/pages/install.tsx` | +46 lines | Add update detection, version diff, Update/Reinstall buttons |

## Acceptance Criteria

- [x] Settings page no longer shows OpenClaw Update card
- [x] Install page shows version diff when update is available (e.g., "1.0.0 → 1.2.0")
- [x] Install page shows "Update" button when newer version available
- [x] Install page always shows "Reinstall" button when OpenClaw is installed
- [x] Both Update and Reinstall buttons use the working `reinstall_openclaw` approach
- [x] No GitHub API errors shown to user (graceful degradation)

## Commit
```
5b22510 refactor: move OpenClaw update from Settings to Install page
```

## Notes
- The `check_openclaw_update` command may still fail if GitHub API is unavailable, but this is now optional - the Install page gracefully degrades to just showing "Reinstall" without any error
- Both Update and Reinstall use `reinstall_openclaw` internally (uninstall + install @latest) which is the reliable path
- Desktop App update in Settings remains unchanged - it uses Tauri's built-in updater
- No backend changes needed - reusing existing commands
