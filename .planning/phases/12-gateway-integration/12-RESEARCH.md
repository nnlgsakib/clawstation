# Phase 12: Gateway Integration — Research

**Researched:** 2026-03-27
**Domain:** OpenClaw Gateway WebSocket API, config schema, process management, setup wizard flow
**Confidence:** HIGH

## Summary

The current OpenClaw Desktop app manages Docker installation and basic config editing but **does not connect to the OpenClaw Gateway** — it cannot start/stop the Gateway, read live status, manage channels, or provide a guided setup flow. This research covers how to properly integrate with the OpenClaw Gateway WebSocket API, the configuration schema, and the required architecture for a config-first setup wizard.

**Key finding:** OpenClaw runs as a Node.js Gateway process (`openclaw gateway`) on port 18789 with a WebSocket control plane. The desktop app needs to:
1. Install OpenClaw via npm (not just Docker)
2. Start/stop the Gateway process
3. Connect to `ws://127.0.0.1:18789` for real-time management
4. Read/write `~/.openclaw/openclaw.json` for configuration
5. Guide users through a setup wizard BEFORE starting the Gateway

## OpenClaw Architecture

### Gateway Process Model
- **Binary:** `openclaw gateway` (Node.js process)
- **Port:** 18789 (default, configurable via `gateway.port`)
- **Protocol:** WebSocket at `ws://127.0.0.1:18789`
- **Config file:** `~/.openclaw/openclaw.json` (JSON5)
- **State directory:** `~/.openclaw/`
- **Workspace:** `~/.openclaw/workspace/`

### Installation Methods
1. **npm global install:** `npm install -g openclaw@latest` (recommended)
2. **Docker:** `docker compose up` with provided docker-compose.yml
3. **pnpm:** `pnpm add -g openclaw@latest`

### Key Configuration Schema (openclaw.json)
```json5
{
  // Agent configuration
  agents: {
    defaults: {
      model: "anthropic/claude-opus-4-6",  // or model object with primary/fallbacks
      workspace: "~/.openclaw/workspace",
      sandbox: {
        mode: "non-main",     // off | non-main | all
        scope: "session",     // session | agent | shared
        backend: "docker",    // docker | ssh | openshell
        workspaceAccess: "none", // none | ro | rw
      },
      heartbeat: {
        every: "30m",
        target: "last",
      },
    },
    list: [],  // Multi-agent definitions
  },

  // Channel configuration
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
    imessage: {}, // macOS only
    msteams: {},
    // ... 20+ channel providers
  },

  // Gateway configuration
  gateway: {
    port: 18789,
    bind: "loopback",
    auth: {
      mode: "token",
      token: "...",
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
    color: "#FF4500",
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

### Gateway WebSocket API (Key Methods)
- `config.get` — Retrieve current config (with hash for optimistic locking)
- `config.apply` — Full config replace (rate-limited: 3/60s)
- `config.patch` — Partial config update (JSON merge patch)
- `sessions.list` — List active agent sessions
- `sessions.send` — Send message to a session
- `node.list` / `node.describe` — Device node discovery
- `node.invoke` — Execute actions on device nodes

### Config Hot Reload
- Gateway watches `~/.openclaw/openclaw.json` for changes
- Most settings hot-apply without restart (channels, agents, tools, etc.)
- Gateway server settings (port, bind, TLS) require restart
- `gateway.reload.mode: "hybrid"` auto-restarts for critical changes

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
1. **No Node.js detection** — OpenClaw requires Node 22+ but app doesn't check
2. **No npm install path** — App only does Docker, but `npm install -g openclaw` is the recommended path
3. **No Gateway process management** — Can't start/stop/restart the Gateway
4. **No WebSocket connection** — Can't communicate with running Gateway
5. **No setup wizard** — Users must configure everything manually after install
6. **No model provider setup** — Can't select model provider or enter API keys
7. **No channel pairing** — Mock channel data, no real WhatsApp QR / Telegram token flows
8. **No sandbox setup** — Config section exists but doesn't build sandbox images

## Required Changes

### Architecture Changes
1. **Gateway Process Manager (Rust):** Start/stop/monitor `openclaw gateway` process using `process-wrap` crate
2. **WebSocket Client (Rust):** Connect to Gateway WS for real-time status and config management
3. **Node.js Detection:** Check for Node 22+ and guide installation if missing
4. **npm Install Path:** `npm install -g openclaw@latest` as primary install method
5. **Config-First Flow:** Setup wizard → Generate config → Install → Start → Manage

### Frontend Changes
1. **Setup Wizard:** Multi-step flow (Welcome → Model → API Keys → Sandbox → Channels → Review → Install)
2. **Live Dashboard:** Real WebSocket-powered status instead of polling
3. **Channel Management:** Real pairing flows with QR codes, token validation
4. **Config Editor:** Live config editing with Gateway hot-reload

### New Tauri Commands Needed
- `start_gateway` — Start OpenClaw Gateway process
- `stop_gateway` — Stop Gateway process
- `get_gateway_status` — Check if Gateway is running + WS connection status
- `gateway_ws_connect` — Establish WebSocket connection to Gateway
- `gateway_ws_call` — Make Gateway API calls via WebSocket
- `check_nodejs` — Detect Node.js version
- `install_openclaw_npm` — Install via npm
- `setup_wizard_save` — Save wizard config to openclaw.json

## Recommended Stack (additions)

| Crate/Library | Version | Purpose |
|--------------|---------|---------|
| `process-wrap` | 9.1.x | Gateway process management (already in stack) |
| `reqwest` | 0.13.x | HTTP client for npm registry checks (already in stack) |
| `tokio-tungstenite` | 0.26.x | WebSocket client for Gateway connection |
| `notify` | 7.x | File watcher for config changes |

## Security Considerations
- Gateway token stored in `~/.openclaw/.env` — never expose to frontend
- WebSocket connection is localhost-only by default (`gateway.bind: "loopback"`)
- Config changes through Gateway API are rate-limited (3/60s)
- Sandbox setup requires Docker to be running

## Sources
- [OpenClaw GitHub](https://github.com/openclaw/openclaw) — Main repository
- [Getting Started](https://docs.openclaw.ai/start/getting-started) — Setup flow
- [Configuration](https://docs.openclaw.ai/gateway/configuration) — Full config reference
- [Sandboxing](https://docs.openclaw.ai/gateway/sandboxing) — Sandbox architecture
- [Gateway](https://docs.openclaw.ai/gateway) — Gateway runbook
- [Channels](https://docs.openclaw.ai/channels) — Channel configuration
