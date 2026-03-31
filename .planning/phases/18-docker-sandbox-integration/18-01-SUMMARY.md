---
phase: 18-docker-sandbox-integration
plan: 01
name: Fix Config Generation & Sandbox Validation
subsystem: config
tags: [sandbox, config-generation, validation, typescript, rust]
dependency_graph:
  requires: []
  provides: [sandbox-config-generation, sandbox-validation]
  affects: [wizard-config-output, config-validation]
tech_stack:
  added: [SandboxBackend type, DockerNetwork type]
  patterns: [zustand-store-state, serde-validation]
key_files:
  modified:
    - path: src/stores/use-wizard-store.ts
      lines_added: 44
      description: Added sandbox types, state fields, setters, config generation
    - path: src-tauri/src/commands/config.rs
      lines_added: 86
      description: Extended sandbox validation with backend/scope/access/network checks
decisions: []
metrics:
  duration: ~8min
  tasks_completed: 2/2
  files_modified: 2
  completed_date: "2026-03-31"
---

# Phase 18 Plan 01: Fix Config Generation & Sandbox Validation — Summary

**One-liner:** Added complete sandbox config block generation to wizard store with Rust backend validation for all sandbox fields.

## What Was Done

### Task 1: Fix getGeneratedConfig() sandbox block
- Added `SandboxBackend` (`"docker" | "ssh" | "openshell"`) and `DockerNetwork` (`"none" | "bridge" | "host"`) types
- Added 4 new state fields to `WizardState`: `sandboxBackend`, `dockerImage`, `dockerNetwork`, `dockerBinds`
- Added 5 setter implementations: `setSandboxBackend`, `setDockerImage`, `setDockerNetwork`, `addDockerBind`, `removeDockerBind`
- Default values: backend=`"docker"`, image=`"openclaw-sandbox:bookworm-slim"`, network=`"none"`, binds=`[]`
- `getGeneratedConfig()` now generates `agents.defaults.sandbox` block with:
  - `mode`, `scope`, `workspaceAccess`, `backend` from state
  - Docker backend: `docker.image`, `docker.network`, `docker.binds`, `readOnlyRoot: true`, `user: "node"`
  - SSH backend: `ssh.target` (empty — user fills via UI), `ssh.workspaceRoot`
- **Commit:** `7e14484` — `feat(18-01): add sandbox config block to getGeneratedConfig()`

### Task 2: Extend sandbox config validation in Rust
- Extended `validate_config` to validate 5 additional sandbox fields:
  - `backend`: must be `"docker"`, `"ssh"`, or `"openshell"`
  - `scope`: must be `"session"`, `"agent"`, or `"shared"`
  - `workspaceAccess`: must be `"none"`, `"ro"`, or `"rw"`
  - `docker.network`: must be `"none"`, `"bridge"`, or `"host"` (when present)
  - SSH backend: requires `ssh.target` (non-empty) and `ssh` config object
- All validation errors use `ValidationError` struct with field path and valid options
- **Commit:** `486e691` — `feat(18-01): extend sandbox config validation in Rust`

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

| Check | Result |
|-------|--------|
| TypeScript compiles (`npx tsc --noEmit`) | ✅ Passed |
| Rust compiles (`cargo check`) | ✅ Passed |
| Generated config has sandbox block | ✅ `agents.defaults.sandbox` with all fields |
| Validation rejects invalid values | ✅ Backend/scope/access/network validated |

## Known Stubs

None introduced by this plan.

## Self-Check: PASSED

- `src/stores/use-wizard-store.ts` — EXISTS (44 lines added)
- `src-tauri/src/commands/config.rs` — EXISTS (86 lines added)
- Commit `7e14484` — FOUND in git log
- Commit `486e691` — FOUND in git log
