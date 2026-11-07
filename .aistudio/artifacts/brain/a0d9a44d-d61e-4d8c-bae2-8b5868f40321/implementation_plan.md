# Multi-Aisle Shelf Audit & Aisle Counter (1–4)

A streamlined, mobile-first multi-aisle auditing workflow for Qatar Food Industries merchandisers to audit 1 to 4 distinct aisles/bays per category (stored cleanly as `aisle1`, `aisle2`, `aisle3`, `aisle4`) with independent sessions and aggregated category facing totals.

## User Review & Critical Decisions

> [!IMPORTANT]
> Merchandiser choices confirmed during clarification:
> - **Count Aggregation**: Facings across all captured aisles will combine into a unified total count and Share of Shelf (SOS) percentage for the final category audit, with per-aisle breakdowns preserved.
> - **Select Aisle Counter UI**: A clean, top segmented button control (Aisle 1, 2, 3, 4) with active indicators and status dots (e.g. captured vs pending) placed prominently at the top of the camera workflow.

- **Confirmed Decision 1**: Store each aisle's capture state independently under keys `aisle1`, `aisle2`, `aisle3`, `aisle4`, including photo URL, annotated image URL, raw file, bounding boxes, and detected/manual counts.
- **Confirmed Decision 2**: Provide seamless one-tap switching between aisles before finalizing, with instant feedback on which aisles have been captured.
- **Confirmed Decision 3**: Keep the UI super simple, uncluttered, and touch-optimized with $\ge 44\text{px}$ touch hitboxes and no confusing instruction labels.

---

## 1. Overview & Core Concept

- **What It Does**: Enables field merchandisers visiting hypermarkets and large supermarkets (e.g. LuLu, Carrefour, Al Meera) with multiple physical aisles or end-cap bays for a single category (Flour, Edible Oil, Pasta) to audit up to 4 aisles in one category visit. Merchandisers can snap photos for Aisle 1, switch to Aisle 2, capture Aisle 3 or 4, audit or adjust counts per aisle, and review both individual aisle details and the combined category totals before saving to Google Sheets and local storage.
- **Target Audience / Persona**: QFI Modern Trade field merchandisers holding smartphones in fast-paced retail aisles.
- **Key Value**: Eliminates data loss from multi-aisle hypermarkets where a single photo previously missed 50–75% of shelf facings, while ensuring zero friction or extra cognitive load.

---

## 2. User Experience & Visual Design

- **Aisle Counter Control**:
  - Located in the top bar directly under the category header.
  - Segmented 4-button strip: `Aisle 1`, `Aisle 2`, `Aisle 3`, `Aisle 4`.
  - Visual status per aisle button:
    - *Active Selected*: Solid brand accent highlight with clear outline.
    - *Captured / Audited*: Subtle checkmark icon or soft green indicator showing photo and counts are captured.
    - *Empty / Uncaptured*: Ghost state ready for capture.
- **Streamlined Capture & Switch Flow**:
  1. Merchandiser enters category audit (defaults to `Aisle 1`).
  2. Snaps photo or selects sample for Aisle 1; image is stored under `aisle1` and sent for analysis.
  3. Merchandiser can tap `Aisle 2` at any time to capture the second aisle or end-cap bay.
  4. At the Results screen, an Aisle View Switcher (`All Aisles (Combined)` | `Aisle 1` | `Aisle 2` | ...) allows toggling between inspecting individual aisle photos/facings and reviewing the combined category sum.
  5. One-tap "Save Category Audit" finalizes all captured aisles together.
- **Ergonomics & Anti-Slop Discipline**:
  - Minimum touch target $\ge 44\text{px}$ for each aisle selector button.
  - Zero pill clumping and zero verbose instruction banners.
  - Clean numeric badges displaying facing sums without mechanical syntax.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Data Storage Structure (`aisle1` - `aisle4`)**:
  - *Chosen Approach*: Maintain a typed dictionary `Record<'aisle1' | 'aisle2' | 'aisle3' | 'aisle4', AisleAuditSession>` in state and serialize into the category audit record.
  - *Why*: Direct compliance with user requirement (`aisle1`, `aisle2`, etc.), zero migration conflicts, and transparent debugging in Google Sheets sync.
- **Decision 2: Asynchronous AI Processing Per Aisle**:
  - *Chosen Approach*: Each aisle session manages its own analysis lifecycle (`idle`, `processing`, `completed`, `error`). Switching to Aisle 2 while Aisle 1 is processing does not cancel or overwrite Aisle 1's analysis.
  - *Why*: Lets the merchandiser walk to the next aisle and snap the next photo without being blocked waiting for the network roundtrip.
- **Decision 3: Category Finalization & Google Sheets Sync**:
  - *Chosen Approach*: Sum the counts across all active/captured aisles for the primary `totalFacings` and brand facings in Google Sheets, while embedding the multi-photo URLs and per-aisle breakdown in the audit details.
  - *Why*: Keeps existing analytics and Google Sheets reporting functional while adding full multi-aisle traceability.

---

## 4. Technical Architecture & Data Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                   CameraWorkflowScreen                      │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │   [ Aisle 1 ✓ ]   [ Aisle 2 (Active) ]   [ 3 ]   [ 4 ] │  │  <-- Top Select Aisle Counter
│  └───────────────────────────────────────────────────────┘  │
│                              │                              │
│       ┌──────────────────────┴──────────────────────┐       │
│       ▼                                             ▼       │
│  ┌─────────────────────────┐             ┌────────────────┐ │
│  │   Active Aisle Session   │             │   Session Map   │ │
│  │ • Current Photo / File  │  Syncs to   │ • aisle1       │ │
│  │ • AI Status & Progress  │ <---------> │ • aisle2       │ │
│  │ • Bounding Boxes        │             │ • aisle3       │ │
│  │ • Counts (Brand: Num)   │             │ • aisle4       │ │
│  └─────────────────────────┘             └────────────────┘ │
│                              │                              │
│                              ▼                              │
│             ┌─────────────────────────────────┐             │
│             │   Results & Aggregation Layer   │             │
│             │ • Combined Total Facings        │             │
│             │ • Brand Sum Across All Aisles   │             │
│             │ • Category Share of Shelf (SOS) │             │
│             └─────────────────────────────────┘             │
│                              │                              │
│                              ▼                              │
│             ┌─────────────────────────────────┐             │
│             │ Save Category Audit -> Storage  │             │
│             │ & Google Sheet / Drive Sync     │             │
│             └─────────────────────────────────┘             │
└─────────────────────────────────────────────────────────────┘
```

### State Model Additions:
```typescript
export type AisleKey = 'aisle1' | 'aisle2' | 'aisle3' | 'aisle4';

export interface AisleAuditSession {
  key: AisleKey;
  label: string; // "Aisle 1", "Aisle 2", etc.
  capturedFile: File | null;
  capturedPhotoUrl: string | null;
  annotatedPhotoUrl: string | null;
  counts: Record<string, number>;
  originalAiCounts: Record<string, number>;
  totalFacings: number;
  aiProgress: number;
  aiFinished: boolean;
  n8nStatus: any | null;
  boundingBoxes: any[];
}
```

### Verification & Testing Plan:
1. Switch across all 4 aisles (1–4) without capture to verify empty states.
2. Capture Aisle 1, verify image stored in `aisle1` and counts extracted.
3. Switch to Aisle 2, capture Aisle 2, verify independent session stored in `aisle2`.
4. Review Results screen: verify `All Aisles` shows combined sums and each individual aisle can be inspected.
5. Verify `npm run build` / `compile_applet` succeeds with 0 lint and TypeScript errors.
