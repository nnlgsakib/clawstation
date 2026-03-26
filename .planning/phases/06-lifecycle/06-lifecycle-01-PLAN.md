---
phase: 06-lifecycle
plan: "01"
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands/update.rs
  - src-tauri/src/commands/mod.rs
  - src-tauri/src/lib.rs
  - src/hooks/use-update.ts
  - src/pages/settings.tsx
  - src/lib/errors.ts
autonomous: true
requirements:
  - LIFE-01

must_haves:
  truths:
    - "User can check if a newer version of OpenClaw is available"
    - "User can update OpenClaw (Docker or native) with one click from the settings page"
    - "Update progress is shown to the user during the update"
    - "After update, the new version is confirmed working"
  artifacts:
    - path: "src-tauri/src/commands/update.rs"
      provides: "Tauri commands for OpenClaw version check and update"
      exports: ["check_openclaw_update", "update_openclaw"]
    - path: "src/hooks/use-update.ts"
      provides: "TanStack Query hooks for OpenClaw update check and execution"
      exports: ["useOpenClawUpdateCheck", "useUpdateOpenClaw"]
    - path: "src/pages/settings.tsx"
      provides: "Settings page with OpenClaw update card"
    - path: "src/lib/errors.ts"
      provides: "Update-specific error messages and pattern matching"
  key_links:
    - from: "src-tauri/src/commands/update.rs"
      to: "Docker daemon"
      via: "bollard inspect_container for version check, docker compose pull/up for update"
      pattern: "bollard::Docker::connect_with|docker compose"
    - from: "src/hooks/use-update.ts"
      to: "invoke('check_openclaw_update')"
      via: "TanStack Query useQuery + invoke pattern"
      pattern: "useQuery.*invoke.*check_openclaw_update"
    - from: "src/pages/settings.tsx"
      to: "useUpdateOpenClaw"
      via: "Update card with check + update buttons"
      pattern: "useOpenClawUpdateCheck|useUpdateOpenClaw"
---

## Objective

**OpenClaw One-Click Update (Backend + Frontend)**

Create Rust commands to check and update OpenClaw installations, and wire a settings page UI that lets the user update with one click.

**Purpose:** LIFE-01 — User can keep OpenClaw updated without terminal
**Output:** Tauri commands for version check + update, TanStack Query hooks, settings page update card

</objective>

<context>

@.planning/phases/06-lifecycle/06-RESEARCH.md
@src-tauri/src/commands/install.rs
@src-tauri/src/install/docker_install.rs
@src-tauri/src/error.rs
@src/pages/settings.tsx
@src/hooks/use-monitoring.ts

### Key Existing Patterns

**Docker connection (from docker_install.rs):**
```rust
let docker = bollard::Docker::connect_with_socket_defaults().map_err(|e| AppError::DockerUnavailable { suggestion: format!("Cannot connect to Docker socket: {e}") })?;
```

**Compose file path:** `~/.openclaw/docker-compose.yml` (from docker_install.rs line 145)

**Container names:** `openclaw-gateway`, `openclaw-cli` (from generate_compose_yaml in docker_install.rs)

**Emulate graceful degradation pattern (from monitoring.rs):**
```rust
// Return empty on failure, never propagate errors to frontend
```

**TanStack Query hook pattern (from use-monitoring.ts):**
```typescript
export function useOpenClawUpdateCheck() {
  return useQuery({
    queryKey: ["openclaw-update-check"],
    queryFn: () => invoke<{ currentVersion: string; latestVersion: string; updateAvailable: boolean; releaseNotes?: string }>("check_openclaw_update"),
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
```

**Progress event pattern (from install/progress.rs):**
```rust
emit_progress(app_handle, "status_key", percent, "Message...");
```

</context>

<tasks>

<task type="auto">
  <name>Task 1: Create OpenClaw update Rust backend</name>
  <files>src-tauri/src/commands/update.rs, src-tauri/src/commands/mod.rs, src-tauri/src/lib.rs</files>
  <read_first>
    - src-tauri/src/commands/install.rs (InstallMethod enum, InstallRequest pattern)
    - src-tauri/src/install/docker_install.rs (compose path, container names, bollard connection pattern)
    - src-tauri/src/error.rs (AppError variants)
    - src-tauri/src/install/progress.rs (emit_progress helper)
  </read_first>
  <action>
    Create `src-tauri/src/commands/update.rs` with two Tauri commands:

    1. `check_openclaw_update()` → `Result<OpenClawUpdateCheck, AppError>`:
       - Type: `OpenClawUpdateCheck { currentVersion: String, latestVersion: String, updateAvailable: bool, installMethod: String }`
       - Detect install method: check if `~/.openclaw/docker-compose.yml` exists → "docker", else check `which openclaw` → "native", else return updateAvailable=false
       - For Docker: use bollard to `inspect_container("openclaw-gateway")`, extract image tag/version. Compare against `ghcr.io/openclaw/openclaw:latest` (check if image digest changed)
       - For Native: run `openclaw --version` to get current. Check GitHub API `https://api.github.com/repos/openclaw/openclaw/releases/latest` for latest version
       - Graceful degradation: if Docker is unavailable or native binary not found, return { updateAvailable: false, installMethod: "unknown" }
       - Use reqwest with 10s timeout for GitHub API calls

    2. `update_openclaw(method: Option<String>, app_handle: AppHandle)` → `Result<UpdateResult, AppError>`:
       - Type: `UpdateResult { success: bool, newVersion: Option<String>, method: String }`
       - Detect method if not provided (same as check)
       - For Docker:
         - emit_progress("checking_docker", 10, "Checking Docker...")
         - connect via bollard, check docker daemon running
         - emit_progress("pulling_image", 30, "Pulling latest OpenClaw image...")
         - Use `docker.create_image()` with `from_image: "ghcr.io/openclaw/openclaw"`, `tag: "latest"` + StreamExt to track progress (same pattern as docker_install.rs lines 87-135)
         - emit_progress("restarting", 80, "Restarting OpenClaw...")
         - Run `docker compose -f ~/.openclaw/docker-compose.yml up -d openclaw-gateway` via tokio::process::Command
         - emit_progress("verifying", 90, "Verifying update...")
         - Poll /healthz endpoint for 30s (reuse verify_gateway_health from install/verify.rs)
         - emit_progress("complete", 100, "Update complete!")
         - Return success with new version
       - For Native:
         - emit_progress("downloading", 20, "Downloading latest version...")
         - Download from GitHub releases latest asset for current platform
         - emit_progress("installing", 70, "Installing update...")
         - Replace binary (platform-specific: Unix: chmod + x, Windows: replace)
         - emit_progress("complete", 100, "Update complete!")

    Add `pub mod update;` to `src-tauri/src/commands/mod.rs`.
    Register `check_openclaw_update` and `update_openclaw` in `src-tauri/src/lib.rs` invoke_handler.

    Add AppError variants for update failures if needed (or reuse existing patterns).
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | head -5; echo "---"; grep -c "check_openclaw_update\|update_openclaw" src-tauri/src/lib.rs</automated>
  </verify>
  <done>
    - src-tauri/src/commands/update.rs exists with check_openclaw_update and update_openclaw commands
    - mod.rs has pub mod update
    - lib.rs registers both commands in invoke_handler
    - TypeScript compiles (npx tsc --noEmit exits 0)
  </done>
</task>

<task type="auto">
  <name>Task 2: Create update frontend hook and settings page UI</name>
  <files>src/hooks/use-update.ts, src/pages/settings.tsx, src/lib/errors.ts</files>
  <read_first>
    - src/hooks/use-monitoring.ts (TanStack Query hook pattern)
    - src/pages/settings.tsx (current stub)
    - src/lib/errors.ts (error pattern matching)
    - src-tauri/src/commands/update.rs (Rust types from Task 1)
  </read_first>
  <action>
    Create `src/hooks/use-update.ts` with:
    ```typescript
    import { useQuery, useMutation } from "@tanstack/react-query";
    import { invoke } from "@tauri-apps/api/core";

    interface OpenClawUpdateCheck {
      currentVersion: string;
      latestVersion: string;
      updateAvailable: boolean;
      installMethod: string;
    }

    interface UpdateResult {
      success: boolean;
      newVersion: string | null;
      method: string;
    }

    export function useOpenClawUpdateCheck() {
      return useQuery<OpenClawUpdateCheck>({
        queryKey: ["openclaw-update-check"],
        queryFn: () => invoke("check_openclaw_update"),
        staleTime: 5 * 60 * 1000, // 5 min
        refetchOnWindowFocus: false,
      });
    }

    export function useUpdateOpenClaw() {
      return useMutation<UpdateResult>({
        mutationFn: () => invoke("update_openclaw"),
      });
    }
    ```

    Update `src/pages/settings.tsx` from PageStub to a full settings page with:
    - Section 1: "OpenClaw Update" card
      - Show current version and latest version
      - "Check for Updates" button (triggers refetch of useOpenClawUpdateCheck)
      - When updateAvailable=true: "Update Now" button (triggers useUpdateOpenClaw mutation)
      - Progress bar during update (listen to "openclaw-update-progress" Tauri event)
      - Success/error feedback using sonner toast (import { toast } from "sonner")
    - Section 2: "About" card showing app version from tauri.conf.json

    Add update-specific errors to `src/lib/errors.ts`:
    - Pattern: `update_failed` → "OpenClaw update failed. {reason}"
    - Pattern: `version_check_failed` → "Could not check for updates"
    Follow the existing error entry format and add to `matchErrorPattern` function.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -3; echo "---"; grep -c "useOpenClawUpdateCheck\|useUpdateOpenClaw" src/hooks/use-update.ts</automated>
  </verify>
  <done>
    - src/hooks/use-update.ts exists with useOpenClawUpdateCheck and useUpdateOpenClaw
    - src/pages/settings.tsx has OpenClaw Update card with check + update buttons
    - src/lib/errors.ts has update-related error entries
    - TypeScript compiles (npx tsc --noEmit exits 0)
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation: `npx tsc --noEmit` passes
- Update commands registered in lib.rs invoke_handler
- Settings page renders update card (not PageStub)
- useUpdate hook follows existing TanStack Query pattern
</verification>

<success_criteria>
- check_openclaw_update returns current + latest version for Docker and native installs
- update_openclaw pulls image (Docker) or downloads binary (native) with progress events
- Settings page shows version info, "Check for Updates" button, and "Update Now" when available
- Errors show actionable messages via sonner toast
</success_criteria>

<output>
After completion, create `.planning/phases/06-lifecycle/06-lifecycle-01-SUMMARY.md`
</output>
