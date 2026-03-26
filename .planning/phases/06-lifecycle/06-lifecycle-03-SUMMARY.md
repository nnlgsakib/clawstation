---
phase: 06-lifecycle
plan: "03"
subsystem: lifecycle
tags: [uninstall, docker, bollard, tanstack-query, settings, danger-zone]

requires:
  - phase: 03-installation-engine
    provides: Docker install flow, compose templates, bollard patterns
provides:
  - Tauri command for full or partial OpenClaw uninstall
  - TanStack Query mutation hook for uninstall
  - Settings page Danger Zone UI with config preservation toggle
affects: [settings, docker, onboarding]

tech-stack:
  added: []
  patterns:
    - "Graceful uninstall: partial success with detailed error messages"
    - "Config preservation toggle: Switch component with default-on behavior"
    - "Destructive action confirmation: native confirm() before mutation"

key-files:
  created:
    - src-tauri/src/commands/uninstall.rs
    - src/hooks/use-uninstall.ts
  modified:
    - src-tauri/src/commands/mod.rs
    - src-tauri/src/lib.rs
    - src/pages/settings.tsx
    - src/lib/errors.ts

key-decisions:
  - "Graceful error handling: each uninstall step catches errors independently, returning partial success with details rather than failing the entire operation"
  - "Config preservation default: preserve_config defaults to true (checked) to prevent accidental data loss"
  - "Native confirm() over custom dialog: uses browser's native confirm() for destructive action confirmation — simple, accessible, no extra UI dependency"

patterns-established:
  - "Uninstall pattern: detect install type → stop services → remove artifacts → handle config → report partial success"

requirements-completed: [LIFE-03, LIFE-04]

duration: 3min
completed: 2026-03-26
---

# Phase 06 Plan 03: Uninstall Engine Summary

**Uninstall command with graceful Docker removal, config preservation toggle, and Danger Zone settings UI**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T04:58:35Z
- **Completed:** 2026-03-26T05:01:12Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Rust uninstall command with 7-step removal flow (detect → stop containers → remove images → remove volumes → stop processes → remove config → complete)
- Graceful error handling: each step independent, partial success with detailed error messages
- Cross-platform native process stop (Linux pgrep/pkill, Windows taskkill)
- TanStack Query mutation hook with invoke("uninstall_openclaw") wiring
- Settings page Danger Zone section with red-themed card, preserve config toggle, confirmation dialog, and toast feedback
- uninstall_failed error pattern added to error infrastructure

## Task Commits

1. **Task 1: Create uninstall Rust backend** - `b900754` (feat)
2. **Task 2: Create uninstall frontend hook and settings UI** - `f411993` (feat)

## Files Created/Modified
- `src-tauri/src/commands/uninstall.rs` - Tauri command with UninstallRequest/Result types, 7-step removal flow
- `src/hooks/use-uninstall.ts` - useUninstallOpenClaw TanStack Query mutation hook
- `src-tauri/src/commands/mod.rs` - Added pub mod uninstall
- `src-tauri/src/lib.rs` - Registered uninstall_openclaw in invoke_handler
- `src/pages/settings.tsx` - Replaced stub with Danger Zone card (Switch toggle, destructive Button, confirm dialog)
- `src/lib/errors.ts` - Added uninstall_failed error entry and match pattern

## Decisions Made
- Graceful error handling over fail-fast: each uninstall step catches errors independently, returning partial success with details. This ensures the user always gets a result even if Docker is partially unavailable.
- Native confirm() over custom modal: uses browser's native confirm() for destructive action confirmation — zero additional dependencies, accessible, and the message adapts based on preserve_config toggle.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## Next Phase Readiness
- Uninstall engine complete (LIFE-03, LIFE-04)
- Settings page is now functional (was a PageStub) — lifecycle-01/02 can add Update and Desktop App Update cards to this page
- Phase 06 has 1 more plan remaining or can proceed to verification

---
*Phase: 06-lifecycle*
*Completed: 2026-03-26*
