---
id: 260326-v0s
date: 2026-03-26
status: complete
---

# Quick Task 260326-v0s: Improve Docker installation UX — Summary

## Changes

### 1. src-tauri/src/install/docker_install.rs
- Added `layerPercentage: u8` to `DockerLayerProgressEvent` — actual per-layer download progress
- Filtered log events: only emit "Verifying Checksum", "Download complete", "Extracting", "Pull complete", "Already exists" (not every "Downloading" tick)
- Shortened layer IDs in log output to 8 chars

### 2. src/hooks/use-docker-layer-progress.ts
- Accept new `layerPercentage` field from events
- Added `friendlyStatus()` function: "Downloading" → "Downloading", "Verifying Checksum" → "Verifying", "Download complete" → "Downloaded", "Extracting" → "Extracting", "Pull complete" → "Done", "Already exists" → "Cached"

### 3. src/components/ui/layer-progress.tsx
- Show status icons per layer (check, spinner, download)
- Split layers into active vs completed sections
- Show "X/Y layers complete" counter
- Use `layerPercentage` (actual per-layer progress) instead of `percentage` (overall mapped)

### 4. src/hooks/use-docker-logs.ts
- Added `lineCount` state for display
- Deduplicate consecutive identical log lines

### 5. src/components/ui/log-viewer.tsx
- Added sticky header with "Installation Log" title and event count
- Separated scroll container from header

### 6. src/components/install/step-install.tsx
- Added `InstallProgressBar` — visual step indicators showing 8 installation phases
- Changed layout from 3-col (2+1) to 2-col (equal) for log viewer + layer progress
- Reduced panel height from 96 to 80 (320px) for tighter fit

## Result

Docker installation now shows only meaningful log events (~10-20 lines instead of hundreds), actual per-layer download percentages with status icons, and a clear step progress bar.
