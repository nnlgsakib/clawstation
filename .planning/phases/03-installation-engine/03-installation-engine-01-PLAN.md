---
phase: 03-installation-engine
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [
  "src-tauri/src/docker/check.rs",
  "src-tauri/src/commands/system_check.rs",
  "src-tauri/src/mod.rs",
  "src/components/system-check.tsx",
  "src/stores/use-onboarding-store.ts",
  "src/App.tsx"
]
autonomous: true
requirements: [INST-01, INST-02, INST-05, PLAT-03, ERR-02]
must_haves:
  truths:
    - "User can see system check results with clear pass/fail indicators"
    - "User can retry system check if any check fails"
    - "User can proceed to install step only when all system checks pass"
    - "System check detects platform (Windows/Linux) and adjusts Node.js check accordingly"
    - "System check error messages include actionable suggestions for failed checks"
  artifacts:
    - path: "src-tauri/src/commands/system_check.rs"
      provides: "System check Tauri command"
      exports: ["run_system_check"]
    - path: "src-tauri/src/docker/check.rs"
      provides: "Shared Docker health check function"
      exports: ["check_docker_health"]
    - path: "src/components/system-check.tsx"
      provides: "System check UI component"
      min_lines: 50
    - path: "src/stores/use-onboarding-store.ts"
      provides: "Onboarding state management"
      exports: ["useOnboardingStore"]
  key_links:
    - from: "src/components/system-check.tsx"
      to: "src-tauri/src/commands/system_check.rs"
      via: "invoke('run_system_check')"
      pattern: "invoke.*run_system_check"
    - from: "src/stores/use-onboarding-store.ts"
      to: "src/App.tsx"
      via: "useOnboardingStore().step"
      pattern: "useOnboardingStore"
---

<objective>
Create the system check step of the onboarding wizard that validates platform, Docker, Node.js, disk space, RAM, and port availability before installation.
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
@.planning/phases/02-docker-integration/02-docker-integration-01-SUMMARY.md
@.planning/phases/02-docker-integration/02-docker-integration-02-SUMMARY.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Backend - create system check command and shared Docker check</name>
  <files>src-tauri/src/docker/check.rs, src-tauri/src/commands/system_check.rs, src-tauri/src/mod.rs</files>
  <action>
    Create a shared Docker health check function in src-tauri/src/docker/check.rs that returns a DockerStatus struct with at least `installed` and `running` fields. The function should:
      - Use std::env::consts::OS to determine platform
      - On Linux: attempt to connect to the Docker socket via bollard (using the same logic as in phase 2's check_docker_health_internal)
      - On Windows: attempt to connect via bollard's HTTP default (or try socket then HTTP, copying phase 2's logic)
      - Return a struct that includes the version if available (but we only need installed and running for the system check)
    Create the system check command in src-tauri/src/commands/system_check.rs:
      - Define a Tauri command `run_system_check` that returns a SystemCheckResult struct (to be defined in the same file or in a shared types file? We'll define it in the same file for simplicity)
      - The SystemCheckResult struct should have: platform (String), docker_available (bool), docker_running (bool), node_available (bool), node_version (Option<String>), disk_free_gb (u64), ram_available_gb (u64), port_18789_free (bool)
      - Implement the command by:
          * Getting platform via std::env::consts::OS
          * Calling the shared Docker check function to get docker_available and docker_running
          * Checking Node.js availability by attempting to get the version (we'll create a helper function or use tokio::process::Command to run `node --version`)
          * Getting disk free space via sysinfo crate (add dependency if needed)
          * Getting available RAM via sysinfo
          * Checking if port 18789 is free by attempting to bind a TCP socket to it (we'll use tokio::net::TcpListener or a simple TCP connect attempt)
      - We'll add the sysinfo and tokio dependencies to Cargo.toml if not already present (they are likely present from phase 2? We'll check and add if needed)
    Update src-tauri/src/mod.rs to export the new docker module and the system_check command.
  </action>
  <verify>
    <automated>
      cargo test --manifest-path src-tauri/Cargo.toml --lib --::system_check::tests::run_system_check_returns_correct_struct
    </automated>
  </verify>
  <done>
    The `run_system_check` command exists and returns a SystemCheckResult with all required fields. The shared Docker check function is used and works on both Linux and Windows.
  </done>
</task>

<task type="auto">
  <name>Task 2: Frontend - create system check UI component and integrate into onboarding state machine</name>
  <files>src/components/system-check.tsx, src/stores/use-onboarding-store.ts, src/App.tsx</files>
  <action>
    Create a Zustand store for onboarding state in src/stores/use-onboarding-store.ts:
      - Define the state: { step: 'system_check' | 'install' | 'verify' | 'ready' | 'error', systemCheckResult: SystemCheckResult | null, isLoading: boolean, error: string | null }
      - Define actions: setStep, setSystemCheckResult, setLoading, setError, reset
      - Initialize the step to 'system_check'
    Create the system check UI component in src/components/system-check.tsx:
      - Use the `invoke` function from '@tauri-apps/api/core' to call the `run_system_check` command.
      - The component should:
          * Display a loading spinner while checking
          * When the result is available, display each check result with a checkmark (if passed) or error icon (if failed)
          * For each failed check, show the error message and a suggestion (if available from the command result? We'll extend the SystemCheckResult to include suggestions? Or we'll have the command return a result that includes suggestions? We'll adjust the command to return a result that includes a suggestion for each failed check? Alternatively, we can have the command return a generic error and we'll map known failures to suggestions. We'll do the latter for simplicity: in the component, we'll check each field and show a predefined suggestion.
          * Have a "Retry Check" button that calls the command again
          * Have a "Proceed to Install" button that is enabled only when all checks pass (docker_available, docker_running, node_available, disk_free_gb >= 2, ram_available_gb >= 2, port_18789_free) and sets the onboarding step to 'install'
    Integrate the system check step into the main App:
      - In src/App.tsx, use the onboarding store to determine which step to render.
      - When the step is 'system_check', render the system check component.
      - When the step is 'install', render a placeholder (to be replaced in plan 02).
      - When the step is 'verify', render a placeholder (to be replaced in plan 03).
      - When the step is 'ready', render a success screen (to be replaced in plan 03).
      - When the step is 'error', render an error screen (to be replaced in plan 03).
  </action>
  <verify>
    <automated>
      cd src && pnpm vitest run --reporter=verbose components/system-check.tsx.test.tsx -- --passWithNoTests
    </automated>
  </verify>
  <done>
    The system check UI component renders correctly, displays loading state, shows check results with appropriate icons and messages, and allows the user to retry or proceed when all checks pass. The onboarding state machine transitions from 'system_check' to 'install' when the user proceeds after a successful system check.
  </done>
</task>

</tasks>

<verification>
Overall phase checks:
- Ensure the system check command is callable from the frontend and returns expected data structure
- Verify that the onboarding state machine correctly transitions from system_check to install upon successful check
- Confirm that error messages are displayed with actionable suggestions for each type of failure
</verification>

<success_criteria>
- The `run_system_check` Tauri command returns a SystemCheckResult with all required fields (platform, docker_available, docker_running, node_available, node_version, disk_free_gb, ram_available_gb, port_18789_free)
- The shared Docker check function correctly reports Docker status on both Linux and Windows
- The system check UI component displays each check result with visual indicators (pass/fail) and shows retry/proceed buttons appropriately
- When all checks pass, clicking "Proceed to Install" transitions the onboarding state to 'install'
- When any check fails, the UI shows an error message with a specific suggestion (e.g., "Install Docker Desktop" for missing Docker, "Free up disk space" for low disk space)
</success_criteria>

<output>
After completion, create `.planning/phases/03-installation-engine/03-installation-engine-01-SUMMARY.md`
</output>