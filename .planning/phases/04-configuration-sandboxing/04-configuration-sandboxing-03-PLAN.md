---
phase: 04-configuration-sandboxing
plan: "03"
type: execute
wave: 1
depends_on: []
files_modified:
  - src/components/config/tools-section.tsx
  - src/components/config/agents-section.tsx
  - src/pages/configure.tsx
autonomous: true
requirements:
  - CONF-03
  - CONF-04
  - SAND-06

must_haves:
  truths:
    - "User can enable/disable individual tools (shell, filesystem, browser, API) via toggle switches"
    - "User can configure agent defaults visually (sandbox mode, autonomy)"
    - "When sandbox is enabled, app automatically runs setup scripts without manual intervention"
  artifacts:
    - path: "src/components/config/tools-section.tsx"
      provides: "Tool policy toggle switches (shell, filesystem, browser, API)"
    - path: "src/components/config/agents-section.tsx"
      provides: "Agent defaults config (sandbox mode, autonomy)"
  key_links:
    - from: "src/components/config/tools-section.tsx"
      to: "useConfigStore"
      via: "setTools on toggle change"
      pattern: "setTools"
    - from: "src/components/config/agents-section.tsx"
      to: "useConfigStore"
      via: "setAgents on selection change"
      pattern: "setAgents"
    - from: "save action"
      to: "sandbox setup trigger"
      via: "invoke sandbox_setup after successful write when sandbox.enabled changed to true"
      pattern: "sandbox.*setup"
---

<objective>
Create tool policies UI, agent defaults UI, and sandbox setup trigger

Purpose: Complete remaining config UI — tool toggles, agent defaults, and automatic sandbox setup when enabled. These complete the CONF and SAND requirements.
Output: Tools section with 4 toggle switches, agents section with sandbox mode + autonomy selectors, and sandbox setup invocation on save
</objective>

<execution_context>
@/home/nlg/projects/openclaw-installer/.opencode/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/STATE.md
@src/pages/configure.tsx
@src/components/config/provider-section.tsx
@src/components/config/sandbox-section.tsx
@src/stores/use-config-store.ts
@src/components/ui/switch.tsx
@src/components/ui/card.tsx

Existing patterns:
- Switch component (Radix) used for boolean toggles
- Card pattern from docker.tsx
- useConfigStore has setTools, setAgents actions
- Configure page from Plan 02 imports and renders section components
- tauri-plugin-shell available for running setup scripts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Tool policies section + agent defaults section</name>
  <files>src/components/config/tools-section.tsx, src/components/config/agents-section.tsx</files>
  <read_first>
    src/components/config/sandbox-section.tsx (layout pattern reference)
    src/components/ui/switch.tsx (Switch component API)
    src/components/ui/card.tsx (Card component API)
    src/stores/use-config-store.ts (ToolsConfig, AgentsConfig types)
  </read_first>
  <action>
    1. Create `src/components/config/tools-section.tsx`:
    ```typescript
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { Switch } from "@/components/ui/switch";
    import { useConfigStore } from "@/stores/use-config-store";

    const TOOLS = [
      { key: "shell" as const, label: "Shell", description: "Execute shell commands on the host" },
      { key: "filesystem" as const, label: "Filesystem", description: "Read and write files" },
      { key: "browser" as const, label: "Browser", description: "Launch and control web browsers" },
      { key: "api" as const, label: "API", description: "Make HTTP requests to external APIs" },
    ] as const;

    export function ToolsSection() {
      const tools = useConfigStore((s) => s.config.tools) ?? { shell: true, filesystem: true, browser: false, api: true };
      const setTools = useConfigStore((s) => s.setTools);

      return (
        <Card>
          <CardHeader>
            <CardTitle>Tool Policies</CardTitle>
            <CardDescription>Control which tools the agent can use</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {TOOLS.map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                <Switch
                  checked={tools[key]}
                  onCheckedChange={(checked) => setTools({ ...tools, [key]: checked })}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      );
    }
    ```

    2. Create `src/components/config/agents-section.tsx`:
    ```typescript
    import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
    import { useConfigStore } from "@/stores/use-config-store";

    const SANDBOX_MODES = [
      { value: "docker", label: "Docker", description: "Full container isolation" },
      { value: "ssh", label: "SSH", description: "Remote execution via SSH" },
      { value: "none", label: "None", description: "No sandboxing (not recommended)" },
    ];

    const AUTONOMY_LEVELS = [
      { value: "low", label: "Low", description: "Ask before every action" },
      { value: "medium", label: "Medium", description: "Ask before destructive actions" },
      { value: "high", label: "High", description: "Autonomous execution" },
    ];

    export function AgentsSection() {
      const agents = useConfigStore((s) => s.config.agents) ?? { sandboxMode: "docker", autonomy: "medium" };
      const setAgents = useConfigStore((s) => s.setAgents);

      return (
        <Card>
          <CardHeader>
            <CardTitle>Agent Defaults</CardTitle>
            <CardDescription>Default settings for new agent sessions</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Sandbox Mode */}
            <div>
              <p className="text-sm font-medium mb-3">Default Sandbox Mode</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {SANDBOX_MODES.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => setAgents({ ...agents, sandboxMode: value })}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      agents.sandboxMode === value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Autonomy Level */}
            <div>
              <p className="text-sm font-medium mb-3">Autonomy Level</p>
              <div className="grid gap-2 sm:grid-cols-3">
                {AUTONOMY_LEVELS.map(({ value, label, description }) => (
                  <button
                    key={value}
                    onClick={() => setAgents({ ...agents, autonomy: value })}
                    className={`rounded-lg border p-3 text-left text-sm transition-colors ${
                      agents.autonomy === value
                        ? "border-blue-600 bg-blue-50 text-blue-700"
                        : "border-input hover:bg-accent"
                    }`}
                  >
                    <p className="font-medium">{label}</p>
                    <p className="text-muted-foreground text-xs">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }
    ```
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
    - tools-section.tsx has 4 tool toggles (shell, filesystem, browser, API) using Switch
    - agents-section.tsx has sandbox mode selector (docker, ssh, none) and autonomy selector (low, medium, high)
    - Both use Card layout pattern consistent with other sections
    - Changes propagate to useConfigStore
    - TypeScript compiles cleanly
  </done>
</task>

<task type="auto">
  <name>Task 2: Wire sections into configure page + sandbox setup trigger</name>
  <files>src/pages/configure.tsx</files>
  <read_first>
    src/pages/configure.tsx (from Plan 02)
    src/components/config/tools-section.tsx (from Task 1)
    src/components/config/agents-section.tsx (from Task 1)
    src/stores/use-config-store.ts
  </read_first>
  <action>
    Update `src/pages/configure.tsx`:

    1. Import and render ToolsSection and AgentsSection below existing sections:
    ```typescript
    import { ToolsSection } from "@/components/config/tools-section";
    import { AgentsSection } from "@/components/config/agents-section";
    ```

    2. Add tools and agents to the page layout:
    ```
    <div className="space-y-6">
      <ProviderSection />
      <SandboxSection />
      <ToolsSection />
      <AgentsSection />
    </div>
    ```

    3. Add sandbox setup trigger to the save flow:
    - Track previous sandbox.enabled state before save
    - After successful write, if sandbox.enabled changed from false to true, invoke sandbox setup:
    ```typescript
    import { invoke } from "@tauri-apps/api/core";
    import { toast } from "sonner";

    // In save handler:
    const wasSandboxDisabled = !prevConfig?.sandbox?.enabled;
    const isSandboxNowEnabled = config.sandbox?.enabled;

    await saveMutation.mutateAsync(config);

    if (wasSandboxDisabled && isSandboxNowEnabled) {
      toast.info("Setting up sandbox environment...");
      try {
        await invoke("setup_sandbox", { config });
        toast.success("Sandbox setup complete");
      } catch (err) {
        toast.error(`Sandbox setup failed: ${err}`);
      }
    }
    ```

    NOTE: The `setup_sandbox` command may not exist yet in the Rust backend (Plan 01 focuses on config types, not sandbox setup). If the command doesn't exist, wrap it in a try/catch and show a toast saying "Sandbox setup pending — backend command not yet implemented". The frontend is still correct — it detects the transition and attempts the call. The sandbox setup command can be added later or in a follow-up plan.

    4. Ensure the page has a proper save flow:
    - Save button at top right
    - "Validate" step before write
    - Toast on success/error
    - Mark store clean after successful save
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>
    - configure.tsx renders all 4 sections: Provider, Sandbox, Tools, Agents
    - Save flow validates then writes config
    - Sandbox setup trigger fires when sandbox toggled on
    - Appropriate toast messages for success/error/pending
    - TypeScript compiles cleanly
  </done>
</task>

</tasks>

<verification>
- configure.tsx imports all 4 section components
- Page layout follows docker.tsx pattern (heading, sections in cards)
- Tool toggles use Switch component
- Agent selectors use styled-button radio pattern
- Save button validates → writes → triggers sandbox setup
- No PageStub remains
</verification>

<success_criteria>
- /configure shows Provider, Sandboxing, Tool Policies, and Agent Defaults sections
- Tool toggles (shell, filesystem, browser, API) work and persist
- Agent sandbox mode and autonomy selectors work and persist
- Enabling sandbox triggers setup attempt after save
- TypeScript compiles, no console errors
</success_criteria>

<output>
After completion, create `.planning/phases/04-configuration-sandboxing/04-configuration-sandboxing-03-SUMMARY.md`
</output>
