---
phase: 11-openclaw-theme-redesign
plan: 03
type: execute
wave: 3
depends_on:
  - 11-openclaw-theme-redesign-01
  - 11-openclaw-theme-redesign-02
files_modified:
  - src/index.css
autonomous: false
requirements:
  - UI-THEME-02
  - UI-THEME-03

must_haves:
  truths:
    - "Build succeeds with no TypeScript or CSS errors"
    - "No hardcoded light-theme colors remain in codebase"
    - "All text meets WCAG AA contrast on dark backgrounds"
    - "App can be launched and visually verified"
  artifacts:
    - path: "src/index.css"
      provides: "Theme tokens verified correct"
  key_links:
    - from: "npm run build"
      to: "no errors"
      via: "Vite build succeeds with new CSS"
      pattern: "build.*success|✓"
---

<objective>
Build the app, run automated checks for leftover hardcoded colors, and verify visual correctness.

Purpose: Catch any missed hardcoded colors, build errors, or contrast issues before marking the theme redesign complete.
Output: Verified build with zero hardcoded light-theme colors remaining.
</objective>

<execution_context>
@D:/projects/rust/openclaw-ins/.opencode/get-shit-done/workflows/execute-plan.md
@D:/projects/rust/openclaw-ins/.opencode/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/phases/11-openclaw-theme-redesign/11-CONTEXT.md
@.planning/phases/11-openclaw-theme-redesign/11-RESEARCH.md
</context>

<tasks>

<task type="auto">
  <name>Task 1: Build the app and check for errors</name>
  <files>src/index.css</files>
  <read_first>src/index.css</read_first>
  <action>
    Run `pnpm build` from the project root. If the build fails, fix any CSS or TypeScript errors caused by the theme changes.

    Common issues to watch for:
    - Invalid CSS custom property values
    - Missing semicolons in @theme block
    - Tailwind class names that don't resolve with new tokens

    If build succeeds, proceed to Task 2.
  </action>
  <acceptance_criteria>
    - `pnpm build` exits with code 0
    - No CSS errors in build output
    - No TypeScript errors in build output
  </acceptance_criteria>
  <verify>
    <automated>pnpm build</automated>
  </verify>
  <done>App builds successfully with new theme.</done>
</task>

<task type="auto">
  <name>Task 2: Final grep audit for hardcoded colors</name>
  <files>src/index.css</files>
  <read_first>src/index.css</read_first>
  <action>
    Run a comprehensive grep across the entire src/ directory for any remaining hardcoded light-theme colors:

    Search patterns (all should return 0 matches):
    - `bg-slate-` — old background colors
    - `text-slate-` — old text colors
    - `border-slate-` — old border colors
    - `bg-blue-` — old primary colors
    - `text-blue-` — old primary text
    - `border-blue-` — old primary borders
    - `bg-white` — hardcoded white backgrounds
    - `bg-gray-` — any gray backgrounds
    - `text-gray-` — any gray text

    If any matches found, report them and fix before completing.
  </action>
  <acceptance_criteria>
    - `grep -rn "bg-slate-\|text-slate-\|border-slate-\|bg-blue-\|text-blue-\|border-blue-\|bg-white\|bg-gray-\|text-gray-" src/` returns 0 matches
  </acceptance_criteria>
  <verify>
    <automated>grep -rn "bg-slate-\|text-slate-\|border-slate-\|bg-blue-\|text-blue-\|border-blue-\|bg-white\|bg-gray-\|text-gray-" src/ | wc -l | grep "^0$"</automated>
  </verify>
  <done>Zero hardcoded light-theme color references remain.</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Visual verification of dark theme</name>
  <what-built>Complete dark theme redesign — OpenClaw red (#ff5c5c) + black (#0e1015) palette</what-built>
  <how-to-verify>
    1. Run `pnpm tauri dev` to launch the app
    2. Verify the app background is dark (near-black #0e1015)
    3. Check the sidebar — should have dark background with red active indicator
    4. Check primary buttons — should be red (#ff5c5c) with white text
    5. Check text readability — body text should be light gray on dark background
    6. Check cards — should be slightly lighter dark (#161920) with visible borders
    7. Check focus states — tab through elements, focus rings should be red
    8. Check the Dashboard, Configure, Channels, and Settings pages for consistency
    9. Check that destructive/error alerts are visible (red)
    10. Verify scrollbars are styled dark (not bright white OS defaults)
  </how-to-verify>
  <resume-signal>Type "approved" or describe issues</resume-signal>
</task>

</tasks>

<verification>
Overall checks:
- [ ] `pnpm build` succeeds
- [ ] Zero hardcoded light-theme colors in src/
- [ ] Human visual verification passes
</verification>

<success_criteria>
- App builds cleanly with no errors
- No hardcoded light-theme colors remain anywhere in src/
- Visual verification confirms dark theme with red accents throughout
</success_criteria>

<output>
After completion, create `.planning/phases/11-openclaw-theme-redesign/11-03-SUMMARY.md`
</output>
