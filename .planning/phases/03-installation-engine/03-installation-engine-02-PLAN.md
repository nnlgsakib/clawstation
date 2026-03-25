---
phase: 03-installation-engine
plan: 02
type: execute
wave: 2
depends_on: ["03-installation-engine-01"]
files_modified: [
  "src-tauri/src/install/mod.rs",
  "src-tauri/src/install/docker_install.rs",
  "src-tauri/src/install/native_install.rs",
  "src-tauri/src/install/progress.rs",
  "src-tauri/src/install/verify.rs",
  "src-tauri/src/commands/install.rs",
  "src-tauri/src/error.rs",
  "src-tauri/src/mod.rs",
  "src/components/install/step-install.tsx",
  "src/hooks/use-install.ts",
  "src/stores/use-onboarding-store.ts"
]
autonomous: true
requirements: [INST-01, INST-02, INST-04, INST-05]
must_haves:
  truths:
    - "User can select between Docker and Native installation methods"
    - "Docker installation progress is shown with step, percentage, and message"
    - "Native installation progress is shown with step, percentage, and message"
    - "Installation errors are displayed with specific, actionable suggestions"
    - "Upon successful installation, the app automatically proceeds to verification step"
  artifacts:
    - path: "src-tauri/src/commands/install.rs"
      provides: "Install orchestration Tauri command"
      exports: ["install_openclaw"]
    - path: "src-tauri/src/install/docker_install.rs"
      provides: "Docker Compose-based installation flow"
      exports: ["docker_install"]
    - path: "src-tauri/src/install/native_install.rs"
      provides: "npm-based native installation flow"
      exports: ["native_install"]
    - path: "src-tauri/src/install/progress.rs"
      provides: "Install progress event types and emitter"
      exports: ["InstallProgress", "emit_progress"]
    - path: "src-tauri/src/install/verify.rs"
      provides: "Post-install health verification functions"
      exports: ["verify_gateway_health", "verify_native_install"]
    - path: "src/components/install/step-install.tsx"
      provides: "Install progress UI component"
      min_lines: 40
    - path: "src/hooks/use-install.ts"
      provides: "Install state and progress hook"
      exports: ["useInstallOpenClaw"]
  key_links:
    - from: "src/components/install/step-install.tsx"
      to: "src/hooks/use-install.ts"
      via: "useInstallOpenClaw().progress"
      pattern: "useInstallOpenClaw"
    - from: "src/hooks/use-install.ts"
      to: "src-tauri/src/commands/install.rs"
      via: "invoke('install_openclaw')"
      pattern: "invoke.*install_openclaw"
    - from: "src-tauri/src/commands/install.rs"
      to: "src-tauri/src/install/docker_install.rs"
      via: "docker_install(&app_handle)"
      pattern: "docker_install"
    - from: "src-tauri/src/commands/install.rs"
      to: "src-tauri/src/install/native_install.rs"
      via: "native_install(&app_handle)"
      pattern: "native_install"
    - from: "src-tauri/src/install/verify.rs"
      to: "src-tauri/src/install/docker_install.rs"
      via: "verify_gateway_health"
      pattern: "verify_gateway_health"
    - from: "src-tauri/src/install/verify.rs"
      to: "src-tauri/src/install/native_install.rs"
      via: "verify_native_install"
      pattern: "verify_native_install"
---

<objective>
Create the installation orchestration system that handles both Docker-based and native OpenClaw installation methods with progress tracking and error handling.
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/STATE.md
@.planning/ROADMAP.md
@.planning/REQUIREMENTS.md
@.planning/phases/03-installation-engine/RESEARCH.md
@.planning/phases/03-installation-engine/03-installation-engine-01-SUMMARY.md
@.planning/phases/02-docker-integration/02-docker-integration-01-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend - create install progress types, emitter, and verification functions</name>
  <files>src-tauri/src/install/progress.rs, src-tauri/src/install/verify.rs, src-tauri/src/error.rs</files>
  <action>
    Create the install progress types in src-tauri/src/install/progress.rs:
      - Define InstallProgress struct with step (String), percent (u8), message (String)
      - Create emit_progress function that takes AppHandle, step, percent, message and emits "install-progress" event
      - Make sure to use the tauri::event::emit pattern as shown in the research
    Create the verification functions in src-tauri/src/install/verify.rs:
      - Implement verify_gateway_health function that polls /healthz and /readyz endpoints with exponential backoff
      - Implement verify_native_install function that runs `openclaw doctor --yes`
      - Both functions should return Result<(), AppError>
    Extend the error types in src-tauri/src/error.rs:
      - Add InstallationFailed variant with reason and suggestion
      - Add VerificationFailed variant with reason and suggestion
      - Add NodeVersionTooOld variant
      - Add InsufficientDiskSpace variant
      - Add PortInUse variant
    Add necessary dependencies to Cargo.toml if needed (reqwest, serde_json, thiserror, anyhow, process-wrap)
  </action>
  <verify>
    <automated>
      cargo test --manifest-path src-tauri/Cargo.toml --lib --::install::progress::tests::emit_progress_works
    </automated>
  </verify>
  <done>
    Install progress types and emitter exist and can emit events. Verification functions exist and return proper Result types. Error types are extended with installation-specific variants.
  </done>
</task>

<task type="auto">
  <name>Task 2: Backend - create Docker and native installation flows</name>
  <files>src-tauri/src/install/docker_install.rs, src-tauri/src/install/native_install.rs, src-tauri/src/mod.rs</files>
  <action>
    Create the Docker installation flow in src-tauri/src/install/docker_install.rs:
      - Implement docker_install function that takes AppHandle and returns Result<InstallResult, AppError>
      - Follow the pattern from research: check Docker health, create directories, pull image via bollard, write compose file, write .env, start gateway, verify health
      - Use the shared Docker check function from plan 01 for initial Docker verification
      - Use tokio::fs for directory/file operations
      - Use bollard for image pulling
      - Use tokio::process::Command for docker compose up
      - Use verify_gateway_health for verification
    Create the native installation flow in src-tauri/src/install/native_install.rs:
      - Implement native_install function that takes AppHandle and returns Result<InstallResult, AppError>
      - Follow the pattern from research: check Node.js version, install via npm global, run onboard --install-daemon, verify
      - Use tokio::process::Command for npm and openclaw commands
      - Handle permission errors (suggestion to use sudo if needed)
      - Use verify_native_install for verification
    Update src-tauri/src/mod.rs to export the new install module.
    Define the InstallResult struct in a shared location (we'll put it in src-tauri/src/install/mod.rs for now)
  </action>
  <verify>
    <automated>
      cargo test --manifest-path src-tauri/Cargo.toml --lib --::install::docker_install::tests::docker_install_flow_structure
    </automated>
  </verify>
  <done>
    Both docker_install and native_install functions exist and follow the research patterns. They use appropriate dependencies and return InstallResult on success.
  </done>
</task>

<task type="auto">
  <name>Task 3: Backend - create install orchestration command and integrate with error handling</name>
  <files>src-tauri/src/commands/install.rs, src-tauri/src/mod.rs, src-tauri/src/install/mod.rs</files>
  <action>
    Create the install orchestration command in src-tauri/src/commands/install.rs:
      - Define InstallMethod enum (Docker, Native)
      - Define InstallRequest struct with method and optional workspace_path
      - Define InstallResult struct (method, version, gateway_url, gateway_token)
      - Create Tauri command `install_openclaw` that:
          * Takes InstallRequest and AppHandle
          * Matches on method to call either docker_install or native_install
          * Returns InstallResult or AppError
      - Use the progress emitter throughout to send updates
    Update src-tauri/src/install/mod.rs to export the InstallResult type and re-export the install functions.
    Update src-tauri/src/mod.rs to export the new commands module.
    Ensure the command properly handles errors and returns meaningful error messages.
  </action>
  <verify>
    <automated>
      cargo test --manifest-path src-tauri/Cargo.toml --lib --::commands::install::tests::install_openclaw_command_exists
    </automated>
  </verify>
  <done>
    The install_openclaw Tauri command exists, properly routes to Docker or native install based on method, emits progress events, and returns InstallResult or appropriate AppError.
  </done>
</task>

<task type="auto">
  <name=Task 4: Frontend - create install progress UI component and install hook
  <files>src/components/install/step-install.tsx, src/hooks/use-install.ts, src/stores/use-onboarding-store.ts</files>
  <action>
    Create the install progress hook in src/hooks/use-install.ts:
      - Use the @tauri-apps/api/event listen function to listen for "install-progress" events
      - Use useState to store the latest InstallProgress
      - Return the progress state and the install_openclaw mutation function from TanStack Query
      - The mutation function should invoke the 'install_openclaw' command with the selected method
    Create the install progress UI component in src/components/install/step-install.tsx:
      - Use the useInstallOpenClaw hook to get progress and mutation function
      - Display:
          * A progress bar based on percent
          * The current step and message
          * A "Cancel" button (optional, for future enhancement)
          * If installation is complete and successful, automatically trigger transition to verify step (we'll handle this in the store)
          * If installation fails, display the error with suggestions
    Update the onboarding store in src/stores/use-onboarding-store.ts:
      - Add installProgress: InstallProgress | null to state
      - Add actions to set install progress and handle installation completion/failure
      - When installation completes successfully, automatically set step to 'verify'
      - When installation fails, set step to 'error' and store the error message
    The component should conditionally render based on install state (idle, installing, success, error).
  </action>
  <verify>
    <automated>
      cd src && pnpm vitest run --reporter=verbose components/install/step-install.tsx.test.tsx -- --passWithNoTests
    </automated>
  </verify>
  <done>
    The install progress UI component displays installation progress, handles user interaction, and correctly transitions to verify step on success or error step on failure. The use-install hook properly listens for progress events and exposes the install mutation.
  </done>
</task>

</tasks>

<verification>
Overall phase checks:
- Ensure the installation orchestration properly routes to Docker or native install based on user selection
- Verify that progress events are emitted during installation and displayed in the UI
- Confirm that error handling provides actionable suggestions for common failure modes
- Check that successful installation automatically transitions to verification step
</verification>

<success_criteria>
- The `install_openclaw` Tauri command exists and accepts InstallRequest with method and optional workspace_path
- Docker installation follows the research pattern: health check → directory creation → image pull → compose file → .env file → start gateway → health verification
- Native installation follows the research pattern: Node.js check → npm install → onboard --install-daemon → verification
- Progress events are emitted during installation with step, percentage, and message
- The install progress UI component displays progress information and handles success/error states appropriately
- Upon successful installation, the onboarding state automatically transitions to 'verify' step
- Installation errors display specific, actionable suggestions (e.g., "Start Docker Desktop" for Docker daemon not running, "Install Node.js 22+" for version mismatch)
</success_criteria>

<output>
After completion, create `.planning/phases/03-installation-engine/03-installation-engine-02-SUMMARY.md`
</output>