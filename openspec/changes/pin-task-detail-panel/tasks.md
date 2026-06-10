## 1. Constants and Storage Key

- [ ] 1.1 Add `DETAIL_PANEL_PINNED: "detail_panel_pinned"` to `STORAGE_KEYS` in `packages/client/src/constants/index.ts`. Add test for the new key in `index.storage-db.test.ts`. Implements FR1 of pin-task-detail-panel.

## 2. Hook: useDetailPanelPinned (TDD)

- [ ] 2.1 Write BDD feature file `packages/client/src/test/features/pin_detail_panel/pin_detail_panel_preference.feature` with scenarios: default is false, preference persists, corrupted value self-heals, hook returns tuple. Tag `@pin-task-detail-panel @FR1 @FR2 @FR8`.
- [ ] 2.2 Write step definitions `pin_detail_panel_preference.steps.ts` — RED phase: tests fail.
- [ ] 2.3 Implement `packages/client/src/hooks/useDetailPanelPinned.ts` using `usePreference<boolean>` — GREEN phase: tests pass.
- [ ] 2.4 Run mutation testing on `useDetailPanelPinned.ts` — target >= 95%.

## 3. i18n Keys

- [ ] 3.1 Add i18n keys to `ru.json` and `en.json`: `settings.detailPanelPinned`, `taskDetail.pin`, `taskDetail.unpin`, `taskDetail.emptyState`. Implements FR6, FR7, UX2 of pin-task-detail-panel.

## 4. TaskDetailPanel: Pin Button (TDD)

- [ ] 4.1 Write BDD feature file `packages/client/src/test/features/pin_detail_panel/pin_detail_panel_button.feature` with scenarios: pin button visible on desktop, hidden on mobile, toggles preference, shows correct icon. Tag `@pin-task-detail-panel @FR6 @NFR-A1 @NFR-R1`.
- [ ] 4.2 Write step definitions `pin_detail_panel_button.steps.ts` — RED phase.
- [ ] 4.3 Add pin/unpin button to `TaskDetailPanel.tsx` header between delete and close buttons. Use `Pin`/`PinOff` icons from lucide-react. Render only when `useIsDesktop()` is true. Wire to `useDetailPanelPinned` — GREEN phase.
- [ ] 4.4 Verify build passes (`pnpm run build`).

## 5. TaskPageLayout: Pinned Mode (TDD)

- [ ] 5.1 Write BDD feature file `packages/client/src/test/features/pin_detail_panel/pin_detail_panel_layout.feature` with scenarios: pinned with no task shows empty state, pinned with task shows detail panel, pinned mode ignored on mobile, unpinned hides detail column when no task. Tag `@pin-task-detail-panel @FR3 @FR4 @FR5`.
- [ ] 5.2 Write step definitions `pin_detail_panel_layout.steps.ts` — RED phase.
- [ ] 5.3 Modify `TaskPageLayout.tsx`: use `useDetailPanelPinned`, compute `showDetailColumn = isDesktop && (isDetailPanelPinned || isTaskSelected)`. When `showDetailColumn && !isTaskSelected`, render empty state placeholder. Always show resize handle when `showDetailColumn`. — GREEN phase.
- [ ] 5.4 Verify build passes (`pnpm run build`).

## 6. SettingsPage: Toggle (TDD)

- [ ] 6.1 Write BDD feature file `packages/client/src/test/features/pin_detail_panel/pin_detail_panel_settings.feature` with scenarios: toggle reflects current state, toggle changes preference. Tag `@pin-task-detail-panel @FR7`.
- [ ] 6.2 Write step definitions `pin_detail_panel_settings.steps.ts` — RED phase.
- [ ] 6.3 Add toggle switch to `SettingsPage.tsx` after "Panel always open" section, using same pattern. Wire to `useDetailPanelPinned` — GREEN phase.
- [ ] 6.4 Verify build passes (`pnpm run build`).

## 7. Verification

- [ ] 7.1 Run mutation testing scoped to `useDetailPanelPinned.ts` — verify >= 95%.
- [ ] 7.2 Run all BDD unit tests for `pin_detail_panel` features — verify all pass.
- [ ] 7.3 Run full build (`pnpm run build`) — verify no errors.
