---
id: 260326-uaf
date: 2026-03-26
status: complete
---

# Quick Task 260326-uaf: Fix framer-motion TypeScript type errors — Summary

## Changes

### 1. src/components/ui/button.tsx
- Split `Slot | motion.button` union into explicit conditional JSX branches
- Omitted conflicting drag/animation event handler types from `ButtonProps` interface
- Used `as any` cast on props spread to motion.button (React HTML event handlers and motion gesture event handlers have fundamentally incompatible signatures)

### 2. src/components/ui/layer-progress.tsx
- Added `as const` to `transition.type: "spring"` to fix literal type inference for Variants

## Result

`pnpm build` passes cleanly — TypeScript compiles and Vite builds successfully.
