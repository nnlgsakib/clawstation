# Phase 06 Lifecycle Plan 02: User Setup Required

**Generated:** 2026-03-26
**Phase:** 06-lifecycle
**Status:** Incomplete

Complete these items for the desktop app auto-update feature to function. The agent automated everything possible; these items require human access to key generation tools.

## Environment Variables

| Status | Variable | Source | Add to |
|--------|----------|--------|--------|
| [ ] | `TAURI_SIGNING_PRIVATE_KEY` | Generate with CLI (see below) | CI/CD environment or `.env` for local builds |

## Key Generation

- [ ] **Generate Tauri signing keypair**
  - Run: `npx @tauri-apps/cli signer generate -w ~/.tauri/openclaw.key`
  - This creates:
    - `~/.tauri/openclaw.key` — private key (keep secret)
    - `~/.tauri/openclaw.key.pub` — public key

## Dashboard Configuration

- [ ] **Replace pubkey placeholder in `src-tauri/tauri.conf.json`**
  - Open `~/.tauri/openclaw.key.pub`
  - Replace `"GENERATE_WITH_tauri_signer_generate"` with the contents of the `.pub` file

- [ ] **Host update manifest at GitHub**
  - After first `tauri build`, upload the generated `.sig` file and update artifact to a GitHub Release
  - Create `latest.json` at the endpoint URL matching `tauri.conf.json` updater endpoints:
    `https://raw.githubusercontent.com/openclaw/openclaw-installer/main/latest.json`

## Verification

After completing setup:

```bash
# Verify pubkey is no longer placeholder
grep -v "GENERATE_WITH_tauri_signer_generate" src-tauri/tauri.conf.json

# Verify signing works
npx @tauri-apps/cli signer sign path/to/binary --private-key ~/.tauri/openclaw.key
```

Expected: No placeholder string in config, signing command succeeds.

---

**Once all items complete:** Mark status as "Complete" at top of file.
