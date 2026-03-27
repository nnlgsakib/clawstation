---
phase: 11-openclaw-theme-redesign
plan: 02
type: execute
wave: 2
depends_on:
  - 11-openclaw-theme-redesign-01
files_modified:
  - src/components/layout/sidebar-nav.tsx
  - src/components/layout/header.tsx
  - src/components/layout/app-shell.tsx
  - src/components/layout/page-stub.tsx
  - src/components/config/agents-section.tsx
  - src/components/channels/pairing-modal.tsx
  - src/pages/dashboard.tsx
  - src/pages/channels.tsx
  - src/pages/settings.tsx
autonomous: true
requirements:
  - UI-THEME-01
  - UI-THEME-02

must_haves:
  truths:
    - "Sidebar uses dark background with red active indicator"
    - "Header uses dark background matching app shell"
    - "All page text uses semantic tokens, not hardcoded slate"
    - "Channel tabs use red for active state, not blue"
    - "Pairing modal uses dark card background, not white"
    - "Config section tabs use red active state, not blue"
  artifacts:
    - path: "src/components/layout/sidebar-nav.tsx"
      provides: "Navigation sidebar with active state styling"
      contains: "border-primary"
    - path: "src/components/layout/header.tsx"
      provides: "Top header bar"
      contains: "bg-background"
    - path: "src/components/layout/app-shell.tsx"
      provides: "Main shell layout with sidebar"
      contains: "bg-secondary"
  key_links:
    - from: "src/components/layout/sidebar-nav.tsx"
      to: "active nav state"
      via: "border-primary bg-muted text-primary classes"
      pattern: "border-primary|bg-muted"
    - from: "src/components/config/agents-section.tsx"
      to: "config tab active state"
      via: "border-primary bg-muted text-primary classes"
      pattern: "border-primary|bg-muted"
---

<objective>
Replace all hardcoded Tailwind color classes (slate-*, blue-*, bg-white) with semantic theme tokens across components.

Purpose: Components with hardcoded light-theme colors will remain light even after the CSS theme change. This plan ensures consistent dark theming everywhere.
Output: All component files using semantic tokens (bg-background, text-foreground, border-border, bg-primary, etc.)
</objective>

<execution_context>
@D:/projects/rust/openclaw-ins/.opencode/get-shit-done/workflows/execute-plan.md
@D:/projects/rust/openclaw-ins/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/11-openclaw-theme-redesign/11-CONTEXT.md
@.planning/phases/11-openclaw-theme-redesign/11-RESEARCH.md

<interfaces>
Hardcoded color references found (grep results):

1. src/components/layout/sidebar-nav.tsx:
   - Line 37: `border-blue-600 bg-blue-50 font-medium text-blue-700` (active state)
   - Line 38: `text-slate-500 hover:bg-slate-50 hover:text-slate-700` (inactive state)

2. src/components/layout/header.tsx:
   - Line 10: `bg-slate-50` (header background)
   - Line 13: `text-slate-900` (title text)

3. src/components/layout/app-shell.tsx:
   - Line 18: `bg-slate-100` (sidebar background)

4. src/components/layout/page-stub.tsx:
   - Line 12: `text-slate-900` (heading)
   - Line 13: `text-slate-500` (description)

5. src/components/config/agents-section.tsx:
   - Line 37, 58: `border-blue-600 bg-blue-50 text-blue-700` (active tab)

6. src/components/channels/pairing-modal.tsx:
   - Line 115: `bg-white` (content background)

7. src/pages/dashboard.tsx:
   - Line 22: `text-slate-900` (heading)
   - Line 23: `text-slate-500` (description)

8. src/pages/channels.tsx:
   - Line 347: `text-slate-500 hover:text-slate-700 hover:border-slate-300` (inactive tab)
   - Line 546: `text-slate-500` (badge text)

9. src/pages/settings.tsx:
   - Line 155: `bg-blue-500 text-white` (update badge)
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix sidebar navigation hardcoded colors</name>
  <files>src/components/layout/sidebar-nav.tsx</files>
  <read_first>src/components/layout/sidebar-nav.tsx</read_first>
  <action>
    Replace hardcoded color classes in sidebar-nav.tsx:

    **Active state** (line 37):
    - FROM: `border-blue-600 bg-blue-50 font-medium text-blue-700`
    - TO: `border-l-primary bg-muted font-medium text-primary`

    **Inactive state** (line 38):
    - FROM: `text-slate-500 hover:bg-slate-50 hover:text-slate-700`
    - TO: `text-muted-foreground hover:bg-muted hover:text-foreground`

    Also check the className for the `<nav>` or `<aside>` element wrapping the sidebar — if it has `bg-slate-*`, replace with `bg-secondary` or `bg-background`.
  </action>
  <acceptance_criteria>
    - No `slate-` or `blue-` classes remain in sidebar-nav.tsx
    - Active state uses `border-l-primary` and `text-primary`
    - Inactive state uses `text-muted-foreground`
    - Hover state uses `bg-muted` and `text-foreground`
  </acceptance_criteria>
  <verify>
    <automated>grep -c "slate-\|blue-" src/components/layout/sidebar-nav.tsx | grep "^0$"</automated>
  </verify>
  <done>Sidebar navigation uses semantic theme tokens for all states.</done>
</task>

<task type="auto">
  <name>Task 2: Fix header, shell, and page-stub hardcoded colors</name>
  <files>src/components/layout/header.tsx, src/components/layout/app-shell.tsx, src/components/layout/page-stub.tsx</files>
  <read_first>src/components/layout/header.tsx, src/components/layout/app-shell.tsx, src/components/layout/page-stub.tsx</read_first>
  <action>
    Replace hardcoded colors across these three layout files:

    **header.tsx:**
    - Line 10: `bg-slate-50` → `bg-background`
    - Line 13: `text-slate-900` → `text-foreground`

    **app-shell.tsx:**
    - Line 18: `bg-slate-100` → `bg-secondary`

    **page-stub.tsx:**
    - Line 12: `text-slate-900` → `text-foreground`
    - Line 13: `text-slate-500` → `text-muted-foreground`
  </action>
  <acceptance_criteria>
    - header.tsx uses `bg-background` and `text-foreground`
    - app-shell.tsx uses `bg-secondary` for sidebar
    - page-stub.tsx uses `text-foreground` and `text-muted-foreground`
    - No `slate-` classes remain in any of the three files
  </acceptance_criteria>
  <verify>
    <automated>grep -c "slate-" src/components/layout/header.tsx src/components/layout/app-shell.tsx src/components/layout/page-stub.tsx | grep -E ":0$"</automated>
  </verify>
  <done>Layout components use semantic tokens.</done>
</task>

<task type="auto">
  <name>Task 3: Fix pages and remaining components</name>
  <files>src/pages/dashboard.tsx, src/pages/channels.tsx, src/pages/settings.tsx, src/components/config/agents-section.tsx, src/components/channels/pairing-modal.tsx</files>
  <read_first>src/pages/dashboard.tsx, src/pages/channels.tsx, src/pages/settings.tsx, src/components/config/agents-section.tsx, src/components/channels/pairing-modal.tsx</read_first>
  <action>
    Replace all remaining hardcoded colors:

    **dashboard.tsx:**
    - Line 22: `text-slate-900` → `text-foreground`
    - Line 23: `text-slate-500` → `text-muted-foreground`

    **channels.tsx:**
    - Line 347: `border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300`
      → `border-transparent text-muted-foreground hover:text-foreground hover:border-border-strong`
    - Line 546: `text-slate-500` → `text-muted-foreground`

    **settings.tsx:**
    - Line 155: `bg-blue-500 text-white` → `bg-primary text-primary-foreground`

    **agents-section.tsx (config):**
    - Lines 37, 58: `border-blue-600 bg-blue-50 text-blue-700`
      → `border-primary bg-muted text-primary`

    **pairing-modal.tsx:**
    - Line 115: `bg-white` → `bg-card`
  </action>
  <acceptance_criteria>
    - No `slate-`, `blue-`, or `bg-white` classes remain in any of these files
    - dashboard.tsx uses `text-foreground` and `text-muted-foreground`
    - channels.tsx uses `text-muted-foreground`, `text-foreground`, `border-border-strong`
    - settings.tsx update badge uses `bg-primary text-primary-foreground`
    - agents-section.tsx active tabs use `border-primary bg-muted text-primary`
    - pairing-modal.tsx uses `bg-card`
  </acceptance_criteria>
  <verify>
    <automated>grep -c "slate-\|blue-\|bg-white" src/pages/dashboard.tsx src/pages/channels.tsx src/pages/settings.tsx src/components/config/agents-section.tsx src/components/channels/pairing-modal.tsx | grep -E ":0$"</automated>
  </verify>
  <done>All hardcoded color references replaced with semantic tokens.</done>
</task>

</tasks>

<verification>
Overall checks:
- [ ] `grep -r "slate-\|blue-\|bg-white" src/components/ src/pages/` returns 0 matches
- [ ] Sidebar active state is red (primary), not blue
- [ ] Header background matches app background (dark)
- [ ] All page text is readable on dark background
</verification>

<success_criteria>
- Zero hardcoded slate/blue/white color classes in components and pages
- All components use semantic theme tokens (bg-background, text-foreground, border-primary, etc.)
- Visual consistency: sidebar, header, cards all use dark theme
</success_criteria>

<output>
After completion, create `.planning/phases/11-openclaw-theme-redesign/11-02-SUMMARY.md`
</output>
