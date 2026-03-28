# Quick Task 260328-hqt: Replace App Icons — Summary

**Date:** 2026-03-28
**Status:** Complete

## What Changed

Replaced default Tauri scaffold icons with custom ClawStation icon from `public/icon.png`.

### Process
1. Source image was 1177x1280 (non-square) — created square 1280x1280 version with transparent padding
2. Ran `pnpm tauri icon public/icon-square.png` to generate all platform icon sizes
3. Generated: 32x32, 64x64, 128x128, 128x128@2x, icon.ico (Windows), icon.icns (macOS), Windows Store logos, iOS icons, Android icons

### Files Modified
- `src-tauri/icons/*` — All 16+ icon files regenerated from custom source
- `public/icon-square.png` — Intermediate square version (can be cleaned up)

### Effect
- App window title bar icon → custom ClawStation icon
- Windows installer (.msi) → custom icon
- Linux AppImage → custom icon
- Taskbar/dock → custom icon
- Windows Store logos → custom icon
