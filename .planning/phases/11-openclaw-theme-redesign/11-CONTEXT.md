# Phase 11: OpenClaw Theme Redesign - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Source:** User directive + OpenClaw source research

<domain>
## Phase Boundary

Redesign the OpenClaw Desktop app's color palette to match the official OpenClaw brand identity. The current app uses a light blue/slate theme (shadcn/ui defaults). The target is OpenClaw's signature dark theme: deep black backgrounds with punchy red (#ff5c5c) accents.

This phase covers **only color/token changes** — no layout, component structure, or functionality changes. All existing components, animations, and interactions remain intact.

</domain>

<decisions>
## Implementation Decisions

### Color Palette (D-01)
- **Locked:** Use OpenClaw's default dark theme colors from `ui/src/styles/base.css`
- Dark background base: `#0e1015` (bg), `#13151b` (bg-accent), `#191c24` (bg-elevated)
- Signature red accent: `#ff5c5c` (primary), `#ff7070` (hover)
- Card surface: `#161920`
- Text: `#d4d4d8` (body), `#f4f4f5` (strong)
- Borders: `#1e2028` (subtle), `#2e3040` (strong)
- Destructive: `#ef4444`
- Ring/focus: `#ff5c5c`

### Theme Mode (D-02)
- **Locked:** Dark mode only for now. Light mode can be added later but is out of scope.
- The app should default to dark theme on first launch.

### Component Styling (D-03)
- **Locked:** All shadcn/ui components must work with the new palette
- Button variants (default, destructive, outline, secondary, ghost) must use new tokens
- Card, Dialog, Alert, Badge, Progress, Skeleton all inherit from CSS variables
- Sidebar must use dark theme colors

### Typography & Spacing (D-04)
- **Locked:** Keep existing Geist font stack — do not change
- Keep existing spacing, radius, and layout — only colors change

### the agent's Discretion
- Exact Tailwind CSS variable mapping (how to express OpenClaw's raw hex values in Tailwind v4's `@theme` block)
- Whether to add a CSS transition for theme change
- Specific shade derivations for muted/secondary states
- Hover state adjustments for dark-on-dark contrast

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### OpenClaw Brand Colors
- `https://raw.githubusercontent.com/openclaw/openclaw/main/ui/src/styles/base.css` — Official CSS variables (default dark + theme families)

### Current App Styling
- `src/index.css` — Current Tailwind v4 @theme block with all CSS variables
- `src/components/ui/button.tsx` — Button component with variant styles
- `src/components/ui/badge.tsx` — Badge component
- `src/components/ui/card.tsx` — Card component
- `src/components/ui/alert.tsx` — Alert component
- `src/components/layout/` — Sidebar and layout components

</canonical_refs>

<specifics>
## Specific Ideas

### OpenClaw Color Reference (extracted from base.css)

**Dark mode (default):**
| Token | Value | Notes |
|-------|-------|-------|
| --bg | #0e1015 | Main background |
| --bg-accent | #13151b | Slightly elevated |
| --bg-elevated | #191c24 | Cards, popovers |
| --bg-hover | #1f2330 | Hover states |
| --card | #161920 | Card surface |
| --accent / --primary | #ff5c5c | Signature red |
| --accent-hover | #ff7070 | Red hover |
| --text | #d4d4d8 | Body text |
| --text-strong | #f4f4f5 | Headings |
| --muted | #838387 | Muted text |
| --border | #1e2028 | Subtle borders |
| --border-strong | #2e3040 | Strong borders |
| --ring | #ff5c5c | Focus ring |
| --destructive | #ef4444 | Error/destructive |
| --ok | #22c55e | Success |
| --warn | #f59e0b | Warning |
| --info | #3b82f6 | Info |

</specifics>

<deferred>
## Deferred Ideas

- Light mode theme toggle (future phase)
- Theme persistence in tauri-plugin-store
- Custom OpenClaw logo/icon integration
- Animations for theme switching

</deferred>

---

*Phase: 11-openclaw-theme-redesign*
*Context gathered: 2026-03-27 via user directive + OpenClaw source research*
