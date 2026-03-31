---
phase: 18-docker-sandbox-integration
plan: 02
subsystem: frontend
tags: [wizard, sandbox, docker, backend-selector]
dependency_graph:
  requires:
    - 18-01: sandbox config generation & validation (store fields: sandboxBackend, dockerNetwork, dockerBinds)
  provides:
    - Backend selector UI in sandbox wizard step
    - Docker-specific settings (network mode, bind mounts)
  affects:
    - src/components/wizard/sandbox-step.tsx
tech_stack:
  added: []
  patterns:
    - Visual card selection pattern (from model-step.tsx)
    - Conditional rendering with motion animations
    - Wizard store state binding
key_files:
  modified:
    - src/components/wizard/sandbox-step.tsx
decisions:
  - Docker pre-selected as default backend with "Recommended" badge
  - Bind mount input validated for colon-separated format (/host:/container)
  - SSH/OpenShell show info banners pointing to Settings page for configuration
  - Old static network info block replaced by dynamic Docker network mode selector
metrics:
  duration: ~5min
  completed: "2026-03-31"
  tasks_completed: 1/1
  files_modified: 1
---

# Phase 18 Plan 02: Backend Selector UI & Docker Settings — Summary

**One-liner:** Backend selection cards (Docker/SSH/OpenShell) with Docker-specific network mode and bind mount configuration added to sandbox wizard step.

## What Was Built

### Task 1: Backend selector with Docker/SSH/OpenShell cards

**Commit:** `e36c404` — `feat(18-02): add backend selector cards & Docker-specific settings to sandbox wizard`

**Changes to `src/components/wizard/sandbox-step.tsx`:**

1. **New imports:** `React`, `Container`, `Terminal`, `Box`, `Plus`, `X` from lucide-react
2. **New constants:**
   - `SANDBOX_BACKENDS` — Docker (recommended), SSH, OpenShell with icons and descriptions
   - `DOCKER_NETWORKS` — none/bridge/host with security descriptions
3. **Store bindings:** Added `sandboxBackend`, `setSandboxBackend`, `dockerNetwork`, `setDockerNetwork`, `dockerBinds`, `addDockerBind`, `removeDockerBind` from `useWizardStore()`
4. **Local state:** `newBind` for bind mount input
5. **UI sections:**
   - Backend selector (3-column card grid) inserted after Workspace Directory, before Sandbox Mode
   - Docker card shows "Recommended" badge (absolute positioned)
   - Conditional Docker settings: network mode selector (3-column cards) + bind mount management (list + add input)
   - Conditional SSH info banner
   - Conditional OpenShell info banner
6. **Removed:** Old static "Network: Disabled by Default" info block (replaced by dynamic Docker settings)

## Verification

- ✅ TypeScript compiles cleanly (`npx tsc --noEmit` — zero errors)
- ✅ Backend cards render before mode/scope selectors in layout order
- ✅ All backend state wired through useWizardStore (no local-only persistent state)
- ✅ Docker settings only visible when `sandboxBackend === "docker"`
- ✅ Bind mount input validates colon format before adding

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all UI sections are fully wired to store state.

## Self-Check: PASSED

- ✅ `src/components/wizard/sandbox-step.tsx` exists (422 lines)
- ✅ Commit `e36c404` exists in git log
