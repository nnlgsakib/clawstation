---
phase: 17-gateway-startup-ux-fix
plan: 03
type: execute
wave: 3
depends_on:
  - 17-gateway-startup-ux-fix-02
files_modified:
  - src/components/layout/app-shell.tsx
  - src/pages/monitor.tsx
autonomous: false
requirements:
  - GW-FIX-03
user_setup: []

must_haves:
  truths:
    - "Sidebar status indicator shows phase-appropriate text: 'Starting...', 'Health Checking...', 'Connected', 'Disconnected', 'Failed'"
    - "Sidebar shows Loader2 spinner during starting/health_checking phases"
    - "Sidebar status dot shows amber/yellow during startup, green when connected, gray when disconnected, red when failed"
    - "Monitor page status badge shows phase text: 'Starting', 'Health Checking', 'Connected', 'Stopped', 'Failed'"
    - "Quick Links (Gateway UI, Control UI) are disabled when startupPhase is not 'ready'"
    - "Quick Links show disabled styling with reduced opacity when not ready"
    - "User can verify with a checkpoint:human-verify that clicking Start shows 'Starting' not 'Connected'"
  artifacts:
    - path: src/components/layout/app-shell.tsx
      provides: "Updated sidebar gateway indicator with startupPhase-aware rendering"
    - path: src/pages/monitor.tsx
      provides: "Updated status badge, disabled quick links, startup phase display"
  key_links:
    - from: src/components/layout/app-shell.tsx
      to: src/stores/use-gateway-store.ts
      via: "useGatewayStore((s) => s.startupPhase)"
      pattern: "startupPhase"
    - from: src/pages/monitor.tsx
      to: src/stores/use-gateway-store.ts
      via: "useGatewayStore"
      pattern: "startupPhase"
---

<objective>
Update the sidebar status indicator and monitor page to consume the new startupPhase state from the gateway store. Show accurate phase-specific labels, disable WebUI links until gateway is ready, and provide clear visual feedback during the startup transition.

Purpose: Users need to see accurate status transitions instead of immediately seeing "Connected" after clicking Start. The sidebar and monitor page are the two places that display gateway status.
Output: Updated app-shell.tsx and monitor.tsx with phase-aware rendering.
</objective>

<execution_context>
@D:/projects/rust/openclaw-ins/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/components/layout/app-shell.tsx
@src/pages/monitor.tsx
@src/stores/use-gateway-store.ts
</context>

<interfaces>
From src/components/layout/app-shell.tsx (current):
```typescript
const { connected, connecting } = useGatewayStore();
// Shows: "Gateway Connected" / "Connecting..." / "Disconnected"
// Icons: Wifi / Loader2 / WifiOff
// Colors: green / amber / gray
```

From src/pages/monitor.tsx (current):
```typescript
const { connected } = useGatewayStore();
// Badge: connected ? "Running" : "Stopped"
// QuickLinks disabled when !connected
```
</interfaces>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Update sidebar gateway status indicator</name>
  <files>src/components/layout/app-shell.tsx</files>
  <behavior>
    - When startupPhase is 'starting' or 'health_checking': show Loader2 spinner, amber background, text "Starting..."
    - When startupPhase is 'ready' (or connected=true): show Wifi icon, green background, text "Gateway Connected"
    - When startupPhase is 'failed': show AlertCircle icon, red background, text "Startup Failed"
    - When disconnected (no startupPhase, not connected): show WifiOff icon, gray background, text "Disconnected"
  </behavior>
  <action>
    Update app-shell.tsx to use startupPhase from the store:

    Replace line 17:
    ```typescript
    const { connected, connecting } = useGatewayStore();
    ```
    With:
    ```typescript
    const { connected, startupPhase } = useGatewayStore();
    ```

    Import AlertCircle from lucide-react (add to existing imports at line 5):
    ```typescript
    import { Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react";
    ```

    Derive status values from startupPhase:
    ```typescript
    const isStarting = startupPhase === 'starting' || startupPhase === 'health_checking';
    const isReady = connected || startupPhase === 'ready';
    const isFailed = startupPhase === 'failed';
    const isDisconnected = !connected && !isStarting && !isFailed;
    ```

    Update the sidebar status container (lines 32-59) to use these derived values:

    Background color logic (line 35-39):
    ```typescript
    isReady
      ? "bg-success-muted/50 text-success"
      : isStarting
      ? "bg-warning-muted/50 text-warning"
      : isFailed
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground"
    ```

    Icon selection (lines 42-48):
    ```typescript
    {isStarting ? (
      <Loader2 className="h-4 w-4 animate-spin" />
    ) : isReady ? (
      <Wifi className="h-4 w-4" />
    ) : isFailed ? (
      <AlertCircle className="h-4 w-4" />
    ) : (
      <WifiOff className="h-4 w-4" />
    )}
    ```

    Status dot color (lines 50-58):
    ```typescript
    connected
      ? "bg-success"
      : isStarting
      ? "bg-warning pulse-status"
      : isFailed
      ? "bg-destructive"
      : "bg-muted-foreground"
    ```

    Status text (lines 62-68):
    ```typescript
    {connected
      ? "Gateway Connected"
      : isStarting
      ? "Starting..."
      : isFailed
      ? "Startup Failed"
      : "Disconnected"}
    ```

    Subtitle text (lines 69-71):
    ```typescript
    {connected
      ? "All systems operational"
      : isStarting
      ? "Health check in progress"
      : isFailed
      ? "Click to retry"
      : "Click to reconnect"}
    ```
  </action>
  <read_first>
    src/components/layout/app-shell.tsx
    src/stores/use-gateway-store.ts
  </read_first>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS"</automated>
  </verify>
  <done>
    Sidebar shows phase-appropriate text, icons, and colors. Starting state shows Loader2 + amber. Failed state shows AlertCircle + red. Connected state shows Wifi + green. Disconnected state shows WifiOff + gray.
  </done>
</task>

<task type="auto" tdd="true">
  <name>Task 2: Update monitor page status and disable WebUI links during startup</name>
  <files>src/pages/monitor.tsx</files>
  <behavior>
    - Status badge shows phase text based on startupPhase: "Starting", "Health Checking", "Connected", "Stopped", "Failed"
    - Status badge variant changes: "warning" during startup, "success" when connected, "outline" when stopped, "destructive" when failed
    - Quick Links (Gateway UI, Control UI) are disabled when startupPhase is NOT 'ready'
    - Status detail shows current phase label
  </behavior>
  <action>
    Update monitor.tsx to use startupPhase from the store:

    Replace line 34:
    ```typescript
    const { connected } = useGatewayStore();
    ```
    With:
    ```typescript
    const { connected, startupPhase } = useGatewayStore();
    ```

    Derive status values:
    ```typescript
    const isStarting = startupPhase === 'starting' || startupPhase === 'health_checking';
    const isReady = connected || startupPhase === 'ready';
    const isFailed = startupPhase === 'failed';
    ```

    Update status badge (lines 108-121):
    ```typescript
    <Badge variant={
      isReady ? "success" :
      isStarting ? "warning" :
      isFailed ? "destructive" :
      "outline"
    }>
      <span className="flex items-center gap-1.5">
        <span
          className={cn(
            "h-1.5 w-1.5 rounded-full",
            isReady ? "bg-success pulse-status" :
            isStarting ? "bg-warning pulse-status" :
            isFailed ? "bg-destructive" :
            "bg-muted-foreground"
          )}
        />
        {isReady ? "Running" :
         isStarting ? "Starting" :
         isFailed ? "Failed" :
         "Stopped"}
      </span>
    </Badge>
    ```

    Update StatusItem for Status field (line 126):
    ```typescript
    <StatusItem label="Status" value={
      isReady ? "Connected" :
      isStarting ? (startupPhase === 'health_checking' ? "Health Checking" : "Starting") :
      isFailed ? "Startup Failed" :
      "Disconnected"
    } />
    ```

    Update QuickLinks disabled state (lines 196-208):
    ```typescript
    <QuickLink
      icon={Globe}
      label="Gateway UI"
      href="http://127.0.0.1:18789"
      external
      disabled={!isReady}  // Changed from !connected
    />
    <QuickLink
      icon={Activity}
      label="Control UI"
      to="/webapp"
      disabled={!isReady}  // Changed from !connected
    />
    ```

    Update the "Gateway Not Running" alert (line 221):
    ```typescript
    {!connected && !isStarting && (
      // existing alert content
    )}

    {isStarting && (
      <Alert className="mt-4 border-warning/30 bg-warning/5">
        <Loader2 className="h-4 w-4 text-warning animate-spin" />
        <AlertTitle className="text-warning">Gateway Starting</AlertTitle>
        <AlertDescription>
          Waiting for gateway to become ready. This usually takes 5-15 seconds.
        </AlertDescription>
      </Alert>
    )}

    {isFailed && (
      <Alert className="mt-4 border-destructive/30 bg-destructive/5">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <AlertTitle className="text-destructive">Gateway Startup Failed</AlertTitle>
        <AlertDescription>
          Gateway failed to become healthy. Check the logs below or retry.{" "}
          <Link
            to="/install"
            className="font-medium underline hover:text-foreground"
          >
            Go to Install page
          </Link>
        </AlertDescription>
      </Alert>
    )}
    ```

    Add Loader2 to imports (line 22 - already imported, just ensure it's there).
  </action>
  <read_first>
    src/pages/monitor.tsx
    src/stores/use-gateway-store.ts
  </read_first>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS"</automated>
  </verify>
  <done>
    Monitor page shows phase-appropriate badge text and colors. QuickLinks disabled when startupPhase is not 'ready'. Starting shows Loader2 + warning alert. Failed shows AlertTriangle + error alert.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Verify gateway startup UX flow</name>
  <what-built>
    Complete gateway startup UX fix: backend health check polling with granular events, frontend store with startupPhase state, sidebar and monitor page showing accurate phase transitions.
  </what-built>
  <how-to-verify>
    1. Run `cargo tauri dev` to start the app in development mode
    2. Navigate to the Monitor page (click Monitor in sidebar)
    3. Verify the sidebar shows "Disconnected" (gray, WifiOff icon)
    4. Click the "Start Gateway" button
    5. **VERIFY:** Sidebar immediately shows "Starting..." (amber, Loader2 spinner)
    6. **VERIFY:** Monitor page badge shows "Starting" (amber badge)
    7. **VERIFY:** Quick Links (Gateway UI, Control UI) are grayed out / disabled
    8. **VERIFY:** Alert message says "Gateway Starting - Waiting for gateway to become ready"
    9. Wait 5-15 seconds for health check to complete
    10. **VERIFY:** Sidebar transitions to "Gateway Connected" (green, Wifi icon)
    11. **VERIFY:** Monitor page badge shows "Running" (green badge)
    12. **VERIFY:** Quick Links become enabled (no longer grayed out)
    13. **VERIFY:** Gateway UI link opens http://127.0.0.1:18789 and the page loads successfully
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues found</resume-signal>
</task>

</tasks>

<verification>
- TypeScript compiles with zero errors
- Sidebar shows phase-appropriate text/icons/colors
- Monitor page badge and alerts match startup phase
- Quick Links disabled when not ready
- Human verification confirms smooth status transitions
</verification>

<success_criteria>
1. Sidebar shows: "Starting..." (amber) -> "Gateway Connected" (green) or "Startup Failed" (red)
2. Monitor badge shows phase text: Starting, Connected, Failed, Stopped
3. Quick Links (Gateway UI, Control UI) disabled with reduced opacity during startup
4. Starting alert shows Loader2 + "Waiting for gateway to become ready"
5. Failed alert shows AlertTriangle + retry instructions
6. Human verification confirms no immediate "Connected" state after clicking Start
</success_criteria>

<output>
After completion, create `.planning/phases/17-gateway-startup-ux-fix/17-03-SUMMARY.md`
</output>
