---
phase: quick
plan: 260328-hqt
type: execute
wave: 1
depends_on: []
files_modified:
  - src-tauri/icons/*
autonomous: true
requirements: []
user_setup: []
---

<objective>
Replace default Tauri icons with the custom `public/icon.png` for app icon, window icon, and installer icon.
</objective>

<context>
The app currently uses default Tauri scaffold icons in `src-tauri/icons/`. The user has a custom icon at `public/icon.png`. Tauri CLI has a built-in `tauri icon` command that generates all required platform icon sizes from a single source PNG.
</context>

<tasks>

<task type="auto">
  <name>Generate all icon sizes from custom icon.png</name>
  <files>src-tauri/icons/*</files>
  <action>
Run `pnpm tauri icon public/icon.png` which:
1. Reads the source `public/icon.png`
2. Generates all required sizes: 32x32, 128x128, 128x128@2x, icon.ico, icon.icns, and Windows Store logos
3. Outputs to `src-tauri/icons/` (default location next to tauri.conf.json)
4. Overwrites existing default Tauri icons

No manual file copying needed — the Tauri CLI handles everything including .ico and .icns generation.
  </action>
  <verify>
    <automated>ls src-tauri/icons/</automated>
    Verify: icon.png is no longer the default Tauri logo (file size should differ from original default), and all expected icon files exist.
  </verify>
  <done>
    All icons in src-tauri/icons/ are generated from the custom public/icon.png. The app, window title bar, and installer will show the custom icon.
  </done>
</task>

</tasks>
