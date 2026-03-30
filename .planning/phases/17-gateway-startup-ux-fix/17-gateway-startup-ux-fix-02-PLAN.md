---
phase: 17-gateway-startup-ux-fix
plan: 02
type: execute
wave: 2
depends_on:
  - 17-gateway-startup-ux-fix-01
files_modified:
  - src/stores/use-gateway-store.ts
  - src/hooks/use-gateway.ts
autonomous: true
requirements:
  - GW-FIX-01
  - GW-FIX-02
  - GW-FIX-03
user_setup: []

must_haves:
  truths:
    - "Gateway store has a startup_phase state field with values: 'starting' | 'health_checking' | 'ready' | 'failed' | null"
    - "useGatewayActions.start() does NOT call setConnected() after invoke -- waits for gateway-status event instead"
    - "useGatewayStatusListener listens for gateway-startup-phase events and updates store accordingly"
    - "useGatewayStatusListener transitions store through: disconnected -> starting -> health_checking -> ready"
    - "On gateway-stopped or gateway-health-failed events, store resets to disconnected state"
    - "Health check polling fallback runs every 5 seconds when in starting/health_checking phase"
  artifacts:
    - path: src/stores/use-gateway-store.ts
      provides: "Extended GatewayState with startupPhase field and setStartupPhase action"
    - path: src/hooks/use-gateway.ts
      provides: "Updated useGatewayActions and useGatewayStatusListener with new event handling"
  key_links:
    - from: src/hooks/use-gateway.ts
      to: src/stores/use-gateway-store.ts
      via: "store actions called in event handlers"
      pattern: "setStartupPhase|setConnected|setDisconnected"
---

<objective>
Update the frontend gateway store and hooks to consume the new backend startup phase events. Add a startup_phase state field to the Zustand store, update useGatewayActions to not optimistically set connected, and update useGatewayStatusListener to transition through states as events arrive.

Purpose: Frontend must consume the granular events emitted by Plan 01 to show accurate status instead of immediately showing "Connected" after process spawn.
Output: Extended gateway store with startupPhase, updated hooks with new event handling.
</objective>

<execution_context>
@D:/projects/rust/openclaw-ins/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src/stores/use-gateway-store.ts
@src/hooks/use-gateway.ts
</context>

<interfaces>
From src/stores/use-gateway-store.ts (current):
```typescript
interface GatewayState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
  reconnectAttempts: number;
  setConnected: () => void;
  setDisconnected: () => void;
  setConnecting: () => void;
  setError: (error: string) => void;
  incrementReconnect: () => void;
  reset: () => void;
}
```

From src/hooks/use-gateway.ts (current):
- useGatewayActions.start() calls setConnected() immediately after invoke
- useGatewayStatusListener listens for gateway-status, gateway-output, gateway-stopped events
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add startupPhase to gateway store</name>
  <files>src/stores/use-gateway-store.ts</files>
  <action>
    Extend GatewayState interface to add startup_phase tracking:

    ```typescript
    export type GatewayStartupPhase = 'starting' | 'health_checking' | 'ready' | 'failed' | null;

    interface GatewayState {
      connected: boolean;
      connecting: boolean;
      startupPhase: GatewayStartupPhase;  // NEW
      error: string | null;
      reconnectAttempts: number;
      setConnected: () => void;
      setDisconnected: () => void;
      setConnecting: () => void;
      setStartupPhase: (phase: GatewayStartupPhase) =>  void;  // NEW
      setError: (error: string) => void;
      incrementReconnect: () => void;
      reset: () => void;
    }
    ```

    Update create() initial state:
    ```typescript
    export const useGatewayStore = create<GatewayState>((set) => ({
      connected: false,
      connecting: false,
      startupPhase: null,  // NEW
      error: null,
      reconnectAttempts: 0,
      // ... existing actions
      setStartupPhase: (phase) => set({ startupPhase: phase }),  // NEW
      // Update setConnected to also set startupPhase to 'ready'
      setConnected: () => set({ connected: true, connecting: false, startupPhase: 'ready', error: null, reconnectAttempts: 0 }),
      // Update setDisconnected to also clear startupPhase
      setDisconnected: () => set({ connected: false, connecting: false, startupPhase: null, error: null }),
      // Update setConnecting to also set startupPhase to null (will be set by events)
      setConnecting: () => set({ connecting: true, startupPhase: null, error: null }),
      // Update setError to also set startupPhase to 'failed'
      setError: (error) => set({ connected: false, connecting: false, startupPhase: 'failed', error }),
      // Update reset
      reset: () => set({ connected: false, connecting: false, startupPhase: null, error: null, reconnectAttempts: 0 }),
    }));
    ```
  </action>
  <read_first>
    src/stores/use-gateway-store.ts
  </read_first>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS"</automated>
  </verify>
  <done>
    GatewayState has startupPhase field (type GatewayStartupPhase), setStartupPhase action added, existing actions updated to manage startupPhase state.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update useGatewayActions to not optimistically set connected</name>
  <files>src/hooks/use-gateway.ts</files>
  <action>
    Modify useGatewayActions (lines 82-122) to remove optimistic setConnected() calls:

    Current code at lines 85-92:
    ```typescript
    const start = useCallback(async () => {
      try {
        await invoke("start_gateway", { port: 18789 });
        setConnected();  // REMOVE THIS - optimistic
      } catch (e) {
        setError(String(e));
      }
    }, [setConnected, setError]);
    ```

    Replace with:
    ```typescript
    const start = useCallback(async () => {
      try {
        const { setStartupPhase } = useGatewayStore.getState();
        setStartupPhase('starting');  // Set starting phase immediately
        await invoke("start_gateway", { port: 18789 });
        // Do NOT call setConnected() - wait for gateway-status event from health check
      } catch (e) {
        setError(String(e));
      }
    }, [setError]);
    ```

    Update the restart callback similarly:
    ```typescript
    const restart = useCallback(async () => {
      try {
        const { setStartupPhase } = useGatewayStore.getState();
        setDisconnected();
        setStartupPhase('starting');
        await invoke("restart_gateway", { port: 18789 });
        // Do NOT call setConnected() - wait for gateway-status event
      } catch (e) {
        setError(String(e));
      }
    }, [setDisconnected, setError]);
    ```

    Also update the stop callback to clear startupPhase:
    ```typescript
    const stop = useCallback(async () => {
      try {
        await invoke("stop_gateway");
        setDisconnected();  // This already clears startupPhase via store update
      } catch (e) {
        setError(String(e));
      }
    }, [setDisconnected, setError]);
    ```
  </action>
  <read_first>
    src/hooks/use-gateway.ts
    src/stores/use-gateway-store.ts
  </read_first>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS"</automated>
  </verify>
  <done>
    useGatewayActions.start() sets startupPhase to 'starting' but does NOT call setConnected(). Connection is only established via gateway-status event from health check. restart() follows the same pattern.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update useGatewayStatusListener for startup phase events</name>
  <files>src/hooks/use-gateway.ts</files>
  <action>
    Modify useGatewayStatusListener (lines 34-77) to listen for the new gateway-startup-phase events:

    Add import at top if needed:
    ```typescript
    import type { GatewayStartupPhase } from "@/stores/use-gateway-store";
    ```

    Add a new event listener for gateway-startup-phase (after line 48, before the gateway-output listener):

    ```typescript
    // Listen for startup phase changes from backend health check
    const unlisten_startup = listen<{ phase: GatewayStartupPhase }>("gateway-startup-phase", (event) => {
      const phase = event.payload.phase;
      const { setStartupPhase } = useGatewayStore.getState();
      setStartupPhase(phase);
    });
    ```

    Update the gateway-status listener to also handle the ready phase:
    ```typescript
    const unlisten1 = listen<GatewayStatusEvent>("gateway-status", (event) => {
      if (event.payload.connected) {
        const { setConnected, setStartupPhase } = useGatewayStore.getState();
        setConnected();  // This also sets startupPhase to 'ready' via store
      }
    });
    ```

    Add listener for gateway-health-failed:
    ```typescript
    const unlisten_failed = listen<{ reason: string }>("gateway-health-failed", (event) => {
      const { setError } = useGatewayStore.getState();
      setError(event.payload.reason);
    });
    ```

    Update the cleanup return to include new listeners:
    ```typescript
    return () => {
      unlisten1.then((fn) => fn());
      unlisten2.then((fn) => fn());
      unlisten3.then((fn) => fn());
      unlisten_startup.then((fn) => fn());
      unlisten_failed.then((fn) => fn());
    };
    ```

    Update the dependency array to include new dependencies (useGatewayStore.getState):
    ```typescript
    }, []);
    ```
  </action>
  <read_first>
    src/hooks/use-gateway.ts
    src/stores/use-gateway-store.ts
  </read_first>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS"</automated>
  </verify>
  <done>
    useGatewayStatusListener listens for gateway-startup-phase events and updates store startupPhase. gateway-health-failed sets error state. All listeners properly cleaned up on unmount.
  </done>
</task>

<task type="auto">
  <name>Task 4: Add fallback status polling for stale state prevention</name>
  <files>src/hooks/use-gateway.ts</files>
  <action>
    Add a fallback polling mechanism in useGatewayStatusListener that runs every 5 seconds when the gateway is in a transitional state (starting or health_checking). This prevents stale state if events are missed.

    After the event listeners setup (around line 76), add:

    ```typescript
    // Fallback polling: check gateway status every 5s during startup
    useEffect(() => {
      const pollInterval = setInterval(() => {
        const { startupPhase, connected } = useGatewayStore.getState();
        // Only poll during startup phases
        if (!connected && (startupPhase === 'starting' || startupPhase === 'health_checking')) {
          invoke<GatewayStatusResult>("get_gateway_status")
            .then((status) => {
              if (status.running && status.startupPhase === 'ready') {
                setConnected();
              } else if (status.startupPhase === 'healthChecking') {
                useGatewayStore.getState().setStartupPhase('health_checking');
              }
            })
            .catch(() => {});
        }
      }, 5000);

      return () => clearInterval(pollInterval);
    }, [setConnected]);
    ```

    Note: The backend get_gateway_status now returns startupPhase (from Plan 01 Task 3). This polling uses that to catch any state the frontend missed via events.
  </action>
  <read_first>
    src/hooks/use-gateway.ts
    src/stores/use-gateway-store.ts
  </read_first>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | grep -c "error TS"</automated>
  </verify>
  <done>
    Fallback polling runs every 5 seconds when gateway is in startup/health_checking phase, calling get_gateway_status and updating store if status indicates ready. Prevents stale state from missed events.
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles with zero errors
- Gateway store has startupPhase field and setStartupPhase action
- useGatewayActions.start() no longer calls setConnected() optimistically
- useGatewayStatusListener listens for gateway-startup-phase events
- Fallback polling runs every 5s during startup phases
</verification>

<success_criteria>
1. GatewayStartupPhase type defined: 'starting' | 'health_checking' | 'ready' | 'failed' | null
2. GatewayState has startupPhase field and setStartupPhase action
3. useGatewayActions.start() sets startupPhase to 'starting' then awaits invoke (no optimistic connected)
4. useGatewayStatusListener handles gateway-startup-phase, gateway-health-failed events
5. Fallback 5s polling updates state from get_gateway_status during startup
6. Zero TypeScript compilation errors
</success_criteria>

<output>
After completion, create `.planning/phases/17-gateway-startup-ux-fix/17-02-SUMMARY.md`
</output>
