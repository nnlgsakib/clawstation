# Phase 12: Gateway Integration — Context

**Gathered:** 2026-03-28 (updated with live OpenClaw docs)
**Status:** Ready for planning
**Source:** User feedback + OpenClaw documentation research

<domain>
## Phase Boundary

This phase makes OpenClaw Desktop actually work by integrating with the OpenClaw Gateway. The current app only manages Docker installation and basic config editing — it cannot start the Gateway, connect to it, or provide a guided setup flow. This phase delivers:

1. **Config-first setup wizard** — Users configure everything (model, API keys, sandbox, channels) BEFORE installation starts
2. **Gateway process management** — Start/stop/restart the OpenClaw Gateway from the desktop app
3. **Gateway WebSocket integration** — Real-time connection to Gateway for live status, config management, and channel operations
4. **Proper installation** — Support install script (primary) and npm fallback with Node.js detection
5. **OpenClaw webapp page** — Show the Control UI when Gateway is live, show status when offline

</domain>

<decisions>
## Implementation Decisions

### D-01: Config-First Flow (LOCKED)
- Users MUST configure all settings BEFORE installation starts
- Setup wizard order: Welcome → Model Provider → API Keys → Sandbox Config → Channel Selection → Review & Install
- Config is saved to `~/.openclaw/openclaw.json` BEFORE starting the Gateway
- This matches OpenClaw's own `openclaw onboard` flow but with a GUI

### D-02: Install Script as Primary Install Method (LOCKED)
- Platform-specific install scripts are the recommended path:
  - macOS/Linux: `curl -fsSL https://openclaw.ai/install.sh | bash`
  - Windows: `iwr -useb https://openclaw.ai/install.ps1 | iex`
- npm (`npm install -g openclaw@latest`) as fallback
- App must detect Node.js 24+ (recommended) or 22.14+ (minimum) and guide installation if missing
- After install, run `openclaw onboard --install-daemon` to set up as service

### D-03: Gateway WebSocket Integration (LOCKED)
- Connect to `ws://127.0.0.1:18789` (default Gateway port)
- Use Gateway API for: config.get, config.apply, config.patch, sessions.list, sessions.send
- WebSocket connection replaces the current polling-based monitoring
- Gateway token read from `~/.openclaw/.env` for authentication
- Message format: JSON-RPC style `{ id: "uuid", method: "config.get", params: {} }`
- Response: `{ id: "uuid", result: {...} }`
- **baseHash required** for config.apply and config.patch (optimistic locking)

### D-04: Model Provider Selection (LOCKED)
- Support Anthropic (Claude), OpenAI (GPT), Google (Gemini), OpenRouter as primary providers
- Each provider shows: name, logo, required API key format, pricing link
- Users enter API key during setup wizard — validated before saving
- Model selection: primary model + optional fallback model
- Config format: `agents.defaults.model.primary` + `agents.defaults.model.fallbacks`
- Model catalog: `agents.defaults.models` defines available models with aliases
- Model refs use `provider/model` format (e.g., `anthropic/claude-sonnet-4-6`)

### D-05: Sandbox Configuration (LOCKED)
- Docker-based sandboxing (OpenClaw's primary sandbox backend)
- Setup wizard configures: mode (off/non-main/all), scope (session/agent/shared), workspace access (none/ro/rw)
- App builds sandbox image via `scripts/sandbox-setup.sh` during installation
- Network defaults to "none" for security (user can override)
- Optional browser sandbox with dedicated Docker network

### D-06: Channel Selection in Setup Wizard (LOCKED)
- Users select channels during setup wizard (WhatsApp, Telegram, Discord, Slack)
- Channel-specific config forms: bot tokens, allow lists, DM policy
- Pairing flows happen AFTER Gateway is running (via Gateway WebSocket)
- Config saved to `channels.<provider>` in openclaw.json
- DM policies: pairing (default), allowlist, open, disabled

### D-07: Real-Time Status via WebSocket (LOCKED)
- Dashboard shows live Gateway status via WebSocket (not polling)
- Agent sessions, channel status, sandbox containers — all from Gateway
- Adaptive reconnection: auto-reconnect on disconnect, exponential backoff
- Status indicators: connected/disconnected/error/connecting

### D-08: OpenClaw Webapp Page (LOCKED)
- New page that shows the OpenClaw Control UI when Gateway is running
- Uses Tauri WebView to embed `http://127.0.0.1:18789` (localhost only)
- When Gateway is not running: shows status page with "Start Gateway" button
- Gateway connection indicator in sidebar shows green/red dot

### the agent's Discretion
- Exact wizard step count and UI layout
- Error handling patterns for Gateway connection failures
- Fallback behavior when Gateway is not running
- Animation and transition details for wizard steps
- Specific model catalog UI (cards vs dropdown vs list)
- Whether to embed WebView or open in external browser

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### OpenClaw Architecture
- `https://docs.openclaw.ai/start/getting-started` — Setup flow and requirements
- `https://docs.openclaw.ai/gateway/configuration` — Full config reference and hot reload
- `https://docs.openclaw.ai/gateway/sandboxing` — Sandbox configuration (Docker/SSH/OpenShell)
- `https://docs.openclaw.ai/channels` — Channel configuration (20+ providers)

### Existing Codebase Patterns
- `src-tauri/src/commands/config.rs` — Current config read/write implementation
- `src-tauri/src/commands/install.rs` — Current installation flow
- `src-tauri/src/commands/monitoring.rs` — Current monitoring (to be replaced)
- `src-tauri/src/commands/docker.rs` — Docker detection pattern
- `src-tauri/src/commands/channels.rs` — Current channels (mock data, to be replaced)
- `src/pages/configure.tsx` — Current config page (to be redesigned)
- `src/hooks/use-config.ts` — Config hooks pattern
- `src/stores/use-config-store.ts` — Zustand config store
- `src/components/layout/app-shell.tsx` — Sidebar layout with navigation

### Project Stack
- `.planning/STACK.md` — Full technology stack reference
- `.planning/ARCHITECTURE.md` — Architecture patterns

</canonical_refs>

<specifics>
## Specific Ideas

- Model provider cards with logos (Anthropic, OpenAI, Google, OpenRouter)
- API key validation: try a lightweight API call to verify key before saving
- Sandbox mode toggle with visual explanation of each mode
- Channel cards with connection status badges
- Gateway connection indicator in sidebar (green/red dot)
- Setup wizard progress bar at top of wizard
- "Quick Start" preset: Anthropic Claude + Docker sandbox + no channels (minimal config)
- "Full Setup" preset: all options exposed
- OpenClaw webapp page with WebView embed when Gateway is live
- `openclaw doctor` integration for config diagnostics

</specifics>

<deferred>
## Deferred Ideas

- Multi-agent configuration (advanced feature, not needed for initial setup)
- SSH/OpenShell sandbox backends (Docker is sufficient for most users)
- Custom model providers with base URLs (advanced)
- Cron job configuration (post-setup feature)
- Webhook configuration (post-setup feature)
- Tailscale integration (post-setup feature)

</deferred>

---

*Phase: 12-gateway-integration*
*Context gathered: 2026-03-28 via user feedback + OpenClaw docs research*
