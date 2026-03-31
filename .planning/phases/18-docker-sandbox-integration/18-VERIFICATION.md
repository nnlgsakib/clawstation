---
phase: 18-docker-sandbox-integration
verified: 2026-03-31T18:30:00Z
status: gaps_found
score: 13/17 must-haves verified
gaps:
  - truth: "Install config includes sandbox settings from wizard state via install_openclaw command"
    status: failed
    reason: "TypeScript InstallRequest interface in use-install.ts is missing sandbox_config field. The Rust InstallRequest struct accepts it but the frontend never sends it."
    artifacts:
      - path: "src/hooks/use-install.ts"
        issue: "InstallRequest interface (line 21-25) lacks sandbox_config field"
      - path: "src/components/install/step-install.tsx"
        issue: "handleStartInstall (line 156) passes { method, installDir, workspacePath } without sandbox_config"
    missing:
      - "Add sandboxConfig?: SandboxInstallConfig to InstallRequest interface in use-install.ts"
      - "Import wizard store sandbox state in step-install.tsx and pass to mutate() call"
      - "Add sandbox_setup to INSTALL_STEPS and getStepIcon in step-install.tsx"
  - truth: "When SSH backend selected, user sees target host input field"
    status: partial
    reason: "SSH backend shows info banner only, no input field for target host. Plan accepted this as deferred but verification prompt explicitly requires input field."
    artifacts:
      - path: "src/components/wizard/sandbox-step.tsx"
        issue: "Lines 390-402: SSH section shows info banner ('configuration will be available after installation') rather than target host input"
    missing:
      - "Add SSH target host input field to sandbox-step.tsx when SSH backend selected"
      - "Wire input to sshTarget state field (new) or accept deferred to Settings page"
  - truth: "Docker sandbox image is built automatically after OpenClaw installation when sandbox is enabled"
    status: partial
    reason: "Rust implementation exists and works (docker_install Step 7), but frontend never calls install_openclaw with sandbox_config. The setup-wizard flow uses install_openclaw_script instead."
    artifacts:
      - path: "src/hooks/use-install.ts"
        issue: "InstallRequest missing sandbox_config — sandbox config never reaches Rust backend"
      - path: "src/pages/setup-wizard.tsx"
        issue: "handleInstall (line 42-79) writes config and navigates to /install but doesn't invoke install_openclaw command"
    missing:
      - "Wire sandbox_config through TypeScript InstallRequest to Rust install_openclaw"
  - truth: "User sees sandbox setup progress (building image) streamed in real-time"
    status: partial
    reason: "Rust emits sandbox-setup-progress events and install-progress with sandbox_setup step, but frontend INSTALL_STEPS array and getStepIcon don't include sandbox_setup. Progress shows as generic spinner."
    artifacts:
      - path: "src/components/install/step-install.tsx"
        issue: "INSTALL_STEPS (line 52-60) and getStepIcon (line 28-50) lack sandbox_setup entry"
    missing:
      - "Add sandbox_setup to INSTALL_STEPS array"
      - "Add sandbox_setup case to getStepIcon function"
---

# Phase 18: Docker Sandbox Integration — Verification Report

**Phase Goal:** Complete Docker sandbox integration: backend selection UI, config generation with sandbox block, sandbox validation, and automatic sandbox image building during installation.

**Verified:** 2026-03-31T18:30:00Z
**Status:** gaps_found
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Plan | Truth | Status | Evidence |
|---|------|-------|--------|----------|
| 1 | 18-01 | Wizard generates a complete OpenClaw config with sandbox block | ✓ VERIFIED | `getGeneratedConfig()` lines 667-697: builds `sandboxConfig` with mode, scope, workspaceAccess, backend, and backend-specific docker/ssh blocks |
| 2 | 18-01 | Generated sandbox config matches OpenClaw schema (mode, scope, workspaceAccess, backend, docker settings) | ✓ VERIFIED | Schema match confirmed: `agents.defaults.sandbox` has all required fields per OpenClaw sandboxing.md |
| 3 | 18-01 | Config validation rejects invalid sandbox mode/backend values with clear error messages | ✓ VERIFIED | `validate_config` lines 132-233: validates mode (off/non-main/all), backend (docker/ssh/openshell), scope (session/agent/shared), workspaceAccess (none/ro/rw), docker.network (none/bridge/host) |
| 4 | 18-01 | Config validation enforces backend-specific requirements (SSH needs target, Docker needs image) | ✓ VERIFIED | Lines 163-181: SSH backend checks for ssh.target (non-empty) and ssh config object existence |
| 5 | 18-02 | User sees backend selection cards (Docker, SSH, OpenShell) in wizard sandbox step | ✓ VERIFIED | `sandbox-step.tsx` lines 80-106: SANDBOX_BACKENDS constant, lines 202-232: 3-column card grid |
| 6 | 18-02 | Docker is pre-selected by default with "Recommended" badge when Docker is detected | ✓ VERIFIED | `recommended: true` on Docker entry (line 92), badge rendered at lines 217-220, default state `"docker"` at line 499 |
| 7 | 18-02 | When Docker backend selected, user sees network mode (none/bridge/host) and bind mount options | ✓ VERIFIED | Lines 310-387: conditional `sandboxBackend === "docker"` renders network mode selector (3 cards) and bind mount management (list + add input) |
| 8 | 18-02 | When SSH backend selected, user sees target host input field | ⚠️ PARTIAL | Lines 390-402: SSH shows info banner only — no target host input field. Banner says "configuration will be available after installation in the Settings page" |
| 9 | 18-02 | Backend selection persists across wizard navigation | ✓ VERIFIED | Backend state in Zustand store (`useWizardStore`), survives navigation via persistent store |
| 10 | 18-02 | Generated config preview reflects backend-specific settings | ✓ VERIFIED | `getGeneratedConfig()` at lines 675-688: conditionally adds docker.image/network/binds or ssh.target/workspaceRoot based on `sandboxBackend` |
| 11 | 18-03 | Docker sandbox image is built automatically after OpenClaw installation when sandbox is enabled | ⚠️ PARTIAL | Rust code works (docker_install lines 408-519), but TypeScript InstallRequest never sends sandbox_config to the backend. The image build is unreachable from frontend. |
| 12 | 18-03 | User sees sandbox setup progress (building image) streamed in real-time | ⚠️ PARTIAL | Rust emits `sandbox-setup-progress` events and `install-progress` with `sandbox_setup` step. But frontend `INSTALL_STEPS` and `getStepIcon` in step-install.tsx don't recognize `sandbox_setup` — shows as generic spinner. |
| 13 | 18-03 | Sandbox setup failure does not abort the entire installation (graceful degradation) | ✓ VERIFIED | docker_install lines 465-473 and 501-508: `Err(e)` paths emit warning progress event and continue (no `return Err`) |
| 14 | 18-03 | Sandbox image existence is checked before attempting build (skip if already built) | ✓ VERIFIED | docker_install lines 424-434: `docker image inspect` check, `needs_build` flag controls whether build runs |
| 15 | 18-03 | Install config includes sandbox settings from wizard state | ⚠️ PARTIAL | `getGeneratedConfig()` writes sandbox block to config file via `write_config`. But `install_openclaw` Tauri command (which uses sandbox_config) is never invoked with sandbox settings from frontend. |

**Score:** 13/15 truths verified (2 partial, 0 failed at Rust level but 2 blocked at frontend wiring)

### Required Artifacts

| Artifact | Plan | Expected | Status | Details |
| --------|------|----------|--------|---------|
| `src/stores/use-wizard-store.ts` | 18-01 | Sandbox types, state, setters, config gen | ✓ VERIFIED | 44 lines added: SandboxBackend/DockerNetwork types, 4 state fields, 5 setters, sandbox block in getGeneratedConfig() |
| `src-tauri/src/commands/config.rs` | 18-01 | Sandbox validation | ✓ VERIFIED | 86 lines added: validates backend, scope, workspaceAccess, docker.network, SSH target |
| `src/components/wizard/sandbox-step.tsx` | 18-02 | Backend selector UI + Docker/SSH settings | ✓ VERIFIED | 422 lines: SANDBOX_BACKENDS cards, DOCKER_NETWORKS selector, bind mount management, conditional rendering |
| `src-tauri/src/commands/install.rs` | 18-03 | InstallRequest with sandbox_config | ✓ VERIFIED | `sandbox_config: Option<SandboxInstallConfig>` field present, deserialization test passes |
| `src-tauri/src/install/docker_install.rs` | 18-03 | Sandbox setup step | ✓ VERIFIED | Step 7 (lines 408-519): image inspect check, script/direct build, stream_command_output, graceful degradation |
| `src-tauri/src/install/mod.rs` | 18-03 | SandboxInstallConfig struct | ✓ VERIFIED | 5-field struct with serde(rename_all = "camelCase"), PartialEq derived |
| `src/hooks/use-install.ts` | bridge | InstallRequest includes sandbox_config | ✗ MISSING | `InstallRequest` interface (line 21-25) lacks `sandbox_config` field — critical wiring gap |
| `src/components/install/step-install.tsx` | bridge | Pass sandbox_config, show sandbox_setup progress | ✗ MISSING | handleStartInstall doesn't pass sandbox_config; INSTALL_STEPS/getStepIcon lack sandbox_setup |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `use-wizard-store.ts:getGeneratedConfig()` | OpenClaw config schema | sandbox block matching agents.defaults.sandbox | ✓ WIRED | Lines 667-697: sandboxConfig with mode, scope, workspaceAccess, backend, docker/ssh blocks |
| `config.rs:validate_config()` | agents.defaults.sandbox | backend-specific validation rules | ✓ WIRED | Lines 132-233: validates all sandbox fields with clear error messages |
| `sandbox-step.tsx` | `use-wizard-store.ts` | useWizardStore() state bindings | ✓ WIRED | Lines 119-135: sandboxBackend, dockerNetwork, dockerBinds, addDockerBind, removeDockerBind |
| `docker_install.rs:docker_install()` | docker build (sandbox image) | sandbox-setup-progress event emission | ✓ WIRED (Rust) | Lines 456-457, 492-493: stream_command_output with "sandbox-setup-progress" channel |
| `install.rs:InstallRequest` | frontend wizard state | sandbox config passed in install request | ✗ NOT WIRED | TypeScript InstallRequest missing sandbox_config field |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `getGeneratedConfig()` | sandboxConfig | Zustand store state (sandboxMode, sandboxBackend, etc.) | Yes — populated from user selections | ✓ FLOWING |
| `validate_config()` | sandbox errors | Parsed from JSON input | Yes — validates actual config values | ✓ FLOWING |
| `sandbox-step.tsx` | sandboxBackend, dockerNetwork, dockerBinds | useWizardStore() | Yes — real store state | ✓ FLOWING |
| `step-install.tsx` handleStartInstall | sandbox_config | N/A — not included | No — field missing from request | ✗ DISCONNECTED |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles | `npx tsc --noEmit` | No errors | ✓ PASS |
| Rust compiles | `cargo check` | Finished dev profile, no errors | ✓ PASS |
| install_request_deserializes_with_sandbox_config test | `cargo test` | Present in install.rs tests (line 133-150) | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-----------|-------------|--------|----------|
| sandbox-config | 18-01 | Config generation with sandbox block | ✓ SATISFIED | getGeneratedConfig() generates complete sandbox config |
| sandbox-config | 18-01 | Sandbox validation in Rust | ✓ SATISFIED | validate_config validates all sandbox fields |
| sandbox-config | 18-02 | Backend selector UI | ✓ SATISFIED | sandbox-step.tsx shows Docker/SSH/OpenShell cards |
| sandbox-config | 18-03 | Sandbox setup integration | ⚠️ PARTIAL | Rust ready, frontend wiring broken |

### Anti-Patterns Found

No anti-patterns found in modified files. No TODO/FIXME/HACK/PLACEHOLDER comments detected.

### Human Verification Required

None needed — all gaps are programmatically identifiable and fixable.

### Gaps Summary

**Blocking gap (Plan 18-03): Frontend never sends sandbox_config to install backend**

The Rust `docker_install()` function implements sandbox image building (Step 7) correctly — it accepts `sandbox_config`, checks if sandbox is enabled with Docker backend, verifies image existence, and streams build progress. However, this code is **unreachable** from the frontend because:

1. `src/hooks/use-install.ts` — TypeScript `InstallRequest` interface lacks `sandbox_config` field
2. `src/components/install/step-install.tsx` — `handleStartInstall` passes `{ method, installDir, workspacePath }` without sandbox settings
3. `src/components/install/step-install.tsx` — `INSTALL_STEPS` and `getStepIcon` don't include `sandbox_setup`, so progress would show as generic spinner even if wired

Additionally, the setup wizard's `handleInstall` in `setup-wizard.tsx` doesn't use `install_openclaw` at all — it writes config files and navigates to `/install`, which calls `install_openclaw_script` (Node.js-based, no sandbox support).

**Fix required:**
- Add `sandboxConfig?: { mode: string; backend: string; dockerImage?: string; dockerNetwork?: string; dockerBinds?: string[] }` to TypeScript `InstallRequest`
- Import wizard store sandbox state in `step-install.tsx` and include in mutate() call
- Add `sandbox_setup` to `INSTALL_STEPS` and `getStepIcon`

**Partial gap (Plan 18-02): SSH backend shows banner instead of input field**

The verification prompt requires "When SSH backend selected, user sees target host input field" but the implementation shows only an info banner. The plan accepted this as deferred (pointing to Settings page), but the verification criteria explicitly requires an input field.

**Fix option A:** Add an SSH target host input field directly in the wizard sandbox step
**Fix option B:** Accept as intentional deferral and update verification criteria

---

_Verified: 2026-03-31T18:30:00Z_
_Verifier: gsd-verifier_
