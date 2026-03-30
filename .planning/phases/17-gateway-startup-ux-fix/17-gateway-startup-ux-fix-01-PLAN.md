---
phase: 17-gateway-startup-ux-fix
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/src/commands/gateway.rs
  - src-tauri/src/install/verify.rs
autonomous: true
requirements:
  - GW-FIX-01
  - GW-FIX-02
user_setup: []

must_haves:
  truths:
    - "start_gateway command runs health check after process spawn before declaring ready"
    - "Backend emits granular events: gateway-startup-phase with phases starting/health_checking/ready, gateway-health-failed on timeout"
    - "GatewayStatus response includes startup_phase field with values: Starting, HealthChecking, Ready, Failed"
    - "get_gateway_status returns accurate phase based on health check, not just TCP port"
    - "Health check timeout is 60 seconds with 2-second intervals, capped at 5-second backoff"
  artifacts:
    - path: src-tauri/src/commands/gateway.rs
      provides: "StartupPhase enum, health check loop in start_gateway, event emissions"
  key_links:
    - from: src-tauri/src/commands/gateway.rs
      to: src-tauri/src/install/verify.rs
      via: "shared health check polling pattern"
      pattern: "verify_gateway_health|healthz|readyz"
---

<objective>
Add startup phase tracking with health check polling to backend gateway commands. The start_gateway command will poll /healthz and /readyz after spawning the process, emitting granular status events so the frontend knows when the gateway is actually ready to serve requests.

Purpose: Fix the race condition where start_gateway returns "running: true" immediately after process spawn, before the gateway is actually healthy.
Output: Modified gateway.rs with StartupPhase enum, health check loop, event emissions.
</objective>

<execution_context>
@D:/projects/rust/openclaw-ins/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@src-tauri/src/commands/gateway.rs
@src-tauri/src/install/verify.rs
</context>

<interfaces>
From src-tauri/src/commands/gateway.rs:
```rust
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GatewayStatus {
    pub running: bool,
    pub port: u16,
    pub pid: Option<u32>,
}
```

From src-tauri/src/install/verify.rs:
```rust
pub async fn verify_gateway_health(timeout_secs: u64) -> Result<(), AppError> {
    // Polls http://127.0.0.1:18789/healthz and /readyz
    // Exponential backoff: 2s, 2s, 3s, 4s, 5s cap
}
```
</interfaces>

<tasks>

<task type="auto">
  <name>Task 1: Add StartupPhase enum and update GatewayStatus struct</name>
  <files>src-tauri/src/commands/gateway.rs</files>
  <action>
    Add a StartupPhase enum to gateway.rs with these exact values:

    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
    #[serde(rename_all = "camelCase")]
    pub enum GatewayStartupPhase {
        Starting,
        HealthChecking,
        Ready,
        Failed,
    }
    ```

    Update GatewayStatus struct to include the new field:

    ```rust
    #[derive(Debug, Clone, Serialize, Deserialize)]
    #[serde(rename_all = "camelCase")]
    pub struct GatewayStatus {
        pub running: bool,
        pub port: u16,
        pub pid: Option<u32>,
        pub startup_phase: GatewayStartupPhase,
    }
    ```

    Update all existing GatewayStatus return sites:
    - start_gateway line 34-39 (already running in state): startup_phase: GatewayStartupPhase::Ready
    - start_gateway line 52-56 (external process on port): startup_phase: GatewayStartupPhase::Ready
    - start_gateway line 168-172 (after spawn): startup_phase: GatewayStartupPhase::Starting
    - stop_gateway line 224-228: startup_phase: GatewayStartupPhase::Starting
    - get_gateway_status line 296-300: if running { Ready } else { Starting }
  </action>
  <read_first>
    src-tauri/src/commands/gateway.rs
  </read_first>
  <verify>
    <automated>cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | grep -c "error\[E"</automated>
  </verify>
  <done>
    GatewayStatus struct has startup_phase field, StartupPhase enum defined with 4 variants, all return sites updated with appropriate phase values.
  </done>
</task>

<task type="auto">
  <name>Task 2: Add health check loop to start_gateway with event emissions</name>
  <files>src-tauri/src/commands/gateway.rs</files>
  <action>
    After spawning the gateway process (around line 164, after storing PID in AppState and before the return), add a tokio::spawn task that:

    1. Emits "gateway-startup-phase" event with phase "starting" immediately
    2. Polls http://127.0.0.1:{port}/healthz and /readyz with exponential backoff
    3. On first TCP connection success, emits phase "health_checking"
    4. On both healthz and readyz returning success, emits phase "ready" and emits "gateway-status" with connected: true
    5. On 60-second timeout, emits phase "failed" and emits "gateway-stopped"

    The health check loop pattern (matching verify_gateway_health in verify.rs):
    ```rust
    tokio::spawn(async move {
        let client = reqwest::Client::new();
        let mut attempt: u32 = 0;
        let deadline = tokio::time::Instant::now() + tokio::time::Duration::from_secs(60);
        let mut health_checked = false;

        let _ = app.emit("gateway-startup-phase",
            serde_json::json!({ "phase": "starting" }));

        loop {
            if tokio::time::Instant::now() > deadline {
                let _ = app.emit("gateway-startup-phase",
                    serde_json::json!({ "phase": "failed", "reason": "Timeout after 60s" }));
                let _ = app.emit("gateway-stopped", ());
                break;
            }

            if tokio::net::TcpStream::connect(format!("127.0.0.1:{port}")).await.is_ok() {
                if !health_checked {
                    health_checked = true;
                    let _ = app.emit("gateway-startup-phase",
                        serde_json::json!({ "phase": "healthChecking" }));
                }
                if let Ok(resp) = client.get(format!("http://127.0.0.1:{port}/healthz")).send().await {
                    if resp.status().is_success() {
                        if let Ok(ready) = client.get(format!("http://127.0.0.1:{port}/readyz")).send().await {
                            if ready.status().is_success() {
                                let _ = app.emit("gateway-startup-phase",
                                    serde_json::json!({ "phase": "ready" }));
                                let _ = app.emit("gateway-status",
                                    serde_json::json!({ "connected": true }));
                                break;
                            }
                        }
                    }
                }
            }

            let delay = std::cmp::min(2 + attempt, 5);
            tokio::time::sleep(tokio::time::Duration::from_secs(delay as u64)).await;
            attempt = attempt.saturating_add(1);
        }
    });
    ```

    The start_gateway function returns immediately with GatewayStatus { startup_phase: Starting } (non-blocking).
  </action>
  <read_first>
    src-tauri/src/commands/gateway.rs
    src-tauri/src/install/verify.rs
  </read_first>
  <verify>
    <automated>cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | grep -c "error\[E"</automated>
  </verify>
  <done>
    start_gateway spawns a non-blocking health check task, emits granular events (gateway-startup-phase with phases starting/healthChecking/ready/failed), returns immediately with startup_phase: Starting.
  </done>
</task>

<task type="auto">
  <name>Task 3: Update get_gateway_status to perform live health check</name>
  <files>src-tauri/src/commands/gateway.rs</files>
  <action>
    Modify get_gateway_status (currently at line 277-301) to:

    1. First check if TCP port 18789 is open (existing behavior)
    2. If port is open, perform a quick health check to determine phase:
       - Try GET http://127.0.0.1:18789/healthz with a 2-second timeout
       - If healthz returns success, try /readyz with 2-second timeout
       - If both succeed: return startup_phase: Ready
       - If only port is open but healthz fails: return startup_phase: HealthChecking
       - If port is closed: return startup_phase: Starting (or Failed if PID exists but port won't open)
    3. Use reqwest::Client with timeout configured, not the full verify_gateway_health loop
    4. Keep it fast -- this is called frequently by the frontend

    Use this pattern:
    ```rust
    use std::time::Duration;

    let startup_phase = if running {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(2))
            .build()
            .unwrap_or_default();

        let health_ok = client.get("http://127.0.0.1:18789/healthz")
            .send().await
            .map(|r| r.status().is_success())
            .unwrap_or(false);

        if health_ok {
            let ready_ok = client.get("http://127.0.0.1:18789/readyz")
                .send().await
                .map(|r| r.status().is_success())
                .unwrap_or(false);
            if ready_ok { GatewayStartupPhase::Ready }
            else { GatewayStartupPhase::HealthChecking }
        } else {
            GatewayStartupPhase::HealthChecking
        }
    } else {
        GatewayStartupPhase::Starting
    };

    Ok(GatewayStatus { running, port: 18789, pid, startup_phase })
    ```
  </action>
  <read_first>
    src-tauri/src/commands/gateway.rs
  </read_first>
  <verify>
    <automated>cargo check --manifest-path src-tauri/Cargo.toml 2>&1 | grep -c "error\[E"</automated>
  </verify>
  <done>
    get_gateway_status performs a quick health check (2-second timeout per endpoint) when port is open, returning accurate startup_phase (Ready, HealthChecking, or Starting) instead of blindly returning Ready when TCP port is open.
  </done>
</task>

</tasks>

<verification>
- cargo check passes with zero compilation errors
- GatewayStatus struct includes startup_phase field
- start_gateway emits gateway-startup-phase events with phases starting/healthChecking/ready/failed
- get_gateway_status returns accurate phase based on live health check
- Health check uses same backoff pattern as verify_gateway_health (2s-5s cap)
</verification>

<success_criteria>
1. StartupPhase enum defined with 4 variants: Starting, HealthChecking, Ready, Failed
2. GatewayStatus struct includes startup_phase field
3. start_gateway spawns non-blocking health check after process spawn
4. Events emitted: gateway-startup-phase (with phase), gateway-health-failed (on timeout)
5. get_gateway_status performs quick health check to determine actual readiness
6. Zero compilation errors
</success_criteria>

<output>
After completion, create `.planning/phases/17-gateway-startup-ux-fix/17-01-SUMMARY.md`
</output>
