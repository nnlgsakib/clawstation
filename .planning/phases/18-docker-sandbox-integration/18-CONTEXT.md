# Phase 18: Docker Sandbox Integration - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Source:** User bug report + codebase analysis

<domain>
## Phase Boundary

This phase fixes the Docker sandbox integration gap in ClawStation. The current app has sandbox UI in the wizard, but:

1. **No backend selector** — Wizard only shows "local sandbox" mode, no Docker/SSH/OpenShell options
2. **Config generation broken** — `getGeneratedConfig()` in `use-wizard-store.ts` never writes the `sandbox` block to generated config
3. **Setup scripts not integrated** — OpenClaw's `scripts/sandbox-setup.sh` and `sandbox-common-setup.sh` exist but aren't called during installation
4. **Docker image not built** — No flow to build `openclaw-sandbox:bookworm-slim` image

This phase delivers complete Docker sandbox support: backend selection, config generation, and automated sandbox image setup.

</domain>

<decisions>
## Implementation Decisions

### D-01: Backend Selector in Wizard (LOCKED)
- Add backend selection to `sandbox-step.tsx` with options: Docker (default), SSH, OpenShell
- Docker is pre-selected if Docker is detected as running
- Visual cards showing each backend's security implications

### D-02: Fix getGeneratedConfig() (LOCKED)
- Must include `agents.defaults.sandbox` block with: mode, scope, workspaceAccess, backend
- Docker-specific settings: image, network (default "none"), binds
- Match OpenClaw's config schema exactly

### D-03: Integrate Sandbox Setup Scripts (LOCKED)
- During installation, run `sandbox-setup.sh` to build Docker image
- Stream progress to user (similar to current Docker install logging)
- Graceful degradation if Docker not available (warn, don't fail install)

### D-04: Docker Sandbox Configuration UI (LOCKED)
- Show Docker-specific options when Docker backend selected:
  - Network mode (none, bridge, host) with security explanation
  - Bind mounts (add/remove workspace paths)
  - Memory/CPU limits (optional advanced settings)
- Hide these options when different backend selected

### D-05: Validation in Rust Backend (LOCKED)
- Extend `validate_config` in `config.rs` to validate sandbox settings
- Check backend-specific requirements (e.g., SSH needs target)
- Return helpful error messages for invalid sandbox config

### Claude's Discretion
- Exact UI layout for backend cards
- How to handle backend switch mid-wizard
- Whether to show advanced Docker settings by default or in expandable section

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### OpenClaw Sandbox Documentation
- `openclaw/docs/gateway/sandboxing.md` — Full sandbox config reference
- `openclaw/scripts/sandbox-setup.sh` — Sandbox image build script
- `openclaw/scripts/sandbox-common-setup.sh` — Common sandbox setup functions
- `openclaw/scripts/sandbox-browser-entrypoint.sh` — Browser sandbox entrypoint

### Existing Codebase (to modify)
- `src/stores/use-wizard-store.ts` — Wizard state and `getGeneratedConfig()` function
- `src/components/wizard/sandbox-step.tsx` — Current sandbox step UI (no backend selector)
- `src/components/config/sandbox-section.tsx` — Settings page sandbox section (has backend selector)
- `src-tauri/src/commands/config.rs` — Config validation (needs sandbox validation)
- `src-tauri/src/commands/install.rs` — Installation flow (needs sandbox setup integration)

### Patterns to Follow
- `src/components/wizard/model-step.tsx` — Card-based selection pattern
- `src-tauri/src/commands/docker.rs` — Docker command execution pattern
- `src/lib/animation.ts` — Animation utilities for UI transitions

</canonical_refs>

<specifics>
## Specific Ideas

- Backend selection cards similar to model provider cards in `model-step.tsx`
- Docker backend card shows "Recommended" badge when Docker is running
- Sandbox setup runs after OpenClaw install, before Gateway start
- Progress indicator: "Building sandbox image..." with log streaming
- Config validation shows inline errors (e.g., "SSH backend requires target host")
- "Test Sandbox" button in settings to verify sandbox works after config

</specifics>

<deferred>
## Deferred Ideas

- SSH backend full implementation (just UI placeholder, actual SSH testing later)
- OpenShell backend integration (requires OpenShell plugin setup)
- Per-agent sandbox overrides (advanced feature)
- Sandbox resource monitoring (CPU/memory usage graphs)
- Custom sandbox image selection

</deferred>

---

*Phase: 18-docker-sandbox-integration*
*Context gathered: 2026-03-31 via user bug report*
