---
phase: 05-monitoring
plan: 03
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands/monitoring.rs
  - src-tauri/src/lib.rs
  - src/hooks/use-monitoring.ts
  - src/pages/monitor.tsx
autonomous: true
requirements:
  - MON-03
gap_closure: true

must_haves:
  truths:
    - "User can see container log output streamed from OpenClaw sandbox containers"
    - "LogViewer renders actual log lines (not placeholder text)"
    - "useContainerLogs returns real data from get_container_logs command"
  artifacts:
    - path: "src-tauri/src/commands/monitoring.rs"
      provides: "get_container_logs Tauri command"
      contains: "fn get_container_logs"
    - path: "src-tauri/src/lib.rs"
      provides: "get_container_logs registered in invoke_handler"
      contains: "get_container_logs"
    - path: "src/hooks/use-monitoring.ts"
      provides: "useContainerLogs wired to backend"
      contains: 'invoke("get_container_logs"'
    - path: "src/pages/monitor.tsx"
      provides: "LogViewer rendering real log lines"
      min_lines: 215
  key_links:
    - from: "src-tauri/src/commands/monitoring.rs"
      to: "src-tauri/src/lib.rs"
      via: "command registration in invoke_handler"
      pattern: "get_container_logs"
    - from: "src/hooks/use-monitoring.ts"
      to: "src-tauri/src/commands/monitoring.rs"
      via: "Tauri invoke call"
      pattern: 'invoke.*get_container_logs'
    - from: "src/pages/monitor.tsx"
      to: "src/hooks/use-monitoring.ts"
      via: "useContainerLogs hook"
      pattern: "useContainerLogs"
---

<objective>
Close MON-03 gap: Implement container log streaming backend and wire frontend

Purpose: Verification found that Activity Logs card shows "Waiting for log streaming backend..." placeholder. The `useContainerLogs` hook returns hardcoded empty string because `get_container_logs` Tauri command doesn't exist. This plan implements the backend command using bollard's container log API and wires the frontend to display real log output.

Output: Working container log streaming from Docker containers to the Monitor page Activity Logs card.
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/05-monitoring/05-VERIFICATION.md
@.planning/phases/05-monitoring/05-monitoring-01-SUMMARY.md
@.planning/phases/05-monitoring/05-monitoring-02-SUMMARY.md

<interfaces>
From src-tauri/src/commands/monitoring.rs (existing patterns to follow):

```rust
// connect_docker() helper — duplicated per module (line 250-280)
async fn connect_docker() -> Result<Docker, AppError> { ... }

// Command pattern — async fn returning Result<T, AppError>
#[tauri::command]
pub async fn get_sandbox_containers() -> Result<Vec<SandboxContainer>, AppError> { ... }

// Graceful degradation pattern — return empty/unknown on failure, not errors
Err(_) => return Ok(vec![]),
```

From src/hooks/use-monitoring.ts (existing hook pattern to replicate):

```typescript
// useQuery + invoke + refetchInterval pattern
export function useSandboxContainers() {
  return useQuery<SandboxContainer[]>({
    queryKey: ["monitoring", "sandbox"],
    queryFn: async () => {
      return await invoke<SandboxContainer[]>("get_sandbox_containers")
    },
    refetchInterval: 30_000,
    retry: 1,
  })
}

// Placeholder to replace (lines 95-106):
export function useContainerLogs(containerId: string, enabled: boolean) {
  return useQuery<string>({
    queryKey: ["monitoring", "logs", containerId],
    queryFn: async () => {
      // TODO: invoke("get_container_logs", { containerId }) when backend supports it
      return ""
    },
    enabled: enabled && !!containerId,
    refetchInterval: 5_000,
    retry: 0,
  })
}
```

From src/pages/monitor.tsx (LogViewer section to update, lines 206-239):

```tsx
{/* Activity Logs Card — MON-03 */}
<div className="rounded-md bg-muted p-4 font-mono text-xs text-muted-foreground max-h-64 overflow-y-auto">
  <p>Waiting for log streaming backend...</p>  {/* ← Replace with real log lines */}
</div>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Implement get_container_logs Tauri command</name>
  <files>src-tauri/src/commands/monitoring.rs, src-tauri/src/lib.rs</files>
  <read_first>
    src-tauri/src/commands/monitoring.rs
    src-tauri/src/lib.rs
  </read_first>
  <action>
    Add `get_container_logs` command to monitoring.rs following the existing command pattern.

    **In monitoring.rs (add before the private helpers section):**

    1. Import bollard's LogsOptions:
       `use bollard::container::LogsOptions;`

    2. Add command function:
       ```rust
       /// Fetch logs from a Docker container.
       ///
       /// Returns the last `tail` lines of log output as a single string.
       /// Returns empty string if Docker is unavailable or container not found.
       #[tauri::command]
       pub async fn get_container_logs(container_id: String, tail: Option<usize>) -> Result<String, AppError> {
           let docker = match connect_docker().await {
               Ok(d) => d,
               Err(_) => return Ok(String::new()),
           };

           let options = LogsOptions::<String> {
               stdout: true,
               stderr: true,
               tail: tail.unwrap_or(100).to_string(),
               ..Default::default()
           };

           let mut logs_stream = docker.logs(&container_id, Some(options));

           let mut output = String::new();
           use futures_util::StreamExt;
           while let Some(line) = logs_stream.next().await {
               match line {
                   Ok(log_output) => {
                       output.push_str(&log_output.to_string());
                   }
                   Err(_) => break,
               }
           }

           Ok(output)
       }
       ```

    **In lib.rs (add to invoke_handler):**
    - Add `commands::monitoring::get_container_logs,` to the generate_handler list (after line 34)

    Follow existing patterns:
    - `async fn` returning `Result<String, AppError>`
    - `connect_docker()` call with graceful degradation (empty string on failure, not error)
    - `#[tauri::command]` attribute
    - Document with `///` doc comment matching existing style
  </action>
  <verify>
    <automated>cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5</automated>
  </verify>
  <done>get_container_logs command compiles and is registered in invoke_handler. Command accepts container_id (String) and optional tail (usize, default 100), returns Result&lt;String, AppError&gt;.</done>
</task>

<task type="auto">
  <name>Task 2: Wire useContainerLogs hook and update LogViewer UI</name>
  <files>src/hooks/use-monitoring.ts, src/pages/monitor.tsx</files>
  <read_first>
    src/hooks/use-monitoring.ts
    src/pages/monitor.tsx
  </read_first>
  <action>
    **In use-monitoring.ts (replace lines 95-106):**

    Replace the placeholder `useContainerLogs` with a real implementation:
    ```typescript
    /**
     * Fetches container logs for a specific container.
     * Polls every 5s when enabled for near-real-time log updates.
     * Returns last 200 lines of stdout+stderr.
     */
    export function useContainerLogs(containerId: string, enabled: boolean) {
      return useQuery<string>({
        queryKey: ["monitoring", "logs", containerId],
        queryFn: async () => {
          return await invoke<string>("get_container_logs", { containerId, tail: 200 })
        },
        enabled: enabled && !!containerId,
        refetchInterval: 5_000,
        retry: 0,
      })
    }
    ```

    **In monitor.tsx (update Activity Logs card, lines 206-239):**

    1. Add hook call at top of MonitorPage component (near line 33, after existing hook calls):
       `const { data: containerLogs, isLoading: logsLoading } = useContainerLogs(containers?.[0]?.id ?? "", isRunning);`

    2. Replace the Activity Logs card body (lines 216-231) to render real log lines:
    ```tsx
    {isRunning ? (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="default"
            className="bg-green-600 hover:bg-green-700"
          >
            Live
          </Badge>
          {logsLoading && (
            <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
          )}
        </div>
        <div className="rounded-md bg-muted p-4 font-mono text-xs text-muted-foreground max-h-64 overflow-y-auto">
          {containerLogs ? (
            containerLogs.split('\n').map((line, i) => (
              <p key={i} className="whitespace-pre-wrap">{line || '\u00A0'}</p>
            ))
          ) : (
            <p className="text-muted-foreground italic">No log output yet...</p>
          )}
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">
        No logs available — OpenClaw is not running.
      </p>
    )}
    ```

    3. Ensure `Loader2` is imported from `lucide-react` (check existing imports at top of file — if not present, add to the lucide-react import line).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>useContainerLogs invokes get_container_logs with containerId and tail=200. Activity Logs card renders log lines as monospace text rows (not placeholder). Loading spinner shows during fetch. Empty state shows italic message when no logs yet.</done>
</task>

</tasks>

<verification>
- `cargo check` passes (backend compiles)
- `npx tsc --noEmit` passes (frontend type-checks)
- `grep -r "Waiting for log streaming backend" src/` returns nothing (placeholder removed)
- `grep "get_container_logs" src-tauri/src/lib.rs` shows command registered
- `grep 'invoke("get_container_logs"' src/hooks/use-monitoring.ts` shows hook wired
</verification>

<success_criteria>
- [ ] get_container_logs command exists in monitoring.rs using bollard LogsOptions
- [ ] get_container_logs registered in lib.rs invoke_handler
- [ ] useContainerLogs hook invokes the backend command (no more TODO/placeholder)
- [ ] Activity Logs card renders actual log lines in monospace area
- [ ] No "Waiting for log streaming backend..." text remains in codebase
- [ ] Cargo check passes
- [ ] TypeScript check passes
</success_criteria>

<output>
After completion, create `.planning/phases/05-monitoring/05-monitoring-03-SUMMARY.md`
</output>
