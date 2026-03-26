---
phase: 06-lifecycle
plan: "03"
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands/uninstall.rs
  - src-tauri/src/commands/mod.rs
  - src-tauri/src/lib.rs
  - src/hooks/use-uninstall.ts
  - src/pages/settings.tsx
  - src/lib/errors.ts
autonomous: true
requirements:
  - LIFE-03
  - LIFE-04

must_haves:
  truths:
    - "User can uninstall OpenClaw completely (containers, images, config)"
    - "User can choose to preserve their configuration during uninstall"
    - "Uninstall shows progress to the user"
    - "After uninstall, app returns to pre-install state"
  artifacts:
    - path: "src-tauri/src/commands/uninstall.rs"
      provides: "Tauri command for full or partial OpenClaw uninstall"
      exports: ["uninstall_openclaw"]
    - path: "src/hooks/use-uninstall.ts"
      provides: "TanStack Query mutation hook for uninstall"
      exports: ["useUninstallOpenClaw"]
    - path: "src/pages/settings.tsx"
      provides: "Settings page with uninstall section (danger zone)"
  key_links:
    - from: "src-tauri/src/commands/uninstall.rs"
      to: "Docker daemon"
      via: "docker compose down + image removal via bollard"
      pattern: "docker compose.*down|bollard.*remove_container|bollard.*remove_image"
    - from: "src-tauri/src/commands/uninstall.rs"
      to: "~/.openclaw"
      via: "tokio::fs::remove_dir_all for config cleanup"
      pattern: "remove_dir_all|remove_file"
    - from: "src/hooks/use-uninstall.ts"
      to: "invoke('uninstall_openclaw')"
      via: "useMutation with preserveConfig parameter"
      pattern: "useMutation.*invoke.*uninstall_openclaw"
---

## Objective

**Uninstall Engine (Clean Removal + Config Preservation)**

Create a Tauri command to cleanly remove OpenClaw — stopping containers, removing images, and optionally deleting config. Wire a "Danger Zone" section in settings for uninstall.

**Purpose:** LIFE-03 + LIFE-04 — User can uninstall OpenClaw cleanly, with option to preserve config
**Output:** uninstall_openclaw command, use-uninstall hook, settings page uninstall UI

</objective>

<context>

@.planning/phases/06-lifecycle/06-RESEARCH.md
@src-tauri/src/commands/install.rs
@src-tauri/src/install/docker_install.rs
@src-tauri/src/error.rs
@src/pages/settings.tsx

### Key Existing Patterns

**Docker connection + compose path (from docker_install.rs):**
```rust
let docker = bollard::Docker::connect_with_socket_defaults()?;
let config_dir = dirs::home_dir()?.join(".openclaw");
let compose_path = config_dir.join("docker-compose.yml");
```

**Compose down command (shell out):**
```rust
tokio::process::Command::new("docker")
    .args(["compose", "-f", compose_path.to_str().unwrap(), "down"])
    .output()
    .await?;
```

**Container names from docker_install.rs:**
- `openclaw-gateway`
- `openclaw-cli`

**Config directory contents:**
- `~/.openclaw/config.yaml`
- `~/.openclaw/docker-compose.yml`
- `~/.openclaw/.env`
- `~/.openclaw/workspace/`

**Progress events:**
```rust
emit_progress(app_handle, "key", percent, "Message...");
```

</context>

<tasks>

<task type="auto">
  <name>Task 1: Create uninstall Rust backend</name>
  <files>src-tauri/src/commands/uninstall.rs, src-tauri/src/commands/mod.rs, src-tauri/src/lib.rs</files>
  <read_first>
    - src-tauri/src/install/docker_install.rs (compose path, container names, bollard patterns)
    - src-tauri/src/commands/install.rs (InstallMethod enum)
    - src-tauri/src/error.rs (AppError variants)
    - src-tauri/src/install/progress.rs (emit_progress helper)
  </read_first>
  <action>
    Create `src-tauri/src/commands/uninstall.rs` with:

    ```rust
    use serde::{Deserialize, Serialize};
    use crate::error::AppError;
    use crate::install::progress::emit_progress;

    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct UninstallResult {
        pub success: bool,
        pub removed_containers: Vec<String>,
        pub removed_config: bool,
        pub error: Option<String>,
    }

    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct UninstallRequest {
        pub preserve_config: bool,
    }
    ```

    Implement `uninstall_openclaw(request: UninstallRequest, app_handle: AppHandle)` → `Result<UninstallResult, AppError>`:

    **Step 1: Detect Docker install** (emit_progress 10%)
    - Check if `~/.openclaw/docker-compose.yml` exists
    - If exists → Docker uninstall path
    - If not → skip to native/config path

    **Step 2: Stop and remove Docker containers** (emit_progress 30%)
    - Run `docker compose -f ~/.openclaw/docker-compose.yml down` via tokio::process::Command
    - Graceful: if Docker daemon not running, continue (containers may already be gone)
    - Track removed containers: `openclaw-gateway`, `openclaw-cli`

    **Step 3: Remove Docker images** (emit_progress 50%)
    - Use bollard to `remove_image("ghcr.io/openclaw/openclaw:latest")` with force option
    - Graceful: if image not found, continue

    **Step 4: Remove Docker volumes** (emit_progress 60%)
    - Run `docker compose -f ~/.openclaw/docker-compose.yml down --volumes`
    - Graceful: continue on failure

    **Step 5: Stop native process if running** (emit_progress 70%)
    - Check for running `openclaw` process via `pgrep openclaw` (Linux) or `tasklist` (Windows)
    - If found, attempt `openclaw stop` or kill process
    - Graceful: continue if not found

    **Step 6: Remove config directory** (emit_progress 85%)
    - If `preserve_config: false`:
      - Remove `~/.openclaw/docker-compose.yml` and `~/.openclaw/.env` always
      - If no config.yaml or user chose full removal: `tokio::fs::remove_dir_all("~/.openclaw")`
      - Set removed_config: true
    - If `preserve_config: true`:
      - Only remove `docker-compose.yml`, `.env`, and container artifacts
      - Keep `config.yaml` and `workspace/` directory
      - Set removed_config: false

    **Step 7: Complete** (emit_progress 100%)
    - Return UninstallResult with success=true

    Error handling: wrap each step in try/catch, log warnings but don't fail the whole uninstall. Return partial success with details.

    Add `pub mod uninstall;` to `src-tauri/src/commands/mod.rs`.
    Register `uninstall_openclaw` in `src-tauri/src/lib.rs` invoke_handler.
  </action>
  <verify>
    <automated>grep -c "uninstall_openclaw" src-tauri/src/commands/uninstall.rs; grep -c "pub mod uninstall" src-tauri/src/commands/mod.rs; grep -c "uninstall_openclaw" src-tauri/src/lib.rs</automated>
  </verify>
  <done>
    - src-tauri/src/commands/uninstall.rs exists with uninstall_openclaw command
    - mod.rs has pub mod uninstall
    - lib.rs registers uninstall_openclaw in invoke_handler
    - Command accepts preserve_config parameter
    - Graceful error handling for all steps
  </done>
</task>

<task type="auto">
  <name>Task 2: Create uninstall frontend hook and settings UI</name>
  <files>src/hooks/use-uninstall.ts, src/pages/settings.tsx, src/lib/errors.ts</files>
  <read_first>
    - src/pages/settings.tsx (from lifecycle-01 + 02 — has Update + Desktop App Update cards)
    - src-tauri/src/commands/uninstall.rs (Rust types from Task 1)
    - src/lib/errors.ts (error pattern format)
  </read_first>
  <action>
    Create `src/hooks/use-uninstall.ts`:
    ```typescript
    import { useMutation } from "@tanstack/react-query";
    import { invoke } from "@tauri-apps/api/core";

    interface UninstallRequest {
      preserveConfig: boolean;
    }

    interface UninstallResult {
      success: boolean;
      removedContainers: string[];
      removedConfig: boolean;
      error: string | null;
    }

    export function useUninstallOpenClaw() {
      return useMutation<UninstallResult, Error, UninstallRequest>({
        mutationFn: (request) => invoke("uninstall_openclaw", { request }),
      });
    }
    ```

    Update `src/pages/settings.tsx`:
    - Import `useUninstallOpenClaw` and add a "Danger Zone" section at the bottom of settings
    - Card styling: red border (`border-red-500/30`), red-themed heading
    - Content:
      - Checkbox/toggle: "Preserve my configuration" (default: checked)
      - Warning text: "This will remove OpenClaw containers, images, and optionally your configuration. This cannot be undone."
      - "Uninstall OpenClaw" button: red variant (`variant="destructive"` from shadcn Button)
      - Confirmation: use `confirm()` dialog (native) before executing
      - Progress indicator during uninstall (listen to "openclaw-uninstall-progress" Tauri event or use mutation isPending)
      - On success: toast "OpenClaw uninstalled successfully"
      - On error: toast with error message from result

    Add uninstall errors to `src/lib/errors.ts`:
    - Pattern: `uninstall_failed` → "OpenClaw uninstall failed. {reason}"
    - Follow existing error entry format
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -3; echo "---"; grep -c "useUninstallOpenClaw" src/hooks/use-uninstall.ts; grep -c "Danger Zone\|uninstall" src/pages/settings.tsx</automated>
  </verify>
  <done>
    - src/hooks/use-uninstall.ts exists with useUninstallOpenClaw mutation
    - Settings page has "Danger Zone" section with uninstall button
    - Preserve config checkbox present
    - Confirmation dialog before uninstall
    - TypeScript compiles (npx tsc --noEmit exits 0)
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation: `npx tsc --noEmit` passes
- uninstall_openclaw registered in lib.rs
- Settings page has Danger Zone section
- Preserve config checkbox functional
- Confirmation dialog before destructive action
</verification>

<success_criteria>
- uninstall_openclaw command stops containers, removes images, optionally removes config
- preserveConfig=true keeps ~/.openclaw/config.yaml and workspace/
- preserveConfig=false removes entire ~/.openclaw directory
- Graceful: Docker unavailable or containers already gone = still succeeds
- Settings page shows Danger Zone with uninstall + preserve config option
- User sees confirmation dialog before destructive action
</success_criteria>

<output>
After completion, create `.planning/phases/06-lifecycle/06-lifecycle-03-SUMMARY.md`
</output>
