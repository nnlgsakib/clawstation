---
phase: 05-monitoring
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands/monitoring.rs
  - src-tauri/src/commands/mod.rs
  - src-tauri/src/lib.rs
autonomous: true
requirements:
  - MON-01
  - MON-02
  - MON-04

must_haves:
  truths:
    - "App can check whether OpenClaw is running by querying Docker containers"
    - "App can retrieve active agent sessions from OpenClaw API"
    - "App can list sandbox containers with their state (running/stopped/absent)"
  artifacts:
    - path: "src-tauri/src/commands/monitoring.rs"
      provides: "Tauri commands for OpenClaw status, agent sessions, sandbox containers"
      exports: ["get_openclaw_status", "get_agent_sessions", "get_sandbox_containers"]
    - path: "src-tauri/src/commands/mod.rs"
      provides: "Module declaration for monitoring commands"
      contains: "pub mod monitoring"
    - path: "src-tauri/src/lib.rs"
      provides: "Registered monitoring commands in invoke_handler"
      contains: "commands::monitoring::get_openclaw_status"
  key_links:
    - from: "src-tauri/src/commands/monitoring.rs"
      to: "bollard Docker API"
      via: "connect_docker() helper + container listing"
      pattern: "bollard::container::ListContainersOptions"
    - from: "src-tauri/src/commands/monitoring.rs"
      to: "OpenClaw HTTP API"
      via: "reqwest GET to localhost:{port}/api/sessions"
      pattern: "reqwest::get.*sessions"
---

<objective>
Create monitoring backend: Rust types and Tauri commands for OpenClaw process status, active agent sessions, and sandbox container inspection.

Purpose: Provide the data layer that the monitoring frontend will consume. All four monitoring requirements (MON-01 through MON-04) need backend commands before the UI can display anything.
Output: 3 new Tauri commands registered in invoke_handler, shared types for OpenClaw status, agent sessions, and sandbox containers.
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

<interfaces>
From src-tauri/src/commands/docker.rs — reuse these:
```rust
pub async fn connect_docker() -> Result<Docker, AppError>  // private helper
pub struct DockerStatus { installed, running, version, api_version, platform, docker_desktop, wsl_backend }
pub struct DockerInfo { status, containers_running, images_count, server_version, os_type }
```

From src-tauri/src/error.rs — use these error variants:
```rust
pub enum AppError {
    DockerNotInstalled { suggestion: String },
    DockerDaemonNotRunning { suggestion: String },
    DockerDesktopNotRunning { suggestion: String },
    DockerUnavailable { suggestion: String },
    Internal { message: String, suggestion: String },
}
```

From src-tauri/src/commands/config.rs — OpenClaw config has provider/sandbox/tools/agents sections. Config is at ~/.openclaw/config.yaml.

From bollard 0.20 — Docker API client:
```rust
use bollard::Docker;
use bollard::container::ListContainersOptions;
// Docker::connect_with_socket_defaults() — Linux
// Docker::connect_with_http_defaults() — Windows
// docker.list_containers(options) -> Vec<ContainerSummary>
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create monitoring types and OpenClaw status command</name>
  <files>src-tauri/src/commands/monitoring.rs, src-tauri/src/commands/mod.rs, src-tauri/src/lib.rs</files>
  <read_first>
    src-tauri/src/commands/docker.rs
    src-tauri/src/error.rs
    src-tauri/src/commands/mod.rs
    src-tauri/src/lib.rs
    src-tauri/src/commands/config.rs
  </read_first>
  <action>
    Create `src-tauri/src/commands/monitoring.rs` with:

    1. **Structs** (all with `#[derive(Debug, Clone, Serialize, Deserialize)]` and `#[serde(rename_all = "camelCase")]`):

    ```rust
    /// Overall OpenClaw process status.
    pub enum OpenClawStatus {
        Running { version: Option<String>, port: u16 },
        Stopped,
        Error { message: String },
        Unknown,
    }

    /// An active agent session running inside OpenClaw.
    pub struct AgentSession {
        pub id: String,
        pub name: Option<String>,
        pub status: String,       // "active", "idle", "error"
        pub started_at: Option<String>,  // ISO 8601
        pub model: Option<String>,
    }

    /// A Docker container associated with OpenClaw sandboxing.
    pub struct SandboxContainer {
        pub id: String,
        pub name: String,
        pub state: String,        // "running", "exited", "paused", "dead"
        pub status_text: String,  // "Up 2 hours", "Exited (0) 5 min ago"
        pub image: String,
        pub created: String,      // ISO 8601
    }
    ```

    Note: `OpenClawStatus` must be an enum (not struct) because the frontend needs to match on Running vs Stopped vs Error vs Unknown. Use `#[serde(tag = "state")]` for tagged enum serialization.

    2. **`get_openclaw_status` command:**
    - Connect to Docker using the same platform dispatch as `docker.rs` (socket on Linux, HTTP on Windows)
    - If Docker connection fails → return `OpenClawStatus::Unknown`
    - List containers with filter `name=openclaw` (bollard `ListContainersOptions` with `all: true`)
    - If no container found → `OpenClawStatus::Stopped`
    - If container state is "running" → `OpenClawStatus::Running { version: from container labels, port: 3000 default }`
    - If container state is "exited" or "dead" → `OpenClawStatus::Stopped`
    - If container state is "restarting" → `OpenClawStatus::Error { message: "Container is restarting" }`
    - Default OpenClaw port: read from env var `OPENCLAW_PORT` or default to 3000

    3. **`get_agent_sessions` command:**
    - First call `get_openclaw_status` internally
    - If not Running → return empty Vec (not an error — sessions just aren't available)
    - Use reqwest to GET `http://localhost:{port}/api/sessions`
    - Parse JSON response as `Vec<AgentSession>`
    - On HTTP error (timeout, connection refused) → return empty Vec with no error (OpenClaw may not expose this API yet)
    - Timeout: 5 seconds (don't block the UI)

    4. **`get_sandbox_containers` command:**
    - Connect to Docker (reuse pattern from step 2)
    - List ALL containers (all: true)
    - Filter to those whose names contain "openclaw-sandbox" OR whose labels include `openclaw.component=sandbox`
    - Map each to `SandboxContainer` struct
    - If Docker unavailable → return empty Vec (not an error)

    Then update `src-tauri/src/commands/mod.rs`:
    ```rust
    pub mod monitoring;
    ```

    And update `src-tauri/src/lib.rs` — add to invoke_handler:
    ```rust
    commands::monitoring::get_openclaw_status,
    commands::monitoring::get_agent_sessions,
    commands::monitoring::get_sandbox_containers,
    ```

    **Extract the Docker connection helper:** `connect_docker()` in docker.rs is private. Either:
    - Make it `pub(crate)` in docker.rs, OR
    - Duplicate the 10-line platform dispatch in monitoring.rs (simpler, no cross-module coupling)

    Choose duplication — it's only 10 lines and avoids coupling modules. Each command module is self-contained.
  </action>
  <verify>
    <automated>cd src-tauri && cargo check 2>&1 | tail -5</automated>
  </verify>
  <done>
    - src-tauri/src/commands/monitoring.rs exists with OpenClawStatus enum, AgentSession struct, SandboxContainer struct
    - 3 Tauri commands implemented: get_openclaw_status, get_agent_sessions, get_sandbox_containers
    - All commands return Result<T, AppError> and are registered in lib.rs invoke_handler
    - `cargo check` passes with no errors
  </done>
</task>

</tasks>

<verification>
- cargo check passes
- All 3 commands are in invoke_handler
- Structs are serializable (serde derives present)
</verification>

<success_criteria>
Monitoring backend provides 3 Tauri commands that the frontend can invoke via `invoke()`. Commands handle Docker unavailability gracefully (return empty/unknown, not crashes). Types follow project serde conventions (camelCase).
</success_criteria>

<output>
After completion, create `.planning/phases/05-monitoring/05-monitoring-01-SUMMARY.md`
</output>
