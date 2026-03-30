# Phase 17: Gateway Startup UX Fix - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning
**Source:** Direct user report + codebase exploration

<domain>
## Phase Boundary

Fix the gateway startup status detection race condition where:
1. User clicks "Start Gateway" button
2. UI immediately shows "Gateway is running" (optimistic)
3. WebUI and status indicators don't update for several seconds/minutes
4. Eventually status updates and shows real running state

This phase delivers accurate, real-time gateway status feedback with proper startup state transitions.
</domain>

<decisions>
## Implementation Decisions

### Status State Machine
- Add explicit "starting" state between disconnected and connected
- Don't optimistically set connected after spawn — wait for actual readiness
- Each state has clear visual indicator

### Readiness Detection
- Use existing health check polling (`/healthz`, `/readyz`) from `verify.rs`
- Expose health check as runtime status check, not just post-install
- Port check alone is insufficient — must verify gateway is serving requests

### Event-Based Updates
- Backend emits granular status events: "starting", "health_check_passed", "ready"
- Frontend transitions through states as events arrive
- No arbitrary timeouts — rely on actual health responses

### WebUI Link Behavior
- Disable WebUI/control UI links when not ready
- Show tooltip explaining why (e.g., "Gateway starting...")
- Enable only after confirmed ready state

### Stale State Prevention
- Add periodic status polling as fallback (every 5 seconds)
- Gateway crash detection via process monitoring
- Clear state on disconnect/error events

### UX Feedback
- Status indicator shows phase-specific labels: "Disconnected" → "Starting..." → "Connecting to Gateway..." → "Connected"
- Optional: Show startup progress in monitor page (health check attempts)
- Color coding: gray → amber → green progression
</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Gateway Backend
- `src-tauri/src/commands/gateway.rs` — Gateway start/stop/status commands (spawn, port check, process monitoring)
- `src-tauri/src/commands/gateway_ws.rs` — WebSocket connection logic
- `src-tauri/src/install/verify.rs` — Health check polling implementation (`verify_gateway_health`)
- `src-tauri/src/state.rs` — AppState with gateway_pid, connection state

### Gateway Frontend
- `src/hooks/use-gateway.ts` — Main gateway hooks (status listener, actions, WebSocket)
- `src/stores/use-gateway-store.ts` — Zustand state store for gateway connection
- `src/pages/monitor.tsx` — Gateway status controls, logs, quick links
- `src/pages/openclaw-webapp.tsx` — Control UI launcher with gateway check
- `src/components/layout/app-shell.tsx` — Sidebar with gateway indicator

### UI Standards
- `.claude/get-shit-done/references/ui-brand.md` — UI color palette and component standards
</canonical_refs>

<specifics>
## Specific Ideas

### Current Problem (from code exploration)
1. `useGatewayActions.start()` in `use-gateway.ts:85-92` calls `setConnected()` immediately after `invoke("start_gateway")` returns
2. `start_gateway` in `gateway.rs:168-172` returns `running: true` as soon as process spawns, not when ready
3. TCP port check in `get_gateway_status` doesn't verify gateway is healthy
4. No polling mechanism — relies entirely on events which may be missed

### Solution Approach
1. Backend: Add health check loop to `start_gateway` command, emit status events during startup
2. Backend: Return startup phase in status response ("starting", "health_check", "ready")
3. Frontend: Add `starting` state to gateway store, disable optimistic connection
4. Frontend: Show phase-appropriate UI feedback during startup
</specifics>

<deferred>
## Deferred Ideas

- Real-time startup progress bar (nice-to-have, not critical for fix)
- Telemetry/metrics for gateway startup time tracking
- Custom health check timeout configuration

These are enhancements that can be added after the core fix is verified working.
</deferred>

---

*Phase: 17-gateway-startup-ux-fix*
*Context gathered: 2026-03-30 via user report + exploration*
