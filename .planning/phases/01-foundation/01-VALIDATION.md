---
phase: "01"
slug: foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 01 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (Vite-native) |
| **Config file** | none — Wave 0 installs |
| **Quick run command** | `pnpm vitest run` |
| **Full suite command** | `pnpm vitest run --coverage` |
| **Estimated runtime** | ~10 seconds |

---

## Sampling Rate

- **After every task commit:** Run `pnpm vitest run`
- **After every plan wave:** Run `pnpm vitest run --coverage`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | PLAT-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-01-02 | 01 | 1 | PLAT-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-01-03 | 01 | 1 | PLAT-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-02-03 | 02 | 2 | ERR-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-02-04 | 02 | 2 | PLAT-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-03-05 | 03 | 2 | PLAT-01, PLAT-02 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-03-06 | 03 | 2 | PLAT-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| 01-03-07 | 03 | 2 | ERR-01 | build | `pnpm tauri build 2>&1 \| tail -5` | ✅ | ⬜ pending |
| W0-platform | 0 | — | PLAT-01, PLAT-02 | smoke | `pnpm vitest run tests/platform.test.ts` | ❌ W0 | ⬜ pending |
| W0-errors | 0 | — | ERR-01 | unit | `pnpm vitest run tests/errors.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `tests/platform.test.ts` — covers PLAT-01, PLAT-02 (mock `platform()` return values, assert correct OS labels)
- [ ] `tests/errors.test.ts` — covers ERR-01 (test error map completeness, formatError fallback behavior)
- [ ] `vitest.config.ts` — Vitest configuration with React support
- [ ] Framework install: `pnpm add -D vitest @testing-library/react @testing-library/jest-dom`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Sidebar navigation works | PLAT-01 | Requires visual + click interaction | Launch `pnpm tauri dev`, click each of 6 sidebar items, verify routed page renders |
| Header displays "OpenClaw Desktop" | PLAT-01 | Visual verification | Launch app, verify header shows correct title text |
| Page stubs display placeholder copy | PLAT-01 | Visual verification | Navigate to Docker/Install/Configure/Monitor/Settings pages, verify "This section is coming in a future update." |
| Platform badge shows correct OS | PLAT-01, PLAT-02 | Runtime detection | Launch on Windows and Linux, verify badge shows "Windows" or "Linux" with correct icon |
| Dashboard welcome card | PLAT-01 | Visual verification | Launch app, verify dashboard shows "Welcome to OpenClaw" heading with "Get Started" button |
| Error toast displays | ERR-01 | Visual verification | Trigger an error, verify toast appears with plain-language message and suggestion, auto-dismisses after 5s |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
