---
phase: 11-openclaw-theme-redesign
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - src/index.css
autonomous: true
requirements:
  - UI-THEME-01
  - UI-THEME-03

must_haves:
  truths:
    - "App background is dark (#0e1015) not light"
    - "Primary accent color is OpenClaw red (#ff5c5c)"
    - "All text on dark background meets WCAG AA contrast (4.5:1)"
    - "Cards and elevated surfaces use dark theme colors"
    - "Focus rings use red accent color"
    - "Destructive/error states are clearly visible on dark bg"
  artifacts:
    - path: "src/index.css"
      provides: "All semantic color tokens via @theme block"
      contains: "--color-primary: #ff5c5c"
  key_links:
    - from: "src/index.css @theme"
      to: "all components"
      via: "Tailwind semantic token cascade"
      pattern: "bg-primary|bg-background|text-foreground|border-border"
---

<objective>
Update the core CSS theme tokens in src/index.css to use OpenClaw's official dark palette.

Purpose: This is the single source of truth for all colors. Changing the @theme block cascades to every component using semantic Tailwind tokens (bg-primary, text-foreground, border-border, etc.).
Output: Updated src/index.css with OpenClaw dark theme tokens.
</objective>

<execution_context>
@D:/projects/rust/openclaw-ins/.opencode/get-shit-done/workflows/execute-plan.md
@D:/projects/rust/openclaw-ins/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/11-openclaw-theme-redesign/11-CONTEXT.md
@.planning/phases/11-openclaw-theme-redesign/11-RESEARCH.md

<interfaces>
From src/index.css (current @theme block):
```css
@theme {
  --font-sans: "Geist", system-ui, -apple-system, sans-serif;
  --font-mono: "Geist Mono", ui-monospace, monospace;
  --sidebar-width: 13.75rem;
  --color-background: var(--slate-50);
  --color-foreground: var(--slate-900);
  --color-card: var(--white);
  --color-card-foreground: var(--slate-900);
  --color-primary: var(--blue-600);
  --color-primary-foreground: var(--white);
  --color-secondary: var(--slate-100);
  --color-secondary-foreground: var(--slate-900);
  --color-muted: var(--slate-100);
  --color-muted-foreground: var(--slate-500);
  --color-accent: var(--slate-100);
  --color-accent-foreground: var(--slate-900);
  --color-destructive: var(--red-600);
  --color-destructive-foreground: var(--white);
  --color-border: var(--slate-200);
  --color-input: var(--slate-200);
  --color-ring: var(--blue-600);
  --radius: 0.5rem;
}
```

From OpenClaw base.css (reference palette):
```css
--bg: #0e1015;
--bg-accent: #13151b;
--bg-elevated: #191c24;
--bg-hover: #1f2330;
--card: #161920;
--accent: #ff5c5c;
--accent-hover: #ff7070;
--text: #d4d4d8;
--text-strong: #f4f4f5;
--muted: #838387;
--border: #1e2028;
--border-strong: #2e3040;
--ring: #ff5c5c;
--destructive: #ef4444;
--ok: #22c55e;
--warn: #f59e0b;
--info: #3b82f6;
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Replace @theme block with OpenClaw dark palette</name>
  <files>src/index.css</files>
  <read_first>src/index.css</read_first>
  <action>
    Replace the entire `@theme` block in `src/index.css` with OpenClaw's dark palette tokens. Use direct hex values (not Tailwind color scale references like `var(--slate-*)`).

    New @theme block should contain:

    ```css
    @theme {
      --font-sans: "Geist", system-ui, -apple-system, sans-serif;
      --font-mono: "Geist Mono", ui-monospace, monospace;
      --sidebar-width: 13.75rem;

      /* OpenClaw dark palette */
      --color-background: #0e1015;
      --color-foreground: #d4d4d8;
      --color-card: #161920;
      --color-card-foreground: #f0f0f2;
      --color-primary: #ff5c5c;
      --color-primary-foreground: #ffffff;
      --color-secondary: #191c24;
      --color-secondary-foreground: #d4d4d8;
      --color-muted: #1f2330;
      --color-muted-foreground: #838387;
      --color-accent: #1f2330;
      --color-accent-foreground: #d4d4d8;
      --color-destructive: #ef4444;
      --color-destructive-foreground: #fafafa;
      --color-border: #1e2028;
      --color-input: #1e2028;
      --color-ring: #ff5c5c;
      --radius: 0.5rem;

      /* Extended OpenClaw tokens */
      --color-bg-elevated: #191c24;
      --color-bg-hover: #1f2330;
      --color-border-strong: #2e3040;
      --color-success: #22c55e;
      --color-warning: #f59e0b;
      --color-info: #3b82f6;
      --color-text-strong: #f4f4f5;
    }
    ```

    Also add `color-scheme: dark;` to the `:root` or body block for proper form element styling.
    Add `background-color: var(--color-background);` and `color: var(--color-foreground);` to the body base style (keep existing body styles).
  </action>
  <acceptance_criteria>
    - `src/index.css` contains `--color-primary: #ff5c5c`
    - `src/index.css` contains `--color-background: #0e1015`
    - `src/index.css` contains `--color-foreground: #d4d4d8`
    - `src/index.css` contains `--color-ring: #ff5c5c`
    - `src/index.css` contains `color-scheme: dark`
    - No references to `var(--slate-*)` or `var(--blue-*)` remain in @theme block
  </acceptance_criteria>
  <verify>
    <automated>grep -c "slate-\|blue-" src/index.css | grep "^0$"</automated>
  </verify>
  <done>All CSS semantic tokens use OpenClaw dark palette hex values. Body has color-scheme: dark.</done>
</task>

<task type="auto">
  <name>Task 2: Add dark scrollbar and selection styles</name>
  <files>src/index.css</files>
  <read_first>src/index.css</read_first>
  <action>
    Add dark-themed scrollbar and text selection styles to the `@layer base` block in `src/index.css`:

    ```css
    @layer base {
      * {
        border-color: var(--color-border);
      }
      body {
        background-color: var(--color-background);
        color: var(--color-foreground);
        font-family: var(--font-sans);
        color-scheme: dark;
      }
      ::selection {
        background-color: rgba(255, 92, 92, 0.2);
        color: #f4f4f5;
      }
      ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background: rgba(255, 255, 255, 0.08);
        border-radius: 9999px;
      }
      ::-webkit-scrollbar-thumb:hover {
        background: rgba(255, 255, 255, 0.14);
      }
    }
    ```

    Preserve the existing `* { border-color }` and `body { ... }` rules. Merge `color-scheme: dark` into the existing body block.
  </action>
  <acceptance_criteria>
    - `src/index.css` base layer includes `color-scheme: dark` in body
    - `::selection` uses red-tinted background
    - Scrollbar styles present for webkit browsers
  </acceptance_criteria>
  <verify>
    <automated>grep -c "color-scheme: dark" src/index.css</automated>
  </verify>
  <done>Dark scrollbar and selection styles applied.</done>
</task>

</tasks>

<verification>
Overall checks for this plan:
- [ ] `src/index.css` has no light-theme tokens (slate/blue references gone)
- [ ] App renders with dark background (#0e1015) when opened
- [ ] Primary buttons show red (#ff5c5c) background
- [ ] Text is readable on dark background
</verification>

<success_criteria>
- src/index.css @theme block uses OpenClaw dark palette hex values
- No references to Tailwind color scales (slate, blue) in theme tokens
- color-scheme: dark set for proper form element styling
- Custom scrollbar and selection styles applied
</success_criteria>

<output>
After completion, create `.planning/phases/11-openclaw-theme-redesign/11-01-SUMMARY.md`
</output>
