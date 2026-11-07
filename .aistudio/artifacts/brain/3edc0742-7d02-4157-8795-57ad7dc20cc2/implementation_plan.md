# Implementation Plan - Cross-Bay Duplicate Detection for Overlapping Shelf Photos

## 1. Overview & Objective
When merchandising reps scan supermarket categories across multiple adjacent shelf bays (e.g., Bay 1 $\to$ Bay 2 $\to$ Bay 3), cameras inevitably overlap at the seams. A bottle detected at the right edge of Bay $N$ is also captured and detected at the left edge of Bay $N+1$. Since computer vision analysis operates per photo, these overlapping detections artificially inflate facing counts.

This plan implements **Cross-Bay Duplicate Detection** in `CameraWorkflowScreen.tsx`, running once immediately upon entering `RESULTS` (before panorama generation and compliance comparisons). Reps are notified via a header chip, review the detected overlaps grouped by bay and brand, and can confirm removal or keep all detections.

---

## 2. Technical Grounding: Webhook Bounding Box Coordinates

### Finding from Webhook Code
In `n8n-mt-visit-audit-workflow.json` (line 148, `Parse CV Output & Facing Counts`), the n8n JavaScript code transforms raw Roboflow predictions:
```javascript
const left = Math.round(pred.x - pred.width / 2);
const top = Math.round(pred.y - pred.height / 2);
const width = Math.round(pred.width);
const height = Math.round(pred.height);

boxes.push({
  id: `box-${index + 1}`,
  brand: matchedBrand,
  confidence: Number((pred.confidence || 0.99).toFixed(2)),
  x: left,
  y: top,
  width: width,
  height: height,
  ...
});
```

### Coordinate Determination
- `box.x` and `box.y` from the webhook are **top-left corners**, NOT centers.
- To perform accurate seam strip and vertical alignment comparisons, we calculate the geometric box center:
  $$\text{centerX} = \text{box.x} + \frac{\text{box.width}}{2}$$
  $$\text{centerY} = \text{box.y} + \frac{\text{box.height}}{2}$$
- This will be explicitly commented in the source code as required by the brief.

---

## 3. Tunable Threshold Constants

At module level in `CameraWorkflowScreen.tsx`:

```typescript
/**
 * Cross-Bay Duplicate Detection Thresholds
 * 
 * STRIP_PCT: Defines the seam overlap boundary percentage (default: 0.10 or 10%).
 * - Compares the rightmost 10% of bay N against the leftmost 10% of bay N+1.
 * - Increase (e.g. to 0.15) if reps take heavily overlapping shots.
 * - Decrease (e.g. to 0.08) if shelves are wide and bays have minimal seam overlap.
 */
export const STRIP_PCT = 0.10;

/**
 * Y_TOLERANCE: Vertical alignment tolerance multiplier relative to bottle box height (default: 0.5).
 * - Matches if Math.abs(rightCenterY - leftCenterY) <= Math.max(rightBox.height, leftBox.height) * Y_TOLERANCE.
 * - Increase (e.g. to 0.65) if the camera tilt shifts between bay captures.
 * - Decrease (e.g. to 0.35) if products on adjacent shelf rows are closely packed vertically.
 */
export const Y_TOLERANCE = 0.50;
```

---

## 4. Detection Algorithm (`detectCrossBayDuplicates`)

### Function Signature
```typescript
export interface DuplicateMatch {
  boxId: string;
  brand: string;
  x: number;
  y: number;
  width: number;
  height: number;
  leftBayKey: string;
  leftBoxId: string;
}

export interface BayDuplicateReport {
  bayKey: string;
  bayLabel: string;
  duplicates: DuplicateMatch[];
  hasDuplicates: boolean;
}

export function detectCrossBayDuplicates(
  aisleSessions: Record<string, AisleSession>
): Record<string, BayDuplicateReport>;
```

### Algorithm Steps
1. Sort captured bays in aisle order (`bay_1`, `bay_2`, `bay_3`, etc.).
2. For each adjacent pair $(\text{Bay}_i, \text{Bay}_{i+1})$:
   - Left Bay ($\text{Bay}_i$): Extract boxes whose $\text{centerX} \ge \text{width}_i \times (1 - \text{STRIP\_PCT})$.
   - Right Bay ($\text{Bay}_{i+1}$): Extract boxes whose $\text{centerX} \le \text{width}_{i+1} \times \text{STRIP\_PCT}$.
   - For each right-strip box, check if any left-strip box matches:
     1. Same brand: `canonicalizeBrand(rightBox.brand) === canonicalizeBrand(leftBox.brand)`.
     2. Vertical alignment:
        $$\lvert \text{rightCenterY} - \text{leftCenterY} \rvert \le \max(\text{rightBox.height}, \text{leftBox.height}) \times \text{Y\_TOLERANCE}$$
     3. Not already matched to another right-bay box (greedy 1-to-1 matching).
   - If matched, mark the box as a duplicate on the **right bay only**.
3. Return `Record<string, BayDuplicateReport>`.

---

## 5. Execution Lifecycle & Timing

1. **Trigger**: When `step === 'RESULTS'` is entered, before panorama building and before compliance totals are calculated:
   - Detection runs once on the completed aisle sessions.
   - Result is stored in `detectedDuplicates` state: `Record<string, BayDuplicateReport>`.
   - `duplicateReviewStatus` state: `'pending' | 'removed' | 'kept'`.
2. **Panorama & Compliance Ordering**:
   - Detection finishes synchronously.
   - Totals and primary share calculations take into account active duplicate removals.
   - Panorama building uses the active sessions.

---

## 6. UI & Rep Interaction

### A. Amber Header Chip
When any bay has detected duplicates and `duplicateReviewStatus === 'pending'`:
- Displays: `“⚠️ 2 overlapping detections on Bay 2”` (or combined count if across multiple bays).
- Amber badge with active bounce/scale, animated toggle to expand the review panel.

### B. Expansion Review Panel
Tapping the chip expands a floating/slide-down panel:
- **Grouped by Bay & Brand** (as confirmed in user clarification):
  - e.g. **Bay 2**: `YARA: 1 facing`, `ADEERA: 1 facing`.
- **Actions**:
  - **“Remove duplicates”**:
    - Subtracts duplicate counts from that bay's `counts` and `rawCounts`.
    - Updates bay `totalFacings`.
    - Tracks removed box IDs in `removedDuplicateBoxIds`.
    - Sets `duplicateReviewStatus = 'removed'`.
    - Recalculates combined totals, SOS %, and discrepancy log in place.
  - **“Keep all”**:
    - Leaves counts untouched.
    - Sets `duplicateReviewStatus = 'kept'` and collapses the panel.

### C. Shelf View Visualization
On the shelf photo view (when inspecting boxes or in fullscreen):
- Removed / duplicate boxes render with:
  - **Dimmed opacity** (`opacity-35`)
  - **Red strike-through line** across the box
  - A small `DUP` badge.

---

## 7. Audit Save & Reproducibility

In `handleFinalSave`:
- The saved `aisles` record includes `removedDuplicates`:
  ```typescript
  removedDuplicates: (s.removedDuplicates || []).map(d => ({
    boxId: d.boxId,
    brand: d.brand,
    x: d.x,
    y: d.y,
    width: d.width,
    height: d.height,
    leftBayKey: d.leftBayKey
  }))
  ```
- Any removed duplicates are **not** present in `counts` or `totalFacings`.
- Recorded metadata preserves the position and matching left bay so audits remain completely auditable and reproducible if strip percentages are adjusted later.

---

## 8. Verification & Test Plan
1. **Lint & Build**: Run `lint_applet` and `compile_applet`.
2. **Seam Detection Test**:
   - Verify that Bay 1 right strip ($x \ge 90\%$) and Bay 2 left strip ($x \le 10\%$) with identical brand and vertical proximity trigger duplicate detection on Bay 2 only.
   - Verify Bay 1 is not modified.
3. **User Action Test**:
   - Test "Remove duplicates": verify Bay 2 counts decrease by exact duplicate facings, Combined Total decreases, and saved audit contains `removedDuplicates`.
   - Test "Keep all": verify counts remain unchanged and chip collapses.
