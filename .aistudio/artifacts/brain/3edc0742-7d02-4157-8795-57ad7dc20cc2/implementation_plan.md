# Implementation Plan - AI Scanning Blur & Interactive Action Buttons

Enhance the uploaded photo canvas with a medium 4px blur, high-contrast emerald laser rod scanning beam animation, and corner target reticles, paired with clean 50/50 action buttons.

---

## Visual & Functional Requirements

1. **Scanned Photo Canvas (`isUploaded` state)**:
   - **Medium Blur**: Apply a `blur-[4px]` CSS class to the captured photo image element.
   - **Emerald Laser Rod Beam**: An animated horizontal beam line with a glowing drop-shadow trail sweeping up and down across the blurred image.
   - **Corner Target Reticles**: Add 4 glowing emerald corner brackets (`border-t-2 border-l-2`, etc.) giving the canvas a futuristic AI targeting frame look.
   - **AI Scanning Badge**: Display a top badge with a pulsing radar indicator ("AI Scanning Bay [X]...").
   - **No Annotations**: Explicitly omit bounding box annotations and raw detection counts during this phase.

2. **Interactive 50/50 Action Deck**:
   - **`Continue to POSM`** (50% width): Primary action button with check icon. Proceeds to Step 2 POSM compliance form.
   - **`Add One More Bay`** (50% width): Interactive secondary button with plus icon. Launches camera for Bay 2 with ghost guide overlay.

---

## Proposed Changes

### `src/components/CameraWorkflowScreen.tsx`

- **Canvas Container Updates**:
  - Add `blur-[4px]` filter to the `<img>` element when `aisleSessions[currentAisle]?.capturedPhotoUrl` is present and `!pendingCapture`.
  - Add corner target reticles in absolute positions (`top-3 left-3`, `top-3 right-3`, `bottom-3 left-3`, `bottom-3 right-3`).
  - Update keyframe animation `scanLaser` for a high-contrast glowing emerald laser rod beam (`h-2 bg-gradient-to-r from-emerald-500 via-emerald-300 to-emerald-500 shadow-[0_0_25px_#10B981]`).

---

## Verification Plan

### Automated Build & Lint Check
1. Co-execute `compile_applet` and `lint_applet` to verify TypeScript types and syntax.
2. Restart the dev server with `restart_dev_server`.

### Manual Workflow Check
1. Snap or select a photo for Bay 1.
2. Tap "Upload Bay 1".
3. Verify the photo card displays the **4px blur**, **emerald laser rod beam animation**, and **corner reticles** with no bounding box annotations.
4. Verify the two buttons (**`Continue to POSM`** and **`Add One More Bay`**) render as a clean 50/50 row.
5. Tap **`Add One More Bay`** and verify it opens Bay 2 camera with the ghost guide overlay.
