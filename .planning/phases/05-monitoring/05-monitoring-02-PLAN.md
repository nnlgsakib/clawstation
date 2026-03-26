---
phase: 05-monitoring
plan: 02
type: execute
wave: 2
depends_on:
  - 05-monitoring-01
files_modified:
  - src/hooks/use-monitoring.ts
  - src/pages/monitor.tsx
  - src/lib/errors.ts
autonomous: true
requirements:
  - MON-01
  - MON-02
  - MON-03
  - MON-04

must_haves:
  truths:
    - "User can see OpenClaw running/stopped/error status at a glance from the Monitor page"
    - "User can see a list of active agent sessions with status and model info"
    - "User can see sandbox container status (running/stopped) with container names"
    - "User can see container logs streamed from OpenClaw sandbox containers"
    - "Monitor page auto-refreshes data without manual intervention"
  artifacts:
    - path: "src/hooks/use-monitoring.ts"
      provides: "TanStack Query hooks for monitoring data"
      exports: ["useOpenClawStatus", "useAgentSessions", "useSandboxContainers", "useContainerLogs"]
    - path: "src/pages/monitor.tsx"
      provides: "Monitoring dashboard page replacing PageStub"
      contains: "StatusCard|SessionList|SandboxStatus|LogViewer"
    - path: "src/lib/errors.ts"
      provides: "Monitoring-specific error messages"
      contains: "openclaw_not_running|api_unavailable"
  key_links:
    - from: "src/hooks/use-monitoring.ts"
      to: "src-tauri monitoring commands"
      via: "invoke('get_openclaw_status'), invoke('get_agent_sessions'), etc."
      pattern: "invoke<.*>\\(\"get_(openclaw_status|agent_sessions|sandbox_containers)"
    - from: "src/pages/monitor.tsx"
      to: "src/hooks/use-monitoring.ts"
      via: "useOpenClawStatus(), useAgentSessions(), useSandboxContainers()"
      pattern: "useOpenClawStatus|useAgentSessions|useSandboxContainers"
    - from: "src/pages/monitor.tsx"
      to: "shadcn Card/Badge/Alert components"
      via: "matching docker.tsx visual pattern"
      pattern: "Card|Badge|Alert"
---

<objective>
Build monitoring frontend: TanStack Query hooks and the Monitor dashboard page.

Purpose: Give users a real-time view of OpenClaw status, agent sessions, sandbox containers, and container logs. Replaces the PageStub placeholder that currently exists at /monitor.
Output: 4 TanStack Query hooks, full monitoring dashboard page with status cards, session list, sandbox status, and log viewer.
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/05-monitoring/05-RESEARCH.md
@.planning/phases/05-monitoring/05-monitoring-01-SUMMARY.md

<interfaces>
From src/hooks/use-docker.ts — established TanStack Query pattern:
```typescript
export function useDockerHealth() {
  return useQuery<DockerStatus>({
    queryKey: ["docker", "health"],
    queryFn: async () => await invoke<DockerStatus>("check_docker_health"),
    refetchInterval: (query) => { /* adaptive: 30s when down, 5min when healthy */ },
    retry: 1,
  })
}
```

From src/pages/docker.tsx — UI pattern to follow:
- Header with title, description, Refresh button
- Card-based layout with CardHeader, CardTitle, CardContent
- StatusBadge component (green=Running, yellow=Warning, red=Error)
- Alert components for error/informational states
- Icons from lucide-react (CheckCircle2, AlertTriangle, XCircle, RefreshCw)

From src/lib/errors.ts — error pattern matching:
```typescript
export const errorMessages: Record<string, AppError> = { ... }
export function formatError(error: unknown): AppError { ... }
function matchErrorPattern(message: string): AppError | null { ... }
```

From src-tauri/src/commands/monitoring.rs (created by Plan 01):
```rust
pub enum OpenClawStatus { Running { version, port }, Stopped, Error { message }, Unknown }
pub struct AgentSession { id, name, status, started_at, model }
pub struct SandboxContainer { id, name, state, status_text, image, created }
```

From src/components/ui/ — available shadcn components:
- card.tsx (Card, CardHeader, CardTitle, CardDescription, CardContent)
- badge.tsx (Badge with variants: default, secondary, destructive, outline)
- alert.tsx (Alert, AlertTitle, AlertDescription)
- button.tsx (Button with variants)
- progress.tsx (Progress bar)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create monitoring hooks and extend error messages</name>
  <files>src/hooks/use-monitoring.ts, src/lib/errors.ts</files>
  <read_first>
    src/hooks/use-docker.ts
    src/lib/errors.ts
    src-tauri/src/commands/monitoring.rs
  </read_first>
  <action>
    Create `src/hooks/use-monitoring.ts` with 4 TanStack Query hooks following the use-docker.ts pattern:

    **1. `useOpenClawStatus()`**
    ```typescript
    // TypeScript type matching the Rust OpenClawStatus enum:
    type OpenClawStatus =
      | { state: "running"; version: string | null; port: number }
      | { state: "stopped" }
      | { state: "error"; message: string }
      | { state: "unknown" }

    // Hook:
    return useQuery<OpenClawStatus>({
      queryKey: ["monitoring", "status"],
      queryFn: async () => await invoke<OpenClawStatus>("get_openclaw_status"),
      refetchInterval: (query) => {
        if (query.state.data?.state !== "running") return 15_000  // Poll every 15s when not running
        return 60_000  // 1min when running
      },
      retry: 1,
    })
    ```

    **2. `useAgentSessions()`**
    ```typescript
    interface AgentSession {
      id: string
      name: string | null
      status: string  // "active" | "idle" | "error"
      startedAt: string | null
      model: string | null
    }

    return useQuery<AgentSession[]>({
      queryKey: ["monitoring", "sessions"],
      queryFn: async () => await invoke<AgentSession[]>("get_agent_sessions"),
      refetchInterval: 30_000,  // 30s — sessions change frequently
      retry: 1,
    })
    ```

    **3. `useSandboxContainers()`**
    ```typescript
    interface SandboxContainer {
      id: string
      name: string
      state: string  // "running" | "exited" | "paused" | "dead"
      statusText: string
      image: string
      created: string
    }

    return useQuery<SandboxContainer[]>({
      queryKey: ["monitoring", "sandbox"],
      queryFn: async () => await invoke<SandboxContainer[]>("get_sandbox_containers"),
      refetchInterval: 30_000,
      retry: 1,
    })
    ```

    **4. `useContainerLogs(containerId: string, enabled: boolean)`**
    ```typescript
    // For now, this is a placeholder that returns empty string.
    // Log streaming will be added when get_container_logs command exists.
    // Include the hook signature so the page can reference it.
    return useQuery<string>({
      queryKey: ["monitoring", "logs", containerId],
      queryFn: async () => {
        // TODO: invoke("get_container_logs", { containerId }) when backend supports it
        return ""
      },
      enabled: enabled && !!containerId,
      refetchInterval: 5_000,  // 5s for log updates
      retry: 0,
    })
    ```

    Also add TypeScript interfaces that match the Rust structs exactly (camelCase from serde).

    ---

    Then update `src/lib/errors.ts` — add monitoring error messages:

    After the existing `network_error` entry, add:
    ```typescript
    openclaw_not_running: {
      message: "OpenClaw is not running.",
      suggestion: "Start OpenClaw from the Install page or via Docker: docker run openclaw",
    },
    api_unavailable: {
      message: "OpenClaw API is not responding.",
      suggestion: "OpenClaw may be starting up. Wait a moment and try refreshing.",
    },
    ```

    Update `matchErrorPattern` to handle monitoring errors — add before the generic "docker" fallback:
    ```typescript
    if (lower.includes("openclaw") && lower.includes("not running")) return errorMessages.openclaw_not_running
    if (lower.includes("openclaw") && lower.includes("api")) return errorMessages.api_unavailable
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | tail -10</automated>
  </verify>
  <done>
    - src/hooks/use-monitoring.ts exists with 4 exported hooks
    - Each hook follows the useDockerHealth pattern (useQuery + invoke + refetchInterval)
    - TypeScript interfaces match Rust struct shapes (camelCase)
    - src/lib/errors.ts has openclaw_not_running and api_unavailable error entries
    - TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Build monitoring dashboard page</name>
  <files>src/pages/monitor.tsx</files>
  <read_first>
    src/pages/monitor.tsx
    src/pages/docker.tsx
    src/hooks/use-monitoring.ts
    src/components/ui/card.tsx
    src/components/ui/badge.tsx
    src/components/ui/alert.tsx
  </read_first>
  <action>
    Replace the PageStub in `src/pages/monitor.tsx` with a full monitoring dashboard.

    Layout follows docker.tsx pattern:
    ```
    Header: "Monitor" + "Real-time OpenClaw status and activity" + Refresh button
    ├── StatusCard: OpenClaw running status (MON-01)
    ├── SessionList: Active agent sessions (MON-02)
    ├── LogViewer: Container log stream (MON-03)
    └── SandboxStatus: Sandbox container list (MON-04)
    ```

    **Section 1: OpenClaw Status Card** (MON-01)
    - Card with title "OpenClaw" and status badge
    - Badge: green "Running" + version, yellow "Stopped", red "Error" + message, gray "Unknown"
    - If running: show port number and version in a 2-column grid
    - If stopped: Alert with "OpenClaw is not currently running" and link to install page
    - If error: destructive Alert with error message
    - Uses `useOpenClawStatus()` hook

    **Section 2: Agent Sessions Card** (MON-02)
    - Card with title "Agent Sessions" and session count in badge
    - List of sessions with: name (or "Session {id}"), status badge, model, started time
    - Empty state: "No active sessions" message
    - Each session as a row with flex layout: left=name+model, right=status+time
    - Uses `useAgentSessions()` hook

    **Section 3: Container Logs Card** (MON-03)
    - Card with title "Activity Logs"
    - Monospace scrollable area (max-h-64, overflow-y-auto)
    - Show last 50 lines of container output
    - "Live" indicator badge when OpenClaw is running
    - Empty state: "No logs available" when OpenClaw is stopped
    - Uses `useContainerLogs()` hook (placeholder for now — shows "Log streaming coming soon" until backend supports it)

    **Section 4: Sandbox Containers Card** (MON-04)
    - Card with title "Sandbox Containers" and container count
    - Table-style list: name, state badge, image, status text
    - Each container row: left=name+image, right=state badge+status
    - Empty state: "No sandbox containers" with hint about enabling sandbox in Configure
    - Uses `useSandboxContainers()` hook

    **Common patterns to reuse from docker.tsx:**
    - `StatusBadge` component logic (green/yellow/red based on state)
    - Refresh button with spinning animation during load
    - Card structure: Card > CardHeader (title+badge) > CardContent
    - `useQueryClient` + `invalidateQueries` for manual refresh
    - `showError(error)` for error state

    **Imports:**
    ```typescript
    import { useOpenClawStatus, useAgentSessions, useSandboxContainers, useContainerLogs } from "@/hooks/use-monitoring"
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
    import { Badge } from "@/components/ui/badge"
    import { Button } from "@/components/ui/button"
    import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
    import { RefreshCw, CheckCircle2, AlertTriangle, XCircle, Container, Activity, Terminal } from "lucide-react"
    import { useQueryClient } from "@tanstack/react-query"
    import { Link } from "react-router-dom"
    ```

    **Component structure:**
    ```typescript
    export function Monitor() {
      const { data: status, isLoading: statusLoading } = useOpenClawStatus()
      const { data: sessions, isLoading: sessionsLoading } = useAgentSessions()
      const { data: containers, isLoading: containersLoading } = useSandboxContainers()
      const queryClient = useQueryClient()

      const handleRefresh = () => {
        queryClient.invalidateQueries({ queryKey: ["monitoring"] })
      }

      return (
        <div className="space-y-6">
          {/* Header */}
          {/* OpenClaw Status Card */}
          {/* Agent Sessions Card */}
          {/* Activity Logs Card */}
          {/* Sandbox Containers Card */}
        </div>
      )
    }
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit --pretty 2>&1 | tail -10</automated>
  </verify>
  <done>
    - src/pages/monitor.tsx is no longer a PageStub — renders full monitoring dashboard
    - Page has 4 sections: Status, Sessions, Logs, Sandbox Containers
    - Each section uses the corresponding use-monitoring hook
    - Status badges use green/yellow/red color scheme matching docker.tsx
    - Refresh button invalidates all monitoring queries
    - TypeScript compiles cleanly with no errors
  </done>
</task>

</tasks>

<verification>
- npx tsc --noEmit passes
- npm run build compiles successfully
- Monitor page renders 4 card sections
- All hooks call correct Tauri commands via invoke()
</verification>

<success_criteria>
Monitoring dashboard replaces PageStub. Users can see OpenClaw status, active sessions, sandbox containers, and log placeholder — all auto-refreshing via TanStack Query. UI matches established docker.tsx visual pattern.
</success_criteria>

<output>
After completion, create `.planning/phases/05-monitoring/05-monitoring-02-SUMMARY.md`
</output>
