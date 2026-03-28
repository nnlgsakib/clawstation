# Phase 12: Gateway Integration — Research

**Researched:** 2026-03-28 (updated with live OpenClaw docs)
**Domain:** OpenClaw Gateway WebSocket API, config schema, process management, setup wizard flow
**Confidence:** HIGH

## Summary

The current OpenClaw Desktop app manages Docker installation and basic config editing but **does not connect to the OpenClaw Gateway** — it cannot start/stop the Gateway, read live status, manage channels, or provide a guided setup flow. This research covers how to properly integrate with the OpenClaw Gateway WebSocket API, the configuration schema, and the required architecture for a config-first setup wizard.

**Key finding:** OpenClaw runs as a Node.js Gateway process (`openclaw gateway`) on port 18789 with a WebSocket control plane. The desktop app needs to:
1. Detect Node.js 24+ (recommended) or 22.14+ (minimum)
2. Install OpenClaw via official install script or npm
3. Guide users through setup wizard BEFORE starting the Gateway (config-first)
4. Start/stop the Gateway process (`openclaw gateway`)
5. Connect to `ws://127.0.0.1:18789` for real-time management
6. Read/write `~/.openclaw/openclaw.json` for configuration

## OpenClaw Architecture

### Gateway Process Model
- **Binary:** `openclaw gateway` (Node.js process)
- **Port:** 18789 (default, configurable via `gateway.port`)
- **Protocol:** WebSocket at `ws://127.0.0.1:18789`
- **Config file:** `~/.openclaw/openclaw.json` (JSON5 format)
- **State directory:** `~/.openclaw/`
- **Workspace:** `~/.openclaw/workspace/`
- **Daemon:** `openclaw onboard --install-daemon` installs as system service

### Installation Methods (from official docs)
1. **Install script (recommended):**
   - macOS/Linux: `curl -fsSL https://openclaw.ai/install.sh | bash`
   - Windows PowerShell: `iwr -useb https://openclaw.ai/install.ps1 | iex`
2. **npm global install:** `npm install -g openclaw@latest`
3. **Docker:** `docker compose up` with provided docker-compose.yml
4. **pnpm:** `pnpm add -g openclaw@latest`

### Setup Flow (from official docs)
1. Install OpenClaw (via script or npm)
2. Run onboarding: `openclaw onboard --install-daemon`
3. Verify Gateway: `openclaw gateway status`
4. Open dashboard: `openclaw dashboard` (opens Control UI at http://127.0.0.1:18789)

### Key Configuration Schema (openclaw.json)
```json5
{
  // Agent configuration
  agents: {
    defaults: {
      model: "anthropic/claude-sonnet-4-6",  // provider/model format
      // OR model object with primary/fallbacks:
      // model: { primary: "anthropic/claude-sonnet-4-6", fallbacks: ["openai/gpt-5.2"] },
      models: {
        "anthropic/claude-sonnet-4-6": { alias: "Sonnet" },
        "openai/gpt-5.2": { alias: "GPT" },
      },
      workspace: "~/.openclaw/workspace",
      sandbox: {
        mode: "non-main",     // off | non-main | all
        scope: "session",     // session | agent | shared
        backend: "docker",    // docker | ssh | openshell
        workspaceAccess: "none", // none | ro | rw
        docker: {
          binds: [],          // host:container:mode format
          network: "none",    // default: no network (secure)
        },
      },
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
    list: [],  // Multi-agent definitions
  },

  // Channel configuration (20+ providers)
  channels: {
    whatsapp: {
      allowFrom: ["+15555550123"],
      dmPolicy: "pairing",  // pairing | allowlist | open | disabled
    },
    telegram: {
      enabled: true,
      botToken: "123:abc",
      dmPolicy: "pairing",
    },
    discord: {
      token: "123abcd",
      dmPolicy: "pairing",
    },
    slack: {
      botToken: "xoxb-...",
      appToken: "xapp-...",
    },
    signal: {},  // requires signal-cli
    msteams: {}, // plugin
    // ... 20+ more providers
  },

  // Gateway configuration
  gateway: {
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token",
      token: "...",  // read from ~/.openclaw/.env
    },
    reload: {
      mode: "hybrid",  // hybrid | hot | restart | off
      debounceMs: 300,
    },
  },

  // Tools & browser
  tools: {
    elevated: { enabled: false },
  },
  browser: {
    enabled: true,
  },

  // Cron & hooks
  cron: { enabled: true },
  hooks: { enabled: false },

  // Session management
  session: {
    dmScope: "per-channel-peer",
  },

  // Environment variables
  env: {
    vars: {},
  },
}
```

### Config Validation (IMPORTANT)
- **Strict validation:** Unknown keys, malformed types, or invalid values cause Gateway to **refuse to start**
- Only `$schema` (string) is allowed as an extra root-level key
- Use `openclaw doctor` to diagnose config issues
- Use `openclaw doctor --fix` to apply repairs

### Gateway WebSocket API (JSON-RPC style)
- `config.get` — Retrieve current config with hash for optimistic locking
- `config.apply` — Full config replace (rate-limited: 3/60s per deviceId+clientIp)
- `config.patch` — Partial config update (JSON merge patch semantics)
- `sessions.list` — List active agent sessions
- `sessions.send` — Send message to a session
- `node.list` / `node.describe` — Device node discovery
- `node.invoke` — Execute actions on device nodes

**Rate limiting:** Control-plane write RPCs are rate-limited to **3 requests per 60 seconds** per deviceId+clientIp. Returns `UNAVAILABLE` with `retryAfterMs` when limited.

### Config Hot Reload
- Gateway watches `~/.openclaw/openclaw.json` for changes
- **Hot-applies (no restart):** channels, agents, models, hooks, cron, session, tools, browser, skills, bindings
- **Requires restart:** gateway.* (port, bind, auth, TLS), discovery, plugins
- `gateway.reload.mode: "hybrid"` auto-restarts for critical changes (default)

### Config RPC Parameters
- `config.apply`: `{ raw: string, baseHash?: string, sessionKey?: string, restartDelayMs?: number }`
- `config.patch`: `{ raw: string, baseHash: string (required), sessionKey?: string }`
- `baseHash` comes from `config.get` response — used for optimistic locking

### DM Access Policies
- `"pairing"` (default): unknown senders get one-time pairing code
- `"allowlist"`: only senders in `allowFrom` or paired allow store
- `"open"`: allow all inbound DMs (requires `allowFrom: ["*"]`)
- `"disabled"`: ignore all DMs

### Environment Variables
- `OPENCLAW_HOME` — home directory for internal path resolution
- `OPENCLAW_STATE_DIR` — override the state directory
- `OPENCLAW_CONFIG_PATH` — override the config file path
- `.env` read from: current working directory + `~/.openclaw/.env` (global fallback)
- Env var substitution in config: `${VAR_NAME}` syntax (uppercase only)

### Secret Refs (for API keys)
- `{ source: "env", provider: "default", id: "OPENAI_API_KEY" }` — from environment
- `{ source: "file", provider: "filemain", id: "/path/to/secret" }` — from file
- `{ source: "exec", provider: "vault", id: "path/to/secret" }` — from command

### Diagnostic Commands
- `openclaw doctor` — diagnose config issues
- `openclaw doctor --fix` — apply repairs
- `openclaw gateway status` — check Gateway status
- `openclaw dashboard` — open Control UI
- `openclaw sandbox explain` — inspect effective sandbox config

## Current App Gap Analysis

### What EXISTS (v1.0/v1.1)
| Feature | Implementation | Gap |
|---------|---------------|-----|
| Docker detection | `docker/check.rs` | Works but only checks Docker, not OpenClaw |
| System check | `system_check.rs` | Checks disk/RAM but not Node.js/OpenClaw |
| Install | `install/` | Docker-based install only, no npm path |
| Config read/write | `config.rs` | Reads/writes openclaw.json but no Gateway integration |
| Monitoring | `monitoring.rs` | Fake data — doesn't connect to Gateway |
| Channels | `channels.rs` | Mock data — doesn't connect to Gateway |

### What's MISSING
1. **No Node.js detection** — OpenClaw requires Node 24 (recommended) or 22.14+ (minimum) but app doesn't check
2. **No npm install path** — App only does Docker, but install script + npm is the recommended path
3. **No Gateway process management** — Can't start/stop/restart the Gateway
4. **No WebSocket connection** — Can't communicate with running Gateway
5. **No setup wizard** — Users must configure everything manually after install
6. **No model provider setup** — Can't select model provider or enter API keys
7. **No channel pairing** — Mock channel data, no real WhatsApp QR / Telegram token flows
8. **No sandbox setup** — Config section exists but doesn't build sandbox images
9. **No OpenClaw webapp view** — No page to show the Control UI when Gateway is live
10. **No `openclaw doctor` integration** — Can't diagnose config issues from the app

## Required Changes

### Architecture Changes
1. **Gateway Process Manager (Rust):** Start/stop/monitor `openclaw gateway` process using `process-wrap` crate
2. **WebSocket Client (Rust):** Connect to Gateway WS for real-time status and config management via `tokio-tungstenite`
3. **Node.js Detection:** Check for Node 24+ (recommended) or 22.14+ (minimum) and guide installation if missing
4. **Install Path:** Support install script (`curl | bash` / `iwr | iex`) and npm fallback
5. **Config-First Flow:** Setup wizard → Generate config → Install → Start → Manage
6. **Doctor Integration:** Run `openclaw doctor` for config diagnostics

### Frontend Changes
1. **Setup Wizard:** Multi-step flow (Welcome → Model → API Keys → Sandbox → Channels → Review → Install)
2. **Live Dashboard:** Real WebSocket-powered status instead of polling
3. **Channel Management:** Real pairing flows with QR codes, token validation
4. **Config Editor:** Live config editing with Gateway hot-reload
5. **OpenClaw Webapp Page:** Embedded WebView or link to `http://127.0.0.1:18789` when Gateway is running

### New Tauri Commands Needed
- `start_gateway` — Start OpenClaw Gateway process (`openclaw gateway --verbose`)
- `stop_gateway` — Stop Gateway process
- `get_gateway_status` — Check if Gateway is running + TCP port check
- `gateway_ws_connect` — Establish WebSocket connection to Gateway
- `gateway_ws_call` — Make Gateway API calls via WebSocket (JSON-RPC style)
- `gateway_ws_disconnect` — Close WebSocket connection
- `check_nodejs` — Detect Node.js version (minimum 22.14+, recommend 24+)
- `install_openclaw` — Install via platform-specific install script
- `run_doctor` — Run `openclaw doctor` for diagnostics

## Recommended Stack (additions)

| Crate/Library | Version | Purpose |
|--------------|---------|---------|
| `process-wrap` | 9.1.x | Gateway process management (already in stack) |
| `reqwest` | 0.13.x | HTTP client for npm registry checks (already in stack) |
| `tokio-tungstenite` | 0.26.x | WebSocket client for Gateway connection |
| `uuid` | 1.x | Request ID generation for WebSocket RPC |

## Security Considerations
- Gateway token stored in `~/.openclaw/.env` — never expose to frontend
- WebSocket connection is localhost-only by default (`gateway.bind: "loopback"`)
- Config changes through Gateway API are rate-limited (3/60s per deviceId+clientIp)
- Sandbox setup requires Docker to be running
- `config.apply` replaces ENTIRE config — use `config.patch` for partial updates
- Config strict validation: unknown keys cause Gateway to refuse to start
- `baseHash` from `config.get` required for `config.apply` and `config.patch` (optimistic locking)

## Sources
- [OpenClaw GitHub](https://github.com/openclaw/openclaw) — Main repository
- [Getting Started](https://docs.openclaw.ai/start/getting-started) — Setup flow and requirements
- [Configuration](https://docs.openclaw.ai/gateway/configuration) — Full config reference and hot reload
- [Sandboxing](https://docs.openclaw.ai/gateway/sandboxing) — Sandbox architecture (Docker/SSH/OpenShell)
- [Channels](https://docs.openclaw.ai/channels) — 20+ channel providers
- [OpenClaw Website](https://openclaw.ai/) — Install scripts
