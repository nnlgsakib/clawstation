# Phase 06 Research: Lifecycle

**Phase:** 06 — Lifecycle
**Requirements:** LIFE-01, LIFE-02, LIFE-03, LIFE-04
**Researched:** 2026-03-26

## Research Summary

### OpenClaw Update Mechanism (LIFE-01)

**Docker installs** (primary):
- `docker compose pull` fetches latest `ghcr.io/openclaw/openclaw:latest`
- `docker compose up -d openclaw-gateway` restarts with new image
- OpenClaw gateway container name: `openclaw-gateway` (from docker_install.rs)
- CLI container name: `openclaw-cli`
- Compose file lives at `~/.openclaw/docker-compose.yml`

**Native installs** (secondary):
- Re-download from GitHub releases: `https://github.com/openclaw/openclaw/releases/latest`
- Or shell out to: `npm update -g openclaw` / `openclaw update`
- State.md notes: "OpenClaw binary update mechanism unclear (npm? GitHub releases?) — resolve during Phase 6"
- **Decision**: Use GitHub releases API for version check + platform-specific download. For now, treat as download-and-replace flow since OpenClaw publishes standalone binaries.

**Version detection**:
- Docker: `docker inspect` on openclaw-gateway image tag
- Native: `openclaw --version` CLI output

### Desktop App Auto-Update (LIFE-02)

**tauri-plugin-updater v2.8+**:
- Requires `tauri-plugin-updater` in Cargo.toml, `@tauri-apps/plugin-updater` in frontend
- Also needs `tauri-plugin-dialog` (for update prompt) and `tauri-plugin-process` (for relaunch)
- Already have `tauri-plugin-dialog` in Cargo.toml ✓
- Need to add `tauri-plugin-updater` and register with `.plugin()`
- Need `tauri-plugin-process` for `relaunch()` after update

**Configuration** (`tauri.conf.json`):
- `bundle.createUpdaterArtifacts: true`
- `plugins.updater.pubkey` — from signer generate
- `plugins.updater.endpoints` — static JSON URL on GitHub (e.g., `https://raw.githubusercontent.com/openclaw/openclaw-installer/main/latest.json`)
- Endpoint supports `{{target}}`, `{{arch}}`, `{{current_version}}` variables

**Static JSON format** (GitHub-hosted):
```json
{
  "version": "v0.1.1",
  "notes": "Bug fixes",
  "pub_date": "2026-03-26T00:00:00Z",
  "platforms": {
    "linux-x86_64": { "signature": "...", "url": "..." },
    "windows-x86_64": { "signature": "...", "url": "..." }
  }
}
```

**Frontend flow**:
1. On app start: `const update = await check()` → if `update` is not null, show dialog
2. User confirms → `await update.downloadAndInstall()` with progress callback
3. After install → `await relaunch()` from tauri-plugin-process

**Permissions** (capabilities):
- `"updater:default"`, `"dialog:default"`, `"dialog:allow-ask"`, `"process:default"`, `"process:allow-restart"`

**Security**: Public-private key pair needed. Dev generates key, adds pubkey to tauri.conf.json. Private key goes in CI secrets for signing.

### Clean Uninstall (LIFE-03, LIFE-04)

**Docker uninstall targets**:
1. `docker compose -f ~/.openclaw/docker-compose.yml down` — stop containers
2. `docker compose -f ~/.openclaw/docker-compose.yml down --rmi all --volumes` — remove images/volumes (full uninstall)
3. Container names to remove: `openclaw-gateway`, `openclaw-cli`

**Native uninstall targets**:
1. Stop any running OpenClaw processes
2. Remove binary (locate via `which openclaw` or platform-specific path)

**Config directory**:
- Path: `~/.openclaw` (home dir)
- Contents: `config.yaml`, `docker-compose.yml`, `.env`, `workspace/`
- LIFE-04: User can choose to preserve config on uninstall
- If preserve: only remove compose file, .env, and containers — keep config.yaml + workspace
- If full: remove entire `~/.openclaw` directory

**Error handling**: Graceful — if Docker is already down, treat as success. If directory doesn't exist, treat as success.

## Patterns Established

| Pattern | Source |
|---------|--------|
| bollard for Docker operations | Phase 2, 3, 5 |
| TanStack Query + Tauri invoke hooks | Phase 2, 4, 5 |
| Graceful degradation on failure | Phase 5 monitoring |
| Error pattern matching in errors.ts | Phase 2, 5 |
| Zustand stores for wizard state | Phase 3 onboarding |
| Progress events via emit_progress | Phase 3 install |
| Module self-containment (duplicated helpers) | Phase 5 monitoring |

## Pitfalls

1. **tauri-plugin-updater pubkey** — must be raw content, not file path. Easy to misconfigure.
2. **Windows installer pre-quit** — updater automatically quits before installing. Need to save state.
3. **Docker compose down** — must use same compose file that install used.
4. **Config preservation** — must be atomic: remove containers first, then decide on config deletion.

## Tech Stack Additions

| Crate/Package | Version | Purpose |
|---------------|---------|---------|
| tauri-plugin-updater | 2.x | App auto-update |
| tauri-plugin-process | 2.3.x | App relaunch after update |
| @tauri-apps/plugin-updater | latest | Frontend update API |
| @tauri-apps/plugin-process | latest | Frontend relaunch API |
