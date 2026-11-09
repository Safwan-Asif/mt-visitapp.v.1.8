# Implementation Plan - Responsive Dual-Mode UI: Desktop/Tablet Split Layout & Zero-Scroll Mobile Experience

## 1. Problem Statement & User Requirements
- **Mobile Experience**: Current mobile screens suffer from awkward scrolling, cramped buttons, and hidden controls across varied iPhone and Android aspect ratios.
- **Desktop/Tablet Web App**: Currently constrained to `max-w-md` (phone column) in the browser, wasting wide screens. It must display as a unified single-screen split interface: controls and data on the left, camera and shelf photo preview on the right.
- **Clarified Architecture Choices**:
  1. **Web & Tablet screens**: Split two-column layout (Controls on Left, Camera / Photo Preview on Right).
  2. **Mobile phones (iOS & Android)**: Strict `100dvh` zero-scroll viewport with thumb-zone primary buttons; secondary settings, manual brand additions, and overlap diagnostics tucked into collapsible sheets.
  3. **Results screen on mobile**: Strict 60% top photo preview (with interactive bottle box toggles and seam lines) and 40% bottom scrollable brand facings list with sticky final save action bar.

---

## 2. Layout Architecture by Form Factor

### A. Mobile Phone Layout (`< md`, width < 768px)
- **Viewport Constraints**: Height locked to `h-[100dvh] max-h-[100dvh] overflow-hidden` with safe-area padding (`pb-[env(safe-area-inset-bottom)]`).
- **Capture Step**:
  - Top: Slim header (Category, Bay label, Level badge).
  - Center: Full uncropped viewfinder (`object-contain`) with ghost alignment guide.
  - Bottom: Thumb-friendly docked shutter bar (Height ~64px): Primary Shutter (`Shoot Bay N`) + Gallery button + Shelf Complete button.
  - Pre-upload Review: Full `100dvh` modal overlay with draggable seam handle, Retake, Check overlay, and Upload button pinned in the lower thumb zone.
- **POSM Step**:
  - Full-screen clean checklist with locked bottom `Proceed to Results` CTA.
- **Results Step**:
  - Top tab strip: `ALL | Bay 1 | Bay 2 ... + Add Bay`.
  - **Top 60%**: Photo / Stitched Panorama container with seam indicators, Red ✕ / Green bottle highlight toggles, Enlarge button, and Raw/AI toggle.
  - **Bottom 40%**: Scrollable brand facings cards (`flex-1 min-h-0 overflow-y-auto`) with quick +/- steppers, delta badges, and pinned bottom `Sync & Complete Visit` action bar.
  - **Collapsible Sheet**: Overlap seam summaries (`seamSummaries`) and secondary controls open in a clean slide-up drawer rather than pushing the page down.

### B. Desktop & Tablet Web Layout (`>= md`, width >= 768px)
- **Split Two-Column Grid**:
  - Container expands to `max-w-7xl w-full h-[calc(100dvh-60px)] mx-auto p-4 flex gap-6`.
  - **Left Pane (40-45% width, `flex flex-col h-full overflow-hidden bg-[#132219]/60 border border-emerald-900/60 rounded-3xl p-5`)**:
    - Header: Store & Category details, active bay selector, GPS & compliance indicators.
    - Middle:
      - *In Capture*: Bay queue, status of each bay (idle/analysing/done), POSM preview, shooting instructions.
      - *In Results*: Brand Facings table, SOS % share metrics, discrepancies, manual brand adder.
    - Bottom: Sticky primary actions (Shoot / Upload / Proceed to Results / Sync to Google Sheet).
  - **Right Pane (55-60% width, `flex flex-col h-full overflow-hidden bg-black rounded-3xl border border-emerald-900/60 relative p-2`)**:
    - *In Capture*: High-resolution camera feed with level gauge, ghost guide, and pre-upload seam adjuster.
    - *In Results*: Expansive high-definition panorama / bay photo canvas with full seam overlays and interactive bottle boxes.

---

## 3. Proposed Changes

### `src/components/CameraWorkflowScreen.tsx`
1. **Responsive Container Shell**:
   - Replace `<div className="flex-1 flex flex-col justify-between p-3.5 max-w-md mx-auto w-full h-full overflow-hidden select-none">` with responsive classes:
     - Mobile: `h-full w-full max-w-md mx-auto flex flex-col justify-between overflow-hidden p-2 sm:p-3`
     - Tablet/PC: `md:max-w-7xl md:flex-row md:items-stretch md:gap-4 md:p-4`
2. **Step 1: Capture View**:
   - On Desktop/Tablet: Left panel houses bay progress list, manual bay picker, category specs, and capture trigger buttons; Right panel displays the live viewfinder or the pre-upload seam inspection canvas.
   - On Mobile: Standard 100dvh viewfinder with thumb-friendly bottom shutter dock.
3. **Step 2: POSM View**:
   - Split view on desktop (POSM checklist left, bay photo thumbnail right); mobile single-screen clean checklist.
4. **Step 3: Results View**:
   - Mobile: Strict 60/40 height split (`h-[58%] shrink-0` for photo canvas, `flex-1 min-h-0 overflow-y-auto` for brand facings list).
   - Desktop/Tablet: Left panel has the scrollable brand facings table, share stats, and Google Sheets submission; Right panel displays the widescreen stitched panorama or selected bay photo.
5. **Mobile Collapsible Sheet for Overlap Details**:
   - Convert the inline accordion into an unobtrusive collapsible drawer/sheet that overlays cleanly without pushing layout elements off-screen.

### `src/App.tsx`
- Ensure `<main className="flex-1 overflow-hidden relative flex flex-col z-10">` provides unrestricted width to `CameraWorkflowScreen` on desktop while maintaining full viewport height.

---

## 4. Verification & Testing Plan
1. **Mobile Testing (Emulated iPhone 14/15, Pixel 7, SE)**:
   - Verify zero vertical outer-page scroll on 100dvh viewport.
   - Verify shutter button, gallery button, and upload buttons are reachable in the bottom thumb zone.
   - In Results, verify photo occupies top ~60% and brand list scrolls independently within bottom ~40%.
2. **Tablet & Desktop Web Testing (iPad Air, 1080p Desktop)**:
   - Verify two-column split layout activates automatically at `md:` breakpoint (768px+).
   - Left side: Controls, brand facings, and action buttons.
   - Right side: Camera feed / photo preview / stitched panorama.
3. **Compilation & Linting**:
   - Execute `compile_applet` and `lint_applet` together to verify 0 errors.
