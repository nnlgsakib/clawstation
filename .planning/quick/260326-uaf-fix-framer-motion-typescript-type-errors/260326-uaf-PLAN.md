---
id: 260326-uaf
mode: quick
date: 2026-03-26
status: complete
---

# Quick Task 260326-uaf: Fix framer-motion TypeScript type errors

## Problem

`pnpm tauri build` fails with 2 TypeScript errors:

1. **button.tsx:55** — React's `ButtonHTMLAttributes` event handlers (onDrag, onAnimationStart, etc.) are incompatible with framer-motion's `HTMLMotionProps` equivalents. The union type `Slot | motion.button` compounds this.
2. **layer-progress.tsx:49** — `transition.type: "spring"` is inferred as `string` instead of the literal `"spring"`, failing `Variants` type.

## Tasks

### Task 1: Fix button.tsx type conflict

**Files:** `src/components/ui/button.tsx`

**Action:** Split the `Slot | motion.button` union into explicit JSX branches. Omit drag/animation handlers from `ButtonProps` interface. Cast props with `as any` for the motion.button spread (React HTML attributes and motion event handler signatures are fundamentally incompatible).

**Verify:** `pnpm build` succeeds

### Task 2: Fix layer-progress.tsx transition type

**Files:** `src/components/ui/layer-progress.tsx`

**Action:** Add `as const` to `transition.type: "spring"` so TypeScript infers the literal type instead of `string`.

**Verify:** `pnpm build` succeeds

## must_haves

- truths: TypeScript compiles without errors
- artifacts: button.tsx, layer-progress.tsx
- key_links: motion/react Variants type, React ButtonHTMLAttributes
