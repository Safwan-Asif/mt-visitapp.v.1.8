# Implementation Plan: 2026 iOS Dynamic Island Ready State in POSM Review

## Overview
When the background AI/n8n analysis for a bay finishes (`status === 'done'`), update the POSM Review preview canvas on Web and Tablet viewports. Specifically, stop the laser rod scanning animation, smoothly unblur the photo, and display a high-fidelity 2026 iOS Dynamic Island morphing pill with a pulsing checkmark and ready metrics.

---

## User-Confirmed Requirements
1. **Image Transition**: Smoothly unblur the preview image (`blur-[4px]` &rarr; `blur-0`) with a subtle pulse/spring effect when analysis completes.
2. **Animation Stop**: Cease the sweeping laser rod and scanning ambient tint once `status === 'done'`.
3. **2026 Modern iOS Ready Element**:
   - Centered **Dynamic Island morphing pill** (`bg-black/90 backdrop-blur-2xl border border-emerald-400/60 rounded-full shadow-2xl`).
   - Left: Animated glowing emerald badge with an iOS-style pulsing checkmark.
   - Middle: High-tech copy: **"Analysis Complete &bull; [Bay Label]"** and detected SKU/facing summary.
   - Right: Modern micro status pill indicating **"Ready for Review"**.
4. **Bay Switcher Sync**: If the user switches between multiple bays in POSM Review, each bay accurately reflects its own state (in-flight scanning vs. completed ready state).
5. **Guidance Hint**: Update the bottom canvas pill to an iOS-style prompt: **"Results ready &bull; Submit POSM to view facings &amp; bounding boxes"**.

---

## Proposed Changes

### 1. `src/index.css`
- Add modern CSS keyframes for iOS Dynamic Island fluid morphing entrance:
  - `@keyframes dynamicIslandExpand`: fluid spring scale from `scale(0.85)` to `scale(1)` with subtle overshoot.
  - `@keyframes pulseCheckGlow`: gentle radial emerald glow pulse around the ready checkmark icon.

### 2. `src/components/CameraWorkflowScreen.tsx`
- In the right-hand Web/Tablet POSM Review panel (`{step === 'POSM' && ...}`):
  - Check the active bay session state: `const isBayDone = targetBaySession?.status === 'done';`
  - **Image Rendering**: Apply `transition-all duration-700 ease-out` with conditional `isBayDone ? 'blur-0 scale-100' : 'blur-[4px] scale-[1.02]'`.
  - **Scanning Animation**: Conditionally render the sweeping laser rod and scanning grid overlay only when `!isBayDone` (and `targetBaySession?.status !== 'error'`).
  - **Dynamic Island Morphing Pill**:
    - When `isBayDone`: render the floating iOS pill at the top of the canvas with smooth animation, animated checkmark, bay label, total facings detected, and "Ready for Review" badge.
    - When in-flight: retain the active scanning pill (`AI Scanning • Bay X`).
  - **Corner Reticles**:
    - When in-flight: sweeping emerald corner brackets.
    - When done: settle into solid, locked precision target corners with a soft glow.
  - **Bottom Dock Guidance**:
    - When `isBayDone`: show modern pill with a sparkle icon: *"Analysis ready &bull; Submit POSM below to reveal detections"*.

---

## Verification Plan

### Automated Build & Lint Verification
1. Run `compile_applet` and `lint_applet` to confirm zero TypeScript or Tailwind syntax errors.
2. Dev server restart to ensure hot module reload is active.

### Browser & Interactive Verification
1. Navigate to Camera Workflow &rarr; Capture Bay 1 &rarr; click **Upload Bay 1** &rarr; click **Continue to POSM**.
2. Observe POSM Review on Web/Tablet view:
   - While in-flight: the 4px blur and vertical sweeping emerald laser rod animate continuously.
   - Once n8n / AI returns result (`status === 'done'`):
     - Laser rod stops smoothly.
     - Preview image transitions from 4px blur to crisp unblurred image.
     - iOS Dynamic Island pill animates in with glowing pulsing checkmark, bay name, and detected facings.
     - Corner reticles lock into precision corners.
3. Test multi-bay switching (Bay 1 vs Bay 2) to verify independent state transitions per bay.
4. Verify both Light and Dark modes.
