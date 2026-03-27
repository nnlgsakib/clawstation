# Research: Phase 11 — OpenClaw Theme Redesign

**Researched:** 2026-03-27
**Researcher:** orchestrator (direct source analysis)

## Research Summary

### What We Need to Know

How to map OpenClaw's CSS variable system to the Tailwind v4 `@theme` block used by OpenClaw Desktop.

### Key Findings

#### 1. OpenClaw's Color System (from ui/src/styles/base.css)

OpenClaw uses CSS custom properties with a dark-first approach. Their default theme is already dark with signature red accents. They support multiple theme families (openknot, dash) but the base default is what we want.

**Default dark palette:**
- Backgrounds: `#0e1015` → `#13151b` → `#191c24` → `#1f2330` (layered depth)
- Accent/Primary: `#ff5c5c` (punchy red-orange)
- Text: `#d4d4d8` body, `#f4f4f5` strong
- Cards: `#161920`
- Borders: `#1e2028` (whisper-thin)
- Focus ring: `#ff5c5c`

#### 2. Current App's Tailwind v4 Theme (from src/index.css)

Uses `@theme` block with CSS variables. Currently mapped to slate/blue:
```css
--color-primary: var(--blue-600);      → needs: #ff5c5c
--color-background: var(--slate-50);   → needs: #0e1015
--color-foreground: var(--slate-900);  → needs: #d4d4d8
--color-card: var(--white);            → needs: #161920
--color-border: var(--slate-200);      → needs: #1e2028
--color-ring: var(--blue-600);         → needs: #ff5c5c
```

#### 3. Tailwind v4 @theme Mapping Strategy

Tailwind v4's `@theme` block defines semantic color tokens. We need to:
1. Replace all `var(--slate-*)` and `var(--blue-*)` references with direct hex values
2. Add new tokens that OpenClaw uses but we don't currently define (bg-accent, bg-elevated, bg-hover)
3. Ensure `color-scheme: dark` is set for proper form element styling

#### 4. Components Affected

All UI components use Tailwind utility classes referencing these semantic tokens:
- `button.tsx` — variant styles using bg-primary, bg-destructive, etc.
- `badge.tsx` — variant styles
- `card.tsx` — bg-card, text-card-foreground
- `alert.tsx` — variant styles
- `skeleton.tsx` — bg-muted
- Sidebar layout — bg-background, border-border
- Pages — bg-background throughout

**Key insight:** Since all components use semantic Tailwind tokens (not hardcoded colors), changing `index.css` should cascade automatically. Only components with hardcoded colors need manual updates.

#### 5. Dark Mode Strategy

The current app has no dark mode toggle. Since we're going dark-only:
- Set `color-scheme: dark` in the `:root` / body
- All semantic tokens map to dark values
- No `[data-theme]` switching needed yet

### Architecture Decisions

1. **Single source of truth:** All color changes in `src/index.css` `@theme` block
2. **Direct hex values:** Use OpenClaw's exact hex values, not Tailwind's built-in color scales
3. **No new dependencies:** Pure CSS variable changes, no JS/theme provider needed
4. **Component audit:** Grep for hardcoded `bg-white`, `bg-slate-*`, `text-slate-*` in component files

### Risks

1. **Contrast ratios:** Dark-on-dark text may be hard to read. Verify WCAG AA (4.5:1 for body text).
   - `#d4d4d8` on `#0e1015` ≈ 11.2:1 ✓
   - `#ff5c5c` on `#0e1015` ≈ 4.2:1 ✓ (large text/graphics)
   - `#838387` on `#0e1015` ≈ 4.5:1 ✓ (muted text)
2. **Form inputs:** Dark backgrounds need proper `color-scheme: dark` for native controls
3. **Scrollbar styling:** Current app has no custom scrollbars; dark theme may need them

### Don't Hand-Roll

- Don't create a custom ThemeProvider — Tailwind v4 `@theme` handles this
- Don't use `dark:` variants — we're going dark-only
- Don't modify component structure — colors only

---

## RESEARCH COMPLETE
