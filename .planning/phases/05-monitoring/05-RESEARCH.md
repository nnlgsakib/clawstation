# Phase 5: Monitoring — Research

**Researched:** 2026-03-26
**Level:** 1 (Quick verification — known stack, established patterns)

## Key Questions Answered

### 1. How to detect OpenClaw running status? (MON-01)
**Answer:** Check Docker containers with "openclaw" in name/labels via bollard.
- Use `bollard::container::ListContainersOptions` with filters for `name=openclaw`
- Map container `State` field: "running" → Running, "exited"/"dead" → Stopped, "restarting" → Error
- Already have `connect_docker()` helper in `commands/docker.rs` — reuse it
- Fallback: if Docker is down, OpenClaw status is Unknown (not error — Docker itself is the problem)

### 2. How to get active agent sessions? (MON-02)
**Answer:** Query OpenClaw's API endpoint for sessions.
- OpenClaw exposes `GET /api/sessions` returning active agent sessions
- Use `reqwest` (already in Cargo.toml) to HTTP call localhost:{port}/api/sessions
- Need to read OpenClaw config to determine the port (default 3000)
- Parse response into `AgentSession` struct: id, name, status, startedAt
- Graceful degradation: if API unreachable, show "OpenClaw running but API unavailable"

### 3. How to stream activity logs? (MON-03)
**Answer:** Two approaches — use Docker logs via bollard for container-level, or OpenClaw API for agent-level.
- **Container logs:** `bollard::container::LogsOptions` with `follow: true` for streaming
- **Agent logs:** OpenClaw API `GET /api/sessions/{id}/logs` with SSE streaming
- Recommended: Start with Docker container logs (works even if OpenClaw API is down)
- Frontend: Use Tauri events for streaming (tauri-plugin-notification pattern), not polling
- Buffer last N lines in Rust state, emit new lines as Tauri events

### 4. How to show sandbox container status? (MON-04)
**Answer:** List Docker containers filtered by sandbox labels.
- Use `bollard::container::ListContainersOptions` with label filter `openclaw.sandbox=true`
- For each container: name, state, created time, image
- Reuse existing Docker health connection from `commands/docker.rs`
- Can combine with MON-01 (OpenClaw status) in a single command for efficiency

## Architecture Decisions

### Backend (Rust)
- **New file:** `src-tauri/src/commands/monitoring.rs` — all monitoring Tauri commands
- **Structs:** `OpenClawStatus`, `AgentSession`, `AgentLogEntry`, `SandboxContainer`
- **Commands:** `get_openclaw_status`, `get_agent_sessions`, `get_container_logs`, `get_sandbox_containers`
- **Reuse:** `connect_docker()` from `commands/docker.rs` (extract to shared module or import)

### Frontend (React)
- **New file:** `src/hooks/use-monitoring.ts` — TanStack Query hooks following use-docker pattern
- **Modified:** `src/pages/monitor.tsx` — replace PageStub with monitoring dashboard
- **Pattern:** Adaptive polling like useDockerHealth (fast when not running, slow when healthy)
- **Log streaming:** Use `useQuery` with `refetchInterval` for logs (SSE/Tauri events in future phase)

### Key Patterns to Follow
- `#[tauri::command]` async fn returning `Result<T, AppError>`
- `#[serde(rename_all = "camelCase")]` on all shared structs
- TanStack Query: `useQuery` + `invoke` + `refetchInterval`
- Card-based UI with shadcn components (matching docker.tsx style)
- StatusBadge component pattern (green/yellow/red)

## What NOT to Do
- Don't shell out to `docker` CLI — use bollard API exclusively
- Don't create a WebSocket for logs — use polling with refetchInterval (SSE is v2 scope)
- Don't store monitoring data in Zustand — use TanStack Query cache (server state pattern)
- Don't hardcode OpenClaw port — read from config or use default
- Don't add new dependencies — reqwest and bollard already available

## Validation Architecture

**MON-01 verified by:** `curl -s http://localhost:{port}/api/health` returns 200 when running
**MON-02 verified by:** Frontend renders agent session list from `get_agent_sessions` command
**MON-03 verified by:** Log entries appear in UI after invoking `get_container_logs`
**MON-04 verified by:** Sandbox containers listed with correct state badges

---

*Research completed: 2026-03-26*
*Level: 1 (Quick verification)*
