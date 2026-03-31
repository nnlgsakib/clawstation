---
phase: 19-configure-page-dual-mode
plan: 02
completed: "2026-03-31T15:48:00.000Z"
duration: 5min
tasks_completed: 3
files_modified:
  - src/stores/use-gateway-store.ts
  - src/pages/configure.tsx
  - src/pages/monitor.tsx
commit: b795ed4
requirements:
  - CONF-FIX-03
tech_stack:
  added: []
  patterns:
    - "Zustand cross-page coordination via pendingRestart flag"
    - "React Router useNavigate for post-save navigation"
    - "useEffect on mount for auto-trigger"
decisions:
  - "Moved handleAction before useEffect hooks in monitor.tsx to avoid temporal dead zone"
  - "Save & Restart bypasses isDirty check by always validating + saving when dirty"
  - "500ms delay before auto-restart gives page time to render"
key_files:
  modified:
    - src/stores/use-gateway-store.ts
    - src/pages/configure.tsx
    - src/pages/monitor.tsx
---

# Phase 19 Plan 02: Save & Restart + Monitor Auto-Trigger — Summary

## One-liner
"Save & Restart" button on configure page that saves config, navigates to monitor, and auto-triggers gateway restart.

## Tasks Completed

### Task 1: Add pendingRestart flag to gateway store
Added to `use-gateway-store.ts`:
- `pendingRestart: boolean` in state (initial: `false`)
- `setPendingRestart: (value: boolean) => void` action
- `pendingRestart: false` in reset action

### Task 2: Add Restart Gateway button to configure page
Updated `src/pages/configure.tsx` with:
- `useNavigate` hook for post-save navigation
- `handleSaveAndRestart` function: validates + saves config if dirty, sets pendingRestart, navigates to /monitor
- "Save & Restart" button with RotateCcw icon, visible only when gateway connected
- Button shows spinner during save operation

### Task 3: Auto-trigger restart on monitor page
Updated `src/pages/monitor.tsx` with:
- Auto-restart useEffect that checks pendingRestart on mount
- Resets flag immediately (one-time trigger)
- 500ms delay before calling `handleAction("restart")` to let page render
- Moved `handleAction` before useEffect hooks to avoid temporal dead zone

## Deviations from Plan
- **Deviation (Rule 3):** Moved `handleAction` function before useEffect hooks — was defined after the auto-restart effect, causing a temporal dead zone error at runtime. Relocated to ensure proper scoping.

## Self-Check: PASSED
- [x] Gateway store has `pendingRestart` flag and `setPendingRestart` action
- [x] Configure page has "Save & Restart" button (visible when gateway connected)
- [x] Clicking "Save & Restart" saves config (if dirty), sets pendingRestart, navigates to /monitor
- [x] Monitor page auto-triggers restart when pendingRestart is true on mount
- [x] TypeScript compiles cleanly across all modified files
