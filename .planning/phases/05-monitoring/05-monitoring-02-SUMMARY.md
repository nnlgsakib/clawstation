---
phase: 05-monitoring
plan: 02
subsystem: monitoring
tags: [tanstack-query, react, monitoring, dashboard, tauri]

requires:
  - phase: 05-monitoring-01
    provides: "Rust monitoring commands (get_openclaw_status, get_agent_sessions, get_sandbox_containers) and OpenClawStatus/AgentSession/SandboxContainer types"
provides:
  - "4 TanStack Query hooks for monitoring data (useOpenClawStatus, useAgentSessions, useSandboxContainers, useContainerLogs)"
  - "Full monitoring dashboard page replacing PageStub at /monitor"
  - "Monitoring-specific error messages and pattern matching"
affects: [update-engine, uninstall-engine]

tech-stack:
  added: []
  patterns: ["TanStack Query + Tauri invoke pattern for monitoring hooks", "Adaptive polling intervals based on state", "Tagged union type matching Rust serde tag"]

key-files:
  created:
    - src/hooks/use-monitoring.ts
  modified:
    - src/pages/monitor.tsx
    - src/lib/errors.ts

key-decisions:
  - "Adaptive polling: 15s when OpenClaw not running, 1min when running; 30s for sessions/containers; 5s for logs"
  - "useContainerLogs returns placeholder empty string until get_container_logs backend command exists"
  - "Status badge colors match docker.tsx pattern (green=running, yellow=stopped, red=error)"

patterns-established:
  - "Monitoring hooks use same useQuery + invoke pattern as docker hooks"
  - "StatusBadge components follow docker.tsx color scheme"

requirements-completed: [MON-01, MON-02, MON-03, MON-04]

duration: 3min
completed: 2026-03-26
---

# Phase 05 Plan 02: Monitoring Frontend Summary

**Monitoring dashboard with 4 TanStack Query hooks, real-time status cards, agent sessions list, container logs placeholder, and sandbox container status — all auto-polling via adaptive intervals**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T04:05:35Z
- **Completed:** 2026-03-26T04:08:41Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Created 4 TanStack Query hooks (`useOpenClawStatus`, `useAgentSessions`, `useSandboxContainers`, `useContainerLogs`) following established use-docker.ts pattern
- Built full monitoring dashboard page replacing PageStub with 4 card sections (status, sessions, logs, sandbox containers)
- Added monitoring-specific error messages (`openclaw_not_running`, `api_unavailable`) with pattern matching
- TypeScript types match Rust monitoring structs exactly (camelCase via serde)

## Task Commits

1. **Task 1: Create monitoring hooks and extend error messages** - `0f71de1` (feat)
2. **Task 2: Build monitoring dashboard page** - `eee3da1` (feat)

## Files Created/Modified
- `src/hooks/use-monitoring.ts` — 4 TanStack Query hooks with adaptive polling intervals
- `src/pages/monitor.tsx` — Full monitoring dashboard (was PageStub)
- `src/lib/errors.ts` — Added openclaw_not_running and api_unavailable error entries + pattern matching

## Decisions Made
- Adaptive polling: 15s when not running (detect startup), 1min when running; 30s for sessions/containers; 5s for logs
- useContainerLogs is a placeholder (returns empty string) until get_container_logs backend command is built
- Status badge colors match docker.tsx pattern (green/running, yellow/stopped, red/error)

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness
- Monitoring frontend complete — all 4 requirements (MON-01 through MON-04) satisfied
- Ready for Phase 06 (update-engine) or uninstall-engine planning
- Log streaming placeholder ready for backend get_container_logs command

---
*Phase: 05-monitoring*
*Completed: 2026-03-26*
