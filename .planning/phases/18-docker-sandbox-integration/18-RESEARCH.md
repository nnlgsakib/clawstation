# Phase 18: Docker Sandbox Integration - Research

**Researched:** 2026-03-31
**Status:** Complete
**Method:** Codebase analysis + OpenClaw docs review

## Executive Summary

The Docker sandbox integration has three distinct gaps:
1. **UI Gap:** Wizard lacks backend selector (Docker/SSH/OpenShell)
2. **Config Gap:** `getGeneratedConfig()` omits sandbox configuration entirely
3. **Integration Gap:** Sandbox setup scripts not called during installation

## Current State Analysis

### What Works
- `sandbox-step.tsx` has mode, scope, and workspace access selectors
- `config/sandbox-section.tsx` has backend selector (but only in Settings page)
- `sandbox-setup.sh` builds `openclaw-sandbox:bookworm-slim` image

### What's Broken
1. **`getGeneratedConfig()` (use-wizard-store.ts:647-653):**
   ```typescript
   // Current - NO SANDBOX BLOCK
   config.agents = {
     defaults: {
       model: { primary: effectiveModel },
       models: modelsAllowlist,
       workspace: state.workspacePath || "~/.openclaw/workspace",
     },
   };
   ```

2. **`sandbox-step.tsx`:**
   - No `sandboxBackend` state or setter
   - No backend selection UI
   - Types only include `SandboxMode`, `SandboxScope`, `WorkspaceAccess`

3. **Installation flow:**
   - No call to `sandbox-setup.sh` during install
   - No Docker image build step
   - No sandbox readiness check

### OpenClaw Sandbox Config Schema

From `openclaw/docs/gateway/sandboxing.md`:
```json
{
  "agents": {
    "defaults": {
      "sandbox": {
        "mode": "off|non-main|all",
        "scope": "session|agent|shared",
        "workspaceAccess": "none|ro|rw",
        "backend": "docker|ssh|openshell",
        "docker": {
          "image": "openclaw-sandbox:bookworm-slim",
          "network": "none|bridge|host",
          "binds": ["/host:/container:rw"],
          "setupCommand": "scripts/sandbox-setup.sh",
          "readOnlyRoot": true,
          "user": "node",
          "browser": {
            "enabled": false,
            "image": "openclaw/browser:latest",
            "network": "sandbox"
          }
        },
        "ssh": {
          "target": "user@host",
          "workspaceRoot": "/path/to/workspace",
          "identityFile": "~/.ssh/id_ed25519"
        }
      }
    }
  }
}
```

## Implementation Patterns

### Pattern: Wizard State Extension
From `use-wizard-store.ts`:
- Add `sandboxBackend: SandboxBackend` to state
- Add `setSandboxBackend()` action
- Add Docker-specific fields: `dockerImage`, `dockerNetwork`, `dockerBinds`
- Include all in `getGeneratedConfig()`

### Pattern: Card Selection
From `model-step.tsx`:
- Use same card pattern for backend selection
- Show recommended badge when Docker detected
- Visual icons: Docker whale, SSH terminal, OpenShell

### Pattern: Docker Command Execution
From `commands/docker.rs`:
- Use `tokio::process::Command` for async execution
- Stream stdout via Tauri events
- Handle Docker not available gracefully

### Pattern: Install Progress Events
From `commands/install.rs`:
- Reuse `download-progress` event pattern
- Create `sandbox-setup-progress` event channel
- Stream log output to frontend

## Key Findings

### Finding 1: Backend Selector Exists in Settings but Not Wizard
`config/sandbox-section.tsx` already has:
```typescript
const BACKENDS = [
  { value: "docker", label: "Docker", description: "..." },
  { value: "ssh", label: "SSH", description: "..." },
  { value: "openshell", label: "OpenShell", description: "..." },
];
```
**Recommendation:** Extract to shared constant, use in both places.

### Finding 2: Sandbox Setup Script is Simple
`sandbox-setup.sh` just runs `docker build -t openclaw-sandbox:bookworm-slim -f Dockerfile.sandbox .`
**Recommendation:** Add progress parsing, error handling, image exists check.

### Finding 3: No Dockerfile.sandbox in Repo
Script references `Dockerfile.sandbox` but may not exist.
**Recommendation:** Verify exists or create minimal sandbox Dockerfile.

## Dependencies

### Phase 4: Configuration & Sandboxing (Completed)
- Basic sandbox mode toggle exists
- Config read/write commands work

### Phase 12: Gateway Integration (In Progress)
- Wizard structure exists
- Model step pattern to follow
- Config generation flow established

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Dockerfile.sandbox missing | Image build fails | Create minimal Dockerfile or use public image |
| Docker not installed | Setup fails | Graceful degradation, show instructions |
| Config schema changes | Generated config invalid | Validate against OpenClaw schema |
| SSH/OpenShell untested | Dead UI options | Mark as "Coming Soon" or hide until implemented |

## Recommendations

1. **Fix `getGeneratedConfig()` first** — Core issue, minimal change
2. **Add backend selector** — Use existing pattern from settings
3. **Integrate sandbox setup** — Add to install flow with progress
4. **Docker-specific UI** — Show when Docker backend selected
5. **Validation** — Extend Rust config validation

---

*Phase: 18-docker-sandbox-integration*
*Research completed: 2026-03-31*
