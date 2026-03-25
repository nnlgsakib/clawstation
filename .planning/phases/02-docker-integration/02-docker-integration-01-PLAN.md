---
phase: 02-docker-integration
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/error.rs
  - src-tauri/src/commands/docker.rs
  - src-tauri/src/commands/mod.rs
  - src-tauri/src/lib.rs
  - src-tauri/Cargo.toml
  - src-tauri/capabilities/default.json
autonomous: true
requirements:
  - INST-03
  - ERR-03

must_haves:
  truths:
    - "App detects whether Docker is installed and running on the current system"
    - "App detects Docker Desktop and WSL2 backend status on Windows"
    - "Docker health check returns structured status (installed, running, version, platform)"
    - "When Docker is unavailable, app returns a structured error with user-facing guidance"
  artifacts:
    - path: "src-tauri/src/commands/docker.rs"
      provides: "Docker detection, health check, and info Tauri commands"
      exports: ["check_docker_health", "get_docker_info", "detect_docker"]
    - path: "src-tauri/src/error.rs"
      provides: "Docker-specific AppError variants with suggestions"
      contains: "DockerNotInstalled"
  key_links:
    - from: "src-tauri/src/commands/docker.rs"
      to: "bollard::Docker"
      via: "connect_with_socket_defaults / connect_with_http_defaults"
      pattern: "Docker::connect_with"
    - from: "src-tauri/src/commands/docker.rs"
      to: "AppError"
      via: "Result<T, AppError> return type"
      pattern: "Result<.*AppError"
    - from: "src-tauri/src/lib.rs"
      to: "commands::docker"
      via: "invoke_handler registration"
      pattern: "commands::docker::"
---

<objective>
Create the Rust Docker backend — types, detection logic, health check, and Tauri command interface

Purpose: Phase 1 established the project scaffold with AppError and platform detection. Phase 2 needs a Docker module that can detect Docker installation, check daemon health, and provide structured status to the frontend. This is the backend foundation for all Docker-dependent features (installation, monitoring, lifecycle).

Output: `src-tauri/src/commands/docker.rs` with 3 Tauri commands, expanded AppError variants, updated Cargo.toml with bollard, updated capabilities for shell permissions
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/phases/02-docker-integration/RESEARCH.md

# Phase 1 artifacts this plan builds on:
@src-tauri/src/error.rs — AppError enum with DockerUnavailable variant
@src-tauri/src/state.rs — AppState struct
@src-tauri/src/commands/platform.rs — existing command pattern reference
@src-tauri/src/lib.rs — plugin registration and invoke handler
@src-tauri/Cargo.toml — current Rust dependencies
@src-tauri/capabilities/default.json — Tauri security permissions
</context>

<tasks>

<task type="auto">
  <name>Task 1: Add Docker error variants, types, and bollard dependency</name>
  <files>src-tauri/src/error.rs, src-tauri/Cargo.toml</files>
  <read_first>
    - src-tauri/src/error.rs (current AppError enum)
    - src-tauri/Cargo.toml (current dependencies)
  </read_first>
  <action>
    1. In `src-tauri/Cargo.toml`, add bollard dependency:
       ```toml
       bollard = "0.20"
       ```

    2. In `src-tauri/src/error.rs`, expand the AppError enum with Docker-specific variants. Keep the existing `DockerUnavailable` variant but add more granular errors. Each variant MUST have a `suggestion: String` field per ERR-01 pattern:

       ```rust
       #[derive(Debug, thiserror::Error, Serialize)]
       #[serde(rename_all = "camelCase")]
       pub enum AppError {
           #[error("Docker is not installed: {suggestion}")]
           DockerNotInstalled { suggestion: String },

           #[error("Docker daemon is not running: {suggestion}")]
           DockerDaemonNotRunning { suggestion: String },

           #[error("Docker Desktop is not running: {suggestion}")]
           DockerDesktopNotRunning { suggestion: String },

           #[error("WSL2 Docker backend is not ready: {suggestion}")]
           WslBackendNotReady { suggestion: String },

           #[error("Docker is unavailable: {suggestion}")]
           DockerUnavailable { suggestion: String },

           #[error("Installation failed: {reason}. {suggestion}")]
           InstallationFailed { reason: String, suggestion: String },

           #[error("Configuration error: {message}. {suggestion}")]
           ConfigError { message: String, suggestion: String },

           #[error("Unsupported platform: {platform}. {suggestion}")]
           UnsupportedPlatform { platform: String, suggestion: String },

           #[error("Internal error: {message}. {suggestion}")]
           Internal { message: String, suggestion: String },
       }
       ```

    3. Add a `DockerStatus` struct to docker.rs (see Task 2) or as a separate types module. Define it as:
       ```rust
       #[derive(Debug, Clone, Serialize, Deserialize)]
       #[serde(rename_all = "camelCase")]
       pub struct DockerStatus {
           pub installed: bool,
           pub running: bool,
           pub version: Option<String>,
           pub api_version: Option<String>,
           pub platform: String,  // "windows" or "linux"
           pub docker_desktop: bool,  // true if Docker Desktop detected (Windows)
           pub wsl_backend: bool,  // true if WSL2 backend active (Windows)
       }
       ```

    4. Also add a `DockerInfo` struct for extended status:
       ```rust
       #[derive(Debug, Clone, Serialize, Deserialize)]
       #[serde(rename_all = "camelCase")]
       pub struct DockerInfo {
           pub status: DockerStatus,
           pub containers_running: i64,
           pub images_count: i64,
           pub server_version: Option<String>,
           pub os_type: Option<String>,
       }
       ```
  </action>
  <acceptance_criteria>
    - `src-tauri/Cargo.toml` contains `bollard = "0.20"` in [dependencies]
    - `src-tauri/src/error.rs` contains `DockerNotInstalled` variant with suggestion field
    - `src-tauri/src/error.rs` contains `DockerDaemonNotRunning` variant with suggestion field
    - `src-tauri/src/error.rs` contains `DockerDesktopNotRunning` variant with suggestion field
    - `src-tauri/src/error.rs` contains `WslBackendNotReady` variant with suggestion field
    - All AppError variants have `suggestion: String` field
    - `DockerStatus` struct exists with fields: installed, running, version, apiVersion, platform, dockerDesktop, wslBackend
    - `DockerInfo` struct exists with fields: status, containersRunning, imagesCount, serverVersion, osType
    - `cargo check` passes with no errors
  </acceptance_criteria>
  <verify>cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -5</verify>
  <done>AppError has 4 Docker-specific variants with suggestions, DockerStatus and DockerInfo types defined, bollard 0.20 added to Cargo.toml, cargo check passes</done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Implement Docker detection, health check, and info commands</name>
  <files>src-tauri/src/commands/docker.rs, src-tauri/src/commands/mod.rs, src-tauri/src/lib.rs, src-tauri/capabilities/default.json</files>
  <read_first>
    - src-tauri/src/commands/mod.rs (existing module declarations)
    - src-tauri/src/commands/platform.rs (command pattern to follow)
    - src-tauri/src/lib.rs (invoke handler registration)
    - src-tauri/src/error.rs (expanded AppError from Task 1)
    - src-tauri/capabilities/default.json (current permissions)
  </read_first>
  <behavior>
    - `check_docker_health()` returns `DockerStatus` with installed/running/version info
    - On Linux: connects via socket, pings daemon, returns version
    - On Windows: connects via HTTP, checks Docker Desktop, checks WSL2 backend
    - When docker binary not found: returns DockerStatus with installed=false, running=false
    - When binary found but daemon not running: returns DockerStatus with installed=true, running=false
    - When daemon running: returns DockerStatus with installed=true, running=true, version set
    - `get_docker_info()` returns extended `DockerInfo` with container/image counts
    - `detect_docker()` is alias for check_docker_health (frontend convenience)
    - All commands use bollard for actual Docker API calls
    - Platform-specific logic uses cfg!(target_os) or runtime platform detection
  </behavior>
  <action>
    Create `src-tauri/src/commands/docker.rs` with three Tauri commands:

    1. **`check_docker_health`** → returns `DockerStatus`
       Implementation:
       - Get platform via `std::env::consts::OS`
       - **Linux path:**
         - Check if `/var/run/docker.sock` exists using `std::path::Path::new("/var/run/docker.sock").exists()`
         - If socket exists: try `Docker::connect_with_socket_defaults()` then `docker.ping().await`
         - If ping succeeds: get `docker.version().await` for version info
         - If socket missing: return `DockerStatus { installed: false, running: false, ... }`
       - **Windows path:**
         - Try `Docker::connect_with_http_defaults()` then `docker.ping().await`
         - If ping succeeds: get version, set `docker_desktop: true`
         - If ping fails: check if `docker.exe` exists in PATH using `std::process::Command::new("where").arg("docker")`
         - Check WSL2 backend: run `wsl -l -v` and parse output for `docker-desktop` distro with `Running` state
         - If WSL distro found running but daemon not accessible: set `wsl_backend: true, running: false`
       - Map errors to appropriate AppError variants with platform-specific suggestions

    2. **`get_docker_info`** → returns `DockerInfo`
       Implementation:
       - Call `check_docker_health` internally
       - If running: call `docker.info().await` for container counts, server version, OS type
       - Return populated `DockerInfo`

    3. **`detect_docker`** → returns `DockerStatus` (alias for convenience)
       Implementation:
       - Simply calls `check_docker_health` — exists so frontend has a semantic entry point

    Update `src-tauri/src/commands/mod.rs`:
    ```rust
    pub mod docker;
    pub mod platform;
    ```

    Update `src-tauri/src/lib.rs` invoke_handler to include new commands:
    ```rust
    .invoke_handler(tauri::generate_handler![
        commands::platform::get_platform_info,
        commands::docker::check_docker_health,
        commands::docker::get_docker_info,
        commands::docker::detect_docker,
    ])
    ```

    Update `src-tauri/capabilities/default.json` — add scoped shell permissions for Docker detection commands:
    ```json
    {
      "identifier": "shell:allow-execute",
      "allow": [
        { "name": "exec-which", "cmd": "which", "args": true },
        { "name": "exec-where", "cmd": "where", "args": true },
        { "name": "exec-wsl", "cmd": "wsl", "args": true }
      ]
    }
    ```
    Add this to the permissions array alongside the existing permissions.

    **Error suggestion messages (must be concrete, per ERR-01):**
    - `DockerNotInstalled`: "Download Docker Desktop from https://www.docker.com/products/docker-desktop/ and install it. On Linux, run: sudo apt install docker.io"
    - `DockerDaemonNotRunning`: "Start Docker Desktop (Windows) or run: sudo systemctl start docker (Linux)"
    - `DockerDesktopNotRunning`: "Open Docker Desktop from the Start menu and wait for it to show 'Docker Desktop is running'"
    - `WslBackendNotReady`: "Open Docker Desktop → Settings → Resources → WSL Integration and ensure your distro is enabled"
  </action>
  <acceptance_criteria>
    - `src-tauri/src/commands/docker.rs` exists with 3 exported functions
    - `check_docker_health` function exists and returns `Result<DockerStatus, AppError>`
    - `get_docker_info` function exists and returns `Result<DockerInfo, AppError>`
    - `detect_docker` function exists and returns `Result<DockerStatus, AppError>`
    - All 3 functions have `#[tauri::command]` attribute
    - Linux path uses `Docker::connect_with_socket_defaults()`
    - Windows path uses `Docker::connect_with_http_defaults()`
    - `src-tauri/src/commands/mod.rs` contains `pub mod docker;`
    - `src-tauri/src/lib.rs` invoke_handler includes all 3 docker commands
    - `src-tauri/capabilities/default.json` has shell execute permissions for which/where/wsl
    - `cargo check` passes
  </acceptance_criteria>
  <verify>cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | tail -10</verify>
  <done>3 Tauri commands implemented (check_docker_health, get_docker_info, detect_docker), platform-specific detection logic for Windows/Linux, all registered in lib.rs, shell permissions configured, cargo check passes</done>
</task>

</tasks>

<verification>
1. `cargo check` passes with all new Docker code
2. All 3 commands registered in lib.rs invoke_handler
3. AppError variants cover all Docker failure scenarios with suggestions
4. DockerStatus and DockerInfo structs have correct serde rename_all = "camelCase"
5. Capabilities allow shell commands needed for Docker detection
</verification>

<success_criteria>
- bollard 0.20 in Cargo.toml
- AppError has 4 Docker-specific variants (DockerNotInstalled, DockerDaemonNotRunning, DockerDesktopNotRunning, WslBackendNotReady)
- DockerStatus struct with installed, running, version, apiVersion, platform, dockerDesktop, wslBackend fields
- DockerInfo struct with status, containersRunning, imagesCount, serverVersion, osType fields
- 3 Tauri commands in commands/docker.rs: check_docker_health, get_docker_info, detect_docker
- Platform-specific detection: socket on Linux, HTTP/named-pipe on Windows
- WSL2 backend detection via wsl -l -v on Windows
- All commands registered in lib.rs invoke_handler
- Shell permissions configured in capabilities/default.json
- cargo check passes clean
</success_criteria>

<output>
After completion, create `.planning/phases/02-docker-integration/02-docker-integration-01-SUMMARY.md`
</output>
