---
phase: 06-lifecycle
plan: "02"
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/Cargo.toml
  - src-tauri/src/lib.rs
  - src-tauri/tauri.conf.json
  - src-tauri/capabilities/default.json
  - src/hooks/use-app-update.ts
  - src/pages/settings.tsx
autonomous: true
requirements:
  - LIFE-02

must_haves:
  truths:
    - "App checks for desktop app updates on startup"
    - "User is notified when a desktop app update is available"
    - "User can install the desktop app update with one click"
    - "App relaunches automatically after update installation"
  artifacts:
    - path: "src-tauri/Cargo.toml"
      provides: "tauri-plugin-updater and tauri-plugin-process dependencies"
    - path: "src-tauri/src/lib.rs"
      provides: "Updater and process plugin registration"
    - path: "src-tauri/tauri.conf.json"
      provides: "Updater endpoint and pubkey configuration"
    - path: "src-tauri/capabilities/default.json"
      provides: "Updater, dialog, and process permissions"
    - path: "src/hooks/use-app-update.ts"
      provides: "Frontend hook for app update check + install flow"
      exports: ["useAppUpdate", "checkForAppUpdates"]
  key_links:
    - from: "src/hooks/use-app-update.ts"
      to: "@tauri-apps/plugin-updater"
      via: "check() and update.downloadAndInstall()"
      pattern: "from.*@tauri-apps/plugin-updater"
    - from: "src/hooks/use-app-update.ts"
      to: "@tauri-apps/plugin-process"
      via: "relaunch() after update install"
      pattern: "from.*@tauri-apps/plugin-process.*relaunch"
    - from: "src-tauri/src/lib.rs"
      to: "tauri-plugin-updater"
      via: ".plugin(tauri_plugin_updater::Builder::new().build())"
      pattern: "plugin.*tauri_plugin_updater"
---

## Objective

**Desktop App Auto-Update (LIFE-02)**

Set up tauri-plugin-updater so the app can check for and install updates to itself. Wire the frontend to show update notifications on startup and in the settings page.

**Purpose:** LIFE-02 — User can update the desktop app itself with one click
**Output:** Updater plugin configured, capabilities set, frontend auto-update flow with dialog confirmation

</objective>

<context>

@.planning/phases/06-lifecycle/06-RESEARCH.md
@src-tauri/Cargo.toml
@src-tauri/src/lib.rs
@src-tauri/tauri.conf.json
@src-tauri/capabilities/default.json

### Key Existing Patterns

**Plugin registration (from lib.rs):**
```rust
.plugin(tauri_plugin_dialog::init())
```

**Cargo.toml has:** `tauri-plugin-dialog = "2"` ✓ (already present)

**Capabilities (from capabilities/default.json):**
```json
"permissions": [
  "core:default",
  "dialog:default",
  ...
]
```

**tauri.conf.json structure** (current): Need to add updater plugin config under `plugins` and set `bundle.createUpdaterArtifacts: true`

</context>

<tasks>

<task type="auto">
  <name>Task 1: Add updater plugin dependencies and configure Tauri</name>
  <files>src-tauri/Cargo.toml, src-tauri/src/lib.rs, src-tauri/tauri.conf.json, src-tauri/capabilities/default.json</files>
  <read_first>
    - src-tauri/Cargo.toml (current dependencies)
    - src-tauri/src/lib.rs (plugin registration)
    - src-tauri/tauri.conf.json (current config)
    - src-tauri/capabilities/default.json (current permissions)
  </read_first>
  <action>
    1. Add to `src-tauri/Cargo.toml` `[dependencies]`:
       ```toml
       tauri-plugin-updater = "2"
       tauri-plugin-process = "2.3"
       ```
       (Note: tauri-plugin-dialog already exists at line 28)

    2. Update `src-tauri/src/lib.rs`:
       - Add plugin registration before `.manage()`:
         ```rust
         .plugin(tauri_plugin_updater::Builder::new().build())
         .plugin(tauri_plugin_process::init())
         ```
       - These go after the existing plugin chain (after dialog)

    3. Update `src-tauri/tauri.conf.json`:
       - Add to `bundle`: `"createUpdaterArtifacts": true`
       - Add to `plugins`:
         ```json
         "updater": {
           "endpoints": [
             "https://raw.githubusercontent.com/openclaw/openclaw-installer/main/latest.json"
           ],
           "pubkey": "GENERATE_WITH_tauri_signer_generate"
         }
         ```
       - Use a placeholder pubkey string "GENERATE_WITH_tauri_signer_generate" — user must replace with real key via `npx @tauri-apps/cli signer generate`

    4. Update `src-tauri/capabilities/default.json`:
       - Add to permissions array:
         ```json
         "updater:default",
         "dialog:allow-ask",
         "process:default",
         "process:allow-restart"
         ```

    Add npm packages (frontend):
    - `@tauri-apps/plugin-updater` — check() and Update APIs
    - `@tauri-apps/plugin-process` — relaunch()
    Run: `pnpm add @tauri-apps/plugin-updater @tauri-apps/plugin-process`
  </action>
  <verify>
    <automated>grep -c "tauri-plugin-updater\|tauri-plugin-process" src-tauri/Cargo.toml; grep -c "tauri_plugin_updater\|tauri_plugin_process" src-tauri/src/lib.rs; grep -c "createUpdaterArtifacts" src-tauri/tauri.conf.json; grep -c "updater:default" src-tauri/capabilities/default.json</automated>
  </verify>
  <done>
    - Cargo.toml has tauri-plugin-updater and tauri-plugin-process
    - lib.rs registers both plugins
    - tauri.conf.json has createUpdaterArtifacts and updater config
    - capabilities has updater, process, and dialog permissions
    - Frontend packages installed (@tauri-apps/plugin-updater, @tauri-apps/plugin-process)
  </done>
</task>

<task type="auto">
  <name>Task 2: Create app update hook and wire to settings page</name>
  <files>src/hooks/use-app-update.ts, src/pages/settings.tsx</files>
  <read_first>
    - src/pages/settings.tsx (from lifecycle-01 plan — has OpenClaw Update card)
    - src/hooks/use-update.ts (existing update hook pattern from plan 01)
  </read_first>
  <action>
    Create `src/hooks/use-app-update.ts`:
    ```typescript
    import { useState, useCallback } from "react";
    import { check, Update } from "@tauri-apps/plugin-updater";
    import { relaunch } from "@tauri-apps/plugin-process";
    import { toast } from "sonner";

    interface AppUpdateState {
      update: Update | null;
      checking: boolean;
      downloading: boolean;
      progress: number;
    }

    export function useAppUpdate() {
      const [state, setState] = useState<AppUpdateState>({
        update: null,
        checking: false,
        downloading: false,
        progress: 0,
      });

      const checkForUpdates = useCallback(async () => {
        setState(s => ({ ...s, checking: true }));
        try {
          const update = await check();
          if (update) {
            setState(s => ({ ...s, update, checking: false }));
            toast.info(`Update available: v${update.version}`);
          } else {
            setState(s => ({ ...s, update: null, checking: false }));
            toast.success("You're on the latest version");
          }
        } catch (err) {
          setState(s => ({ ...s, checking: false }));
          toast.error(`Update check failed: ${err}`);
        }
      }, []);

      const installUpdate = useCallback(async () => {
        if (!state.update) return;
        setState(s => ({ ...s, downloading: true }));
        try {
          await state.update.downloadAndInstall((progress) => {
            if (progress.event === "Progress") {
              const pct = Math.round((progress.data.chunkLength / progress.data.contentLength) * 100);
              setState(s => ({ ...s, progress: pct }));
            }
          });
          toast.success("Update installed! Relaunching...");
          await relaunch();
        } catch (err) {
          setState(s => ({ ...s, downloading: false }));
          toast.error(`Update failed: ${err}`);
        }
      }, [state.update]);

      return { ...state, checkForUpdates, installUpdate };
    }
    ```

    Update `src/pages/settings.tsx`:
    - Import and use `useAppUpdate` hook
    - Add "Desktop App Update" card below the OpenClaw Update card (from plan 01)
    - Show: current app version (read from `__APP_VERSION__` or import from tauri.conf), update available status
    - "Check for Updates" button → calls checkForUpdates()
    - When update available: "Install Update" button with progress bar
    - Show checking/downloading states with Loader2 spinner
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -3; echo "---"; grep -c "useAppUpdate" src/hooks/use-app-update.ts; grep -c "useAppUpdate" src/pages/settings.tsx</automated>
  </verify>
  <done>
    - src/hooks/use-app-update.ts exists with checkForUpdates and installUpdate
    - Settings page has "Desktop App Update" card with check + install buttons
    - TypeScript compiles (npx tsc --noEmit exits 0)
  </done>
</task>

</tasks>

<verification>
- TypeScript compilation: `npx tsc --noEmit` passes
- Cargo.toml has both updater plugins
- lib.rs registers updater and process plugins
- tauri.conf.json has updater config with endpoint
- capabilities has updater:default, process:allow-restart
- Settings page has Desktop App Update card
</verification>

<success_criteria>
- tauri-plugin-updater and tauri-plugin-process registered in Cargo.toml and lib.rs
- tauri.conf.json has createUpdaterArtifacts and updater endpoint
- Capabilities include updater, process, and dialog permissions
- useAppUpdate hook: check() finds updates, downloadAndInstall() applies them, relaunch() restarts app
- Settings page shows Desktop App Update card with check/install flow
- User can see update notification on startup (optional: check on mount in App.tsx)
</success_criteria>

<user_setup>
  - service: tauri_signing_key
    why: "Code signing for secure auto-updates"
    env_vars:
      - name: TAURI_SIGNING_PRIVATE_KEY
        source: "Generate with: npx @tauri-apps/cli signer generate -w ~/.tauri/openclaw.key"
    dashboard_config:
      - task: "Replace pubkey placeholder in tauri.conf.json with content from ~/.tauri/openclaw.key.pub"
      - task: "Host latest.json at GitHub raw URL matching the endpoint in tauri.conf.json"
</user_setup>

<output>
After completion, create `.planning/phases/06-lifecycle/06-lifecycle-02-SUMMARY.md`
</output>
