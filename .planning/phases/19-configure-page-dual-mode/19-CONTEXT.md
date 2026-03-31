# Phase 19: Configure Page Dual-Mode Editor - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Fix the configure page so it actually works. The current page renders sections but has issues with data flow, save behavior, and lacks a JSON editing mode. This phase delivers a fully functional dual-mode configuration editor (UI mode + JSON mode) with a "Restart Gateway" action.

### Current State (what exists)
- `src/pages/configure.tsx` — Main page component with provider/sandbox/tools/agents sections + dynamic schema-driven sections
- `src/hooks/use-config.ts` — `useConfig()`, `useSaveConfig()`, `useValidateConfig()` hooks wrapping Tauri `read_config`/`write_config`/`validate_config` commands
- `src/hooks/use-gateway.ts` — `useGatewayConfig()`, `useGatewayConfigPatch()`, `useGatewayActions()` (includes `restart`)
- `src/stores/use-config-store.ts` — Zustand store with `config`, `isDirty`, `setConfig`, `updateField`, `markClean`
- `src/hooks/use-config-schema.ts` — Static schema definitions for config sections (24+ sections)
- `src/components/config/provider-section.tsx` — Provider selection UI
- `src/components/config/sandbox-section.tsx` — Sandbox settings UI
- `src/components/config/tools-section.tsx` — Tools toggle UI
- `src/components/config/agents-section.tsx` — Agent defaults UI
- `src/components/config/dynamic-config-section.tsx` — Schema-driven form section renderer
- `src/pages/monitor.tsx` — Monitor page with start/stop/restart buttons, `handleAction("restart")` function

### Current Problems
- Config loading prioritizes gateway config over file config, but the flow between file-based and gateway-based config is fragile
- No JSON editing mode for power users who want to edit raw config
- No "Restart Gateway" action on the configure page (user must navigate to monitor manually)
- The save flow validates then saves, but doesn't clearly communicate success/failure state
- Mode toggle between UI and JSON is missing entirely

</domain>

<decisions>
## Implementation Decisions

### D-01: Dual-Mode Editor (LOCKED)
The configure page MUST have two modes:
- **UI mode**: Shows config sections as polished input fields, toggles, selects, and text areas (existing section components plus improvements)
- **JSON mode**: Shows the entire config JSON in a code snippet/editor where the user can directly edit and save

### D-02: Mode Toggle (LOCKED)
A toggle/tab switch at the top of the page lets the user switch between UI mode and JSON mode. The current mode is persisted in local state (not config file).

### D-03: JSON Editor (LOCKED)
JSON mode must show the ENTIRE config as a single editable JSON blob. It must:
- Have syntax highlighting (use a lightweight code editor or styled textarea)
- Validate JSON before saving (show parse errors inline)
- Support save via a button (same Save Changes button, or dedicated JSON save)

### D-04: Restart Gateway Button (LOCKED)
A "Restart Gateway" button must be present on the configure page. When clicked:
1. Save current config (if dirty)
2. Navigate to the monitor page (`/monitor`)
3. Auto-trigger the restart action on the monitor page

### D-05: Save Behavior (LOCKED)
- Both modes share the same save mechanism
- If gateway is connected: save via `config.patch` (hot-reload)
- If gateway is not connected: save via `write_config` (file)
- Validation via `validate_config` before save
- Toast notifications for success/failure

### the agent's Discretion
- Which code editor component to use for JSON mode (CodeMirror, Monaco, or styled textarea with syntax coloring)
- How to implement the auto-restart trigger on the monitor page (URL param, store flag, or location state)
- Specific component structure and file organization
- How to handle JSON parse errors in JSON mode (inline error, toast, etc.)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Configure Page & Config Data Flow
- `src/pages/configure.tsx` — Current configure page (being replaced/enhanced)
- `src/hooks/use-config.ts` — Config read/save/validate hooks
- `src/hooks/use-gateway.ts` — Gateway config and actions (restart, config.patch)
- `src/stores/use-config-store.ts` — Config Zustand store
- `src/hooks/use-config-schema.ts` — Config section schema definitions

### Monitor Page (restart target)
- `src/pages/monitor.tsx` — Monitor page with restart button, `handleAction("restart")` function

### UI Components
- `src/components/ui/button.tsx` — Button component
- `src/components/ui/card.tsx` — Card component
- `src/components/ui/badge.tsx` — Badge component
- `src/components/ui/alert.tsx` — Alert component
- `src/components/ui/tabs.tsx` — Tabs component (if exists, check)
- `src/components/ui/switch.tsx` — Switch/toggle component
- `src/components/config/dynamic-config-section.tsx` — Dynamic form section renderer

### Navigation
- `src/router.tsx` — HashRouter with `/configure` and `/monitor` routes
- Uses `react-router-dom` with `useNavigate()` for programmatic navigation

### Error Handling
- `src/lib/toast-errors.ts` — `showError()` function for error toasts
- `src/lib/errors.ts` — `formatError()` for plain-language error messages

</canonical_refs>

<deferred>
## Deferred Ideas

- Live preview of config changes (diff view)
- Config history/versioning
- Import/export config files
- Config templates/presets

</deferred>

---

*Phase: 19-configure-page-dual-mode*
*Context gathered: 2026-03-31*
