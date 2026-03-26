---
phase: 04-configuration-sandboxing
plan: "02"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/stores/use-config-store.ts
  - src/hooks/use-config.ts
  - src/pages/configure.tsx
  - src/components/config/provider-section.tsx
  - src/components/config/sandbox-section.tsx
autonomous: true
requirements:
  - CONF-01
  - CONF-02
  - CONF-06
  - SAND-01
  - SAND-02
  - SAND-03
  - SAND-04
  - SAND-05

must_haves:
  truths:
    - "User can select their AI provider and model from a visual dropdown"
    - "User can toggle sandboxing on/off and choose between Docker, SSH, or OpenShell backends"
    - "User can configure sandbox scope (off, non-main, all), workspace access (none, read-only, read-write), and network policy"
    - "User can select directories for sandbox bind mounts using a file picker"
  artifacts:
    - path: "src/stores/use-config-store.ts"
      provides: "Config state management with Zustand"
      exports: ["useConfigStore"]
    - path: "src/hooks/use-config.ts"
      provides: "TanStack Query hook for config read/write"
      exports: ["useConfig", "useSaveConfig", "useValidateConfig"]
    - path: "src/pages/configure.tsx"
      provides: "Configure page replacing PageStub"
    - path: "src/components/config/provider-section.tsx"
      provides: "Provider and model selection UI"
    - path: "src/components/config/sandbox-section.tsx"
      provides: "Sandbox toggle, backend, scope, access, network, bind mounts UI"
  key_links:
    - from: "src/pages/configure.tsx"
      to: "useConfigStore"
      via: "import and render"
      pattern: "useConfigStore"
    - from: "src/hooks/use-config.ts"
      to: "invoke.*config"
      via: "Tauri invoke for read/write/validate"
      pattern: "invoke.*config"
    - from: "src/components/config/provider-section.tsx"
      to: "useConfigStore"
      via: "update provider config"
      pattern: "setProvider"
    - from: "src/components/config/sandbox-section.tsx"
      to: "useConfigStore"
      via: "update sandbox config"
      pattern: "setSandbox"
---

<objective>
Create config frontend — Zustand store, TanStack Query hooks, provider selection UI, and sandbox settings UI

Purpose: Build the user-facing configuration interface. Provider/model selection and sandbox settings are the core of Phase 4.
Output: Working configure page with provider dropdown, sandbox toggle, backend/scope/access/network controls, and bind mount picker
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@src/pages/configure.tsx
@src/hooks/use-docker.ts
@src/stores/use-onboarding-store.ts
@src/components/ui/switch.tsx
@src/components/ui/card.tsx
@src/components/ui/button.tsx
@src/components/ui/badge.tsx
@src/pages/docker.tsx

Existing patterns:
- TanStack Query + Tauri invoke pattern (use-docker.ts reference)
- Zustand store pattern (use-onboarding-store.ts, ui.ts reference)
- shadcn/ui card layout with Badge status indicators (docker.tsx reference)
- Switch component installed in Phase 2 for sandbox toggle
- HashRouter with /configure route already registered
- tauri-plugin-dialog available for file picker (in Cargo.toml as tauri-plugin-shell includes dialog)

NOTE: This plan works against the types defined in Plan 01's config.rs. The TypeScript interfaces here should mirror the Rust serde structs. Plan 01 creates the backend — this plan creates the frontend. They can be developed in parallel as the TS types are self-contained.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Config store + config query hooks + provider UI</name>
  <files>src/stores/use-config-store.ts, src/hooks/use-config.ts, src/pages/configure.tsx, src/components/config/provider-section.tsx</files>
  <read_first>
    src/hooks/use-docker.ts (TanStack Query + invoke pattern)
    src/stores/use-onboarding-store.ts (Zustand store pattern)
    src/components/ui/switch.tsx (Switch component API)
    src/components/ui/card.tsx (Card component API)
    src/pages/docker.tsx (page layout pattern)
  </read_first>
  <action>
    1. Create `src/stores/use-config-store.ts` — Zustand store mirroring OpenClawConfig:
    ```typescript
    import { create } from "zustand";

    export interface ProviderConfig {
      provider: string;
      model: string;
      apiKeyEnv?: string;
    }

    export interface BindMount {
      hostPath: string;
      access: string;
    }

    export interface SandboxConfig {
      enabled: boolean;
      backend: string;
      scope: string;
      workspaceAccess: string;
      networkPolicy: string;
      bindMounts: BindMount[];
    }

    export interface ToolsConfig {
      shell: boolean;
      filesystem: boolean;
      browser: boolean;
      api: boolean;
    }

    export interface AgentsConfig {
      sandboxMode: string;
      autonomy: string;
    }

    export interface OpenClawConfig {
      provider?: ProviderConfig;
      sandbox?: SandboxConfig;
      tools?: ToolsConfig;
      agents?: AgentsConfig;
    }

    interface ConfigState {
      config: OpenClawConfig;
      isDirty: boolean;
      setConfig: (config: OpenClawConfig) => void;
      setProvider: (provider: ProviderConfig) => void;
      setSandbox: (sandbox: SandboxConfig) => void;
      setTools: (tools: ToolsConfig) => void;
      setAgents: (agents: AgentsConfig) => void;
      markClean: () => void;
      reset: () => void;
    }

    export const useConfigStore = create<ConfigState>((set) => ({
      config: {},
      isDirty: false,
      setConfig: (config) => set({ config, isDirty: false }),
      setProvider: (provider) =>
        set((state) => ({ config: { ...state.config, provider }, isDirty: true })),
      setSandbox: (sandbox) =>
        set((state) => ({ config: { ...state.config, sandbox }, isDirty: true })),
      setTools: (tools) =>
        set((state) => ({ config: { ...state.config, tools }, isDirty: true })),
      setAgents: (agents) =>
        set((state) => ({ config: { ...state.config, agents }, isDirty: true })),
      markClean: () => set({ isDirty: false }),
      reset: () => set({ config: {}, isDirty: false }),
    }));
    ```

    2. Create `src/hooks/use-config.ts` — TanStack Query hooks:
    ```typescript
    import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
    import { invoke } from "@tauri-apps/api/core";
    import type { OpenClawConfig } from "@/stores/use-config-store";

    export function useConfig() {
      return useQuery<OpenClawConfig>({
        queryKey: ["config"],
        queryFn: async () => await invoke<OpenClawConfig>("read_config"),
        staleTime: Infinity, // Config loaded once, mutated explicitly
      });
    }

    export function useSaveConfig() {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: async (config: OpenClawConfig) => {
          await invoke("write_config", { config });
        },
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ["config"] });
        },
      });
    }

    export function useValidateConfig() {
      return useMutation({
        mutationFn: async (config: OpenClawConfig) => {
          return await invoke<{ valid: boolean; errors: { field: string; message: string }[] }>(
            "validate_config",
            { config }
          );
        },
      });
    }
    ```

    3. Create `src/components/config/provider-section.tsx`:
    - Card with title "Provider"
    - Dropdown (native select) for provider: anthropic, openai, google, ollama, azure
    - Text input for model name (auto-populated defaults per provider)
    - Text input for API key env var name (optional)
    - Updates useConfigStore on change via setProvider

    4. Rewrite `src/pages/configure.tsx`:
    - Remove PageStub
    - Use useConfig() to load config on mount, populate store via setConfig
    - Layout: heading + save button row, then section components
    - Save button: calls validate_config, if valid calls write_config, shows toast
    - Save disabled when !isDirty
    - Loading state from useConfig query
    - Follow docker.tsx page pattern (heading, description, refresh pattern)
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
    - useConfigStore.ts exists with OpenClawConfig types and state management
    - use-config.ts exists with useConfig, useSaveConfig, useValidateConfig hooks
    - provider-section.tsx has provider dropdown, model input, API key env input
    - configure.tsx loads config, renders sections, has save with validation
    - TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Sandbox settings UI component</name>
  <files>src/components/config/sandbox-section.tsx</files>
  <read_first>
    src/components/config/provider-section.tsx (from Task 1, layout pattern)
    src/components/ui/switch.tsx (Switch component for sandbox toggle)
    src/stores/use-config-store.ts (SandboxConfig type)
  </read_first>
  <action>
    Create `src/components/config/sandbox-section.tsx`:

    1. Card with title "Sandboxing" and sandbox toggle (Switch component)
    2. When sandbox enabled, show sub-sections:
       - **Backend**: Radio group (Docker, SSH, OpenShell) — use styled buttons as radio
       - **Scope**: Radio group (Off, Non-main only, All commands) — "Off" disables sandbox
       - **Workspace Access**: Radio group (None, Read-only, Read-write)
       - **Network Policy**: Radio group (None, Custom rules)
       - **Bind Mounts**: List of host_path + access pairs, each with:
         - Text display of directory path
         - Access dropdown (read-only, read-write)
         - Remove button (X icon)
         - "Add Directory" button that opens Tauri dialog (via `@tauri-apps/plugin-dialog` open function, or use native file input as fallback)
    3. All changes update useConfigStore via setSandbox
    4. Follow card layout pattern from docker.tsx (Card, CardHeader, CardContent)

    For the directory picker, use Tauri's dialog plugin:
    ```typescript
    import { open } from "@tauri-apps/plugin-dialog";
    const dir = await open({ directory: true, multiple: false });
    ```

    If tauri-plugin-dialog is not yet in Cargo.toml, add it. But it should already be available via the existing plugin setup — check if it needs to be added to `src-tauri/Cargo.toml` and registered in `lib.rs`. If not available, fall back to a simple text input for the host path.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
    - sandbox-section.tsx exists with sandbox toggle (Switch) and all sub-settings
    - Backend selection (Docker, SSH, OpenShell) works
    - Scope, workspace access, network policy have selectable options
    - Bind mounts list with add/remove functionality
    - Directory picker opens for adding bind mounts
    - All changes propagate to useConfigStore
    - TypeScript compiles cleanly
  </done>
</task>

</tasks>

<verification>
- Configure page loads config via useConfig hook and populates store
- Provider section has dropdown with at least anthropic, openai, google options
- Sandbox toggle uses Switch component from Phase 2
- Save button validates before writing
- Save button disabled when no changes (isDirty false)
- All UI uses shadcn/ui Card pattern from docker.tsx
- No PageStub import remains in configure.tsx
</verification>

<success_criteria>
- /configure route shows real config UI (not PageStub)
- Provider selection works (dropdown + model input)
- Sandbox toggle enables/disables sandbox sub-settings
- Backend, scope, workspace access, network policy all selectable
- Bind mounts have add/remove with directory picker
- Save validates then writes config to ~/.openclaw/config.yaml
</success_criteria>

<output>
After completion, create `.planning/phases/04-configuration-sandboxing/04-configuration-sandboxing-02-SUMMARY.md`
</output>
