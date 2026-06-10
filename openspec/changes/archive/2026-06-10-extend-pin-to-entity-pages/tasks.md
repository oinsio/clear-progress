# Implementation Tasks: Extend Pin Functionality to Entity Detail Pages

## 1. EntityDetailLayout Integration

- [x] 1.1 Add `useDetailPanelPinned` import and hook call in `EntityDetailLayout.tsx`. Implements FR1 of extend-pin-to-entity-pages.
- [x] 1.2 Replace `isDesktop && selectedTask` with `showDetailColumn = isDesktop && (isDetailPanelPinned || selectedTask)` for detail column visibility logic. Implements FR1 of extend-pin-to-entity-pages.
- [x] 1.3 Add empty state placeholder block (copy from `TaskPageLayout.tsx`) with condition `showDetailColumn && !selectedTask`. Implements FR2 of extend-pin-to-entity-pages.
- [x] 1.4 Update resize handle render condition to use `showDetailColumn` instead of `selectedTask`. Implements FR3 of extend-pin-to-entity-pages.
- [x] 1.5 Verify build passes (`pnpm run build`).

## 2. GoalDetailPage Integration

- [x] 2.1 Add `useDetailPanelPinned` import and hook call in `GoalDetailPage.tsx`. Implements FR4 of extend-pin-to-entity-pages.
- [x] 2.2 Replace `selectedTask` condition with `showDetailColumn = isDesktop && (isDetailPanelPinned || selectedTask)` for detail column visibility logic. Implements FR4 of extend-pin-to-entity-pages.
- [x] 2.3 Add empty state placeholder block (copy from `TaskPageLayout.tsx`) with condition `showDetailColumn && !selectedTask`. Implements FR5 of extend-pin-to-entity-pages.
- [x] 2.4 Update resize handle render condition to use `showDetailColumn` instead of `selectedTask`. Implements FR6 of extend-pin-to-entity-pages.
- [x] 2.5 Verify build passes (`pnpm run build`).

## 3. Manual Verification

- [x] 3.1 Open CategoryDetailPage (`/categories/:id`) → select task → verify pin button visible and functional. Implements FR7, NFR-A1 of extend-pin-to-entity-pages.
- [x] 3.2 On CategoryDetailPage → pin panel → deselect task → verify empty state placeholder visible, resize handle present. Implements FR1, FR2, FR3 of extend-pin-to-entity-pages.
- [x] 3.3 Open ContextDetailPage (`/contexts/:id`) → select task → verify pin button visible and functional. Implements FR7, NFR-A1 of extend-pin-to-entity-pages.
- [x] 3.4 On ContextDetailPage → pin panel → deselect task → verify empty state placeholder visible, resize handle present. Implements FR1, FR2, FR3 of extend-pin-to-entity-pages.
- [x] 3.5 Open GoalDetailPage (`/goals/:id`) → select task → verify pin button visible and functional. Implements FR7, NFR-A1 of extend-pin-to-entity-pages.
- [x] 3.6 On GoalDetailPage → pin panel → deselect task → verify empty state placeholder visible, resize handle present. Implements FR4, FR5, FR6 of extend-pin-to-entity-pages.
- [x] 3.7 Pin panel in settings → navigate to CategoryDetailPage → verify panel already pinned. Verifies UX2 of extend-pin-to-entity-pages.
- [x] 3.8 On mobile viewport → open any entity detail page with pinned panel → verify pinned mode ignored (fullscreen on task selection). Implements NFR-R1 of extend-pin-to-entity-pages.

## 4. Final Verification

- [x] 4.1 Run full build (`pnpm run build`) — verify no errors. Implements NFR-P1 of extend-pin-to-entity-pages.
- [x] 4.2 Test pin button on all 4 page types (task pages, goal detail, category detail, context detail) — verify consistent behavior. Verifies M1 of extend-pin-to-entity-pages.
- [x] 4.3 Pin panel → navigate between different page types → verify pinned state persists. Verifies M2 of extend-pin-to-entity-pages.
- [x] 4.4 Pin panel → deselect task on each entity page type → verify empty state displays correctly. Verifies M3 of extend-pin-to-entity-pages.
