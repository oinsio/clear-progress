## 1. Constants and Types (FR13, FR16, FR19)

- [x] 1.1 Add `STORAGE_KEYS.HANDEDNESS` constant and `Handedness` type ("right" | "left") — FR13
- [x] 1.2 Add CommandBar constants: `COMMAND_BAR_CSS_VAR = "--command-bar-height"` — FR16
- [x] 1.3 Add i18n keys for CommandBar placeholders (task per box, goal, idea, context, category) in ru.json and en.json — FR19
- [x] 1.4 Run `pnpm run lint:fix` — all should pass
- [x] 1.5 Run `pnpm run preflight` — all should pass
- [x] 1.6 Run `pnpm run build` — build succeeds without errors

## 2. BDD Feature Files — Unit (FR1–FR21)

- [x] 2.1 Write `command_bar_core.feature`: render layout, entity icon, submit via button, submit via Enter, skip empty, skip whitespace, clear after submit, Enter does not insert newline — @command-bar @FR1 @FR2 @FR3 @FR4 @FR20 @FR21
- [x] 2.2 Write `command_bar_filter.feature`: collapsed/expanded states, box selection, collapse on textarea focus, outside click collapse, no filter when prop undefined — @command-bar @FR5 @FR6 @FR8 @FR9
- [x] 2.3 Write `command_bar_eye_toggle.feature`: active/inactive states, toggle callback, not rendered when undefined — @command-bar @FR7
- [x] 2.4 Write `command_bar_auto_grow.feature`: single-line compact, wrapped text grows, max-height scrolls, clearing resets, stacking on wrap, row on single-line, create button at bottom of stack — @command-bar @FR10 @FR11 @FR12 @FR15
- [x] 2.5 Write `command_bar_handedness.feature`: right-handed default, left-handed row-reverse, icon not mirrored, stack order unchanged — @command-bar @FR13 @FR14 @FR15
- [x] 2.6 Write `command_bar_placeholder.feature`: placeholder reflects specific filter box, placeholder reflects default box when "all", placeholder for non-task pages, placeholder updates on filter change — @command-bar @FR19
- [x] 2.7 Write `command_bar_position.feature`: fixed bottom with border-top, fixed top with border-bottom, CSS variable set/updated/reset, safe-area-bottom for iOS — @command-bar @FR16 @FR17 @FR18
- [x] 2.8 Write `handedness_preference.feature`: default right, persist left, invalid fallback to right — @command-bar @FR13, local-preferences spec

## 3. BDD Feature Files — E2E (NFR-A, NFR-R)

- [x] 3.1 Write `command_bar_a11y_e2e.feature`: aria-labels on all elements, aria-expanded on filter, aria-pressed on eye, keyboard focusable/activatable, textarea placeholder and role — @command-bar @NFR-A1 @NFR-A2 @NFR-A3 @NFR-A4 @NFR-A5
- [x] 3.2 Write `command_bar_responsive_e2e.feature`: full-width mobile 375px, constrained desktop 1440px, width with detail panel, position top/bottom on all viewports — @command-bar @NFR-R1 @NFR-R2 @NFR-R3 @NFR-R4

## 4. useHandedness Hook (FR13, local-preferences spec)

- [x] 4.1 Write BDD step definitions for `handedness_preference.feature` (RED) — local-preferences spec
- [x] 4.2 Implement `useHandedness` hook (read/write localStorage, default "right") (GREEN) — local-preferences spec
- [x] 4.3 Verify tests pass, refactor (CLEAN)
- [x] 4.4 Run `pnpm run lint:fix` — all should pass
- [x] 4.5 Run `pnpm run preflight` — all should pass
- [x] 4.6 Run `pnpm run build` — build succeeds without errors

## 5. useTargetBox Hook (FR19)

- [x] 5.1 Write unit tests for `useTargetBox(activeBox)`: specific box returns it, "all" returns user's default box (RED) — FR19
- [x] 5.2 Implement `useTargetBox(activeBox)` hook: resolves targetBox from filter (GREEN) — FR19
- [x] 5.3 Verify tests pass, refactor (CLEAN)
- [x] 5.4 Run `pnpm run lint:fix` — all should pass
- [x] 5.5 Run `pnpm run preflight` — all should pass
- [x] 5.6 Run `pnpm run build` — build succeeds without errors

## 6. useCommandBarResize Hook (FR16, NFR-P2)

- [x] 6.1 Write unit tests for `useCommandBarResize` (sets variable on mount, updates on resize, resets on unmount) (RED) — FR16, NFR-P2
- [x] 6.2 Implement `useCommandBarResize` hook: ResizeObserver on bar element, sets CSS variable on documentElement, throttled via rAF. Resets to "0px" on unmount (GREEN) — FR16, NFR-P2
- [x] 6.3 Verify tests pass, refactor (CLEAN)
- [x] 6.4 Run `pnpm run lint:fix` — all should pass
- [x] 6.5 Run `pnpm run preflight` — all should pass
- [x] 6.6 Run `pnpm run build` — build succeeds without errors

## 7. useTextareaAutoGrow Hook (FR10, FR12, NFR-P1)

- [x] 7.1 Write unit tests for `useTextareaAutoGrow` (single-line stays compact, wrapped text grows, max-height scrolls, clearing resets, no layout thrashing — single reflow per input) (RED) — FR10, FR12, NFR-P1
- [x] 7.2 Implement `useTextareaAutoGrow` hook: measures singleLineHeight on init, auto-resize logic with anti-oscillation (measure in row-mode), returns { textareaRef, isWrapped, singleLineHeight }. Single reflow per input event (GREEN) — FR10, FR12, NFR-P1
- [x] 7.3 Verify tests pass, refactor (CLEAN)
- [x] 7.4 Run `pnpm run lint:fix` — all should pass
- [x] 7.5 Run `pnpm run preflight` — all should pass
- [x] 7.6 Run `pnpm run build` — build succeeds without errors

## 8. CommandBar Component — Core (FR1, FR2, FR3, FR4, FR10, FR20, FR21)

- [x] 8.1 Write BDD step definitions for `command_bar_core.feature` (RED) — FR1, FR2, FR3, FR4, FR20, FR21
- [x] 8.2 Create `CommandBar` component with props interface: `{ filter?, eyeToggle?, entityIcon, placeholder, onSubmit }` — FR1
- [x] 8.3 Implement textarea with entity icon (position absolute left, accent color, padding-left for text) — FR2, FR3
- [x] 8.4 Implement create button (+) with accent background, white icon — FR4
- [x] 8.5 Integrate `useTextareaAutoGrow` for Telegram-style growth — FR10, UX1
- [x] 8.6 Implement submit logic: Enter key and + button both trigger submit. Trim, call onSubmit, clear textarea, return to single-line. Skip if empty/whitespace. Enter does NOT insert newline (GREEN) — FR10, FR20, FR21
- [x] 8.7 Verify BDD scenarios pass, refactor (CLEAN)
- [x] 8.8 Run `pnpm run lint:fix` — all should pass
- [x] 8.9 Run `pnpm run preflight` — all should pass
- [x] 8.10 Run `pnpm run build` — build succeeds without errors

## 9. CommandBar Component — Filter (FR5, FR6, FR8, FR9)

- [x] 9.1 Write BDD step definitions for `command_bar_filter.feature` (RED) — FR5, FR6, FR8, FR9
- [x] 9.2 Implement optional filter section: collapsed (active icon + chevron), expanded (all box icons) — FR5, FR6
- [x] 9.3 Implement filter selection: tap box, call onBoxChange, collapse — FR9
- [x] 9.4 Implement filter collapse on textarea focus — FR8
- [x] 9.5 Implement outside-click collapse for filter (existing pattern from BoxFilterBar)
- [x] 9.6 Verify BDD scenarios pass, refactor (GREEN → CLEAN)
- [x] 9.7 Run `pnpm run lint:fix` — all should pass
- [x] 9.8 Run `pnpm run preflight` — all should pass
- [x] 9.9 Run `pnpm run build` — build succeeds without errors

## 10. CommandBar Component — Eye Toggle (FR7)

- [x] 10.1 Write BDD step definitions for `command_bar_eye_toggle.feature` (RED) — FR7
- [x] 10.2 Implement optional eye toggle: Eye/EyeOff icons, accent/gray styling, aria-pressed (GREEN) — FR7
- [x] 10.3 Verify BDD scenarios pass, refactor (CLEAN)
- [x] 10.4 Run `pnpm run lint:fix` — all should pass
- [x] 10.5 Run `pnpm run preflight` — all should pass
- [x] 10.6 Run `pnpm run build` — build succeeds without errors

## 11. CommandBar Component — Stacking (FR11, FR12, FR15, UX2)

- [x] 11.1 Write BDD step definitions for stacking scenarios from `command_bar_auto_grow.feature` (RED) — FR11, FR12, FR15
- [x] 11.2 Implement eye + create button stacking: `flex-direction: column` when isWrapped, eye above create (GREEN) — FR11
- [x] 11.3 Verify BDD scenarios pass: row on single-line, column on wrapped, create button at bottom regardless of handedness, instant transition (CLEAN) — FR15, UX2
- [x] 11.4 Run `pnpm run lint:fix` — all should pass
- [x] 11.5 Run `pnpm run preflight` — all should pass
- [x] 11.6 Run `pnpm run build` — build succeeds without errors

## 12. CommandBar Component — Handedness (FR13, FR14, FR15, UX5)

- [x] 12.1 Write BDD step definitions for `command_bar_handedness.feature` (RED) — FR13, FR14, FR15
- [x] 12.2 Integrate `useHandedness` hook, apply `flex-direction: row-reverse` on bar and actions container (GREEN) — FR13
- [x] 12.3 Verify BDD scenarios pass: default layout, left-handed layout, icon not mirrored, stack order unchanged (CLEAN) — FR14, UX5
- [x] 12.4 Run `pnpm run lint:fix` — all should pass
- [x] 12.5 Run `pnpm run preflight` — all should pass
- [x] 12.6 Run `pnpm run build` — build succeeds without errors

## 13. CommandBar Component — Placeholder (FR19)

- [x] 13.1 Write BDD step definitions for `command_bar_placeholder.feature` (RED) — FR19
- [x] 13.2 Implement placeholder logic: integrate `useTargetBox`, compose placeholder from targetBox or entity type (GREEN) — FR19
- [x] 13.3 Verify BDD scenarios pass: specific filter, "all" filter with default box, entity pages, update on filter change (CLEAN)
- [x] 13.4 Run `pnpm run lint:fix` — all should pass
- [x] 13.5 Run `pnpm run preflight` — all should pass
- [x] 13.6 Run `pnpm run build` — build succeeds without errors

## 14. CommandBar Component — Position and Height (FR16, FR17, FR18)

- [x] 14.1 Write BDD step definitions for `command_bar_position.feature` (RED) — FR16, FR17, FR18
- [x] 14.2 Integrate `useFilterBarPosition` hook, apply fixed bottom/top positioning with border — FR18
- [x] 14.3 Integrate `useCommandBarResize` for CSS variable publishing — FR16
- [x] 14.4 Apply safe-area-bottom padding for iOS (bottom position only) — FR18
- [x] 14.5 Verify BDD scenarios pass (CLEAN)
- [x] 14.6 Run `pnpm run lint:fix` — all should pass
- [x] 14.7 Run `pnpm run preflight` — all should pass
- [x] 14.8 Run `pnpm run build` — build succeeds without errors

## 15. CommandBar Component — Accessibility (NFR-A1, NFR-A2, NFR-A3, NFR-A4, NFR-A5)

- [x] 15.1 Add aria-labels to all interactive elements (filter toggle, box buttons, eye toggle, create button, textarea) — NFR-A1
- [x] 15.2 Add aria-expanded to filter toggle — NFR-A2
- [x] 15.3 Add aria-pressed to eye toggle — NFR-A3
- [x] 15.4 Ensure keyboard accessibility: all buttons focusable and activatable — NFR-A4
- [x] 15.5 Add appropriate placeholder and role to textarea — NFR-A5
- [x] 15.6 Write BDD E2E step definitions for `command_bar_a11y_e2e.feature` — NFR-A1–A5
- [ ] 15.7 axe-core accessibility test for CommandBar in all configurations (minimal, full with filter+eye, left-handed) — NFR-A1–A5 (deferred: requires playwright-bdd setup)
- [x] 15.8 Run `pnpm run lint:fix` — all should pass
- [x] 15.9 Run `pnpm run preflight` — all should pass
- [x] 15.10 Run `pnpm run build` — build succeeds without errors

## 16. TaskPageLayout — Remove Toolbar Slots (FR17)

- [x] 16.1 Update TaskPageLayout unit tests: expect no toolbar slots, expect padding from CSS variable (RED) — FR17
- [x] 16.2 Remove `topToolbar`/`bottomToolbar` props from TaskPageLayout (GREEN)
- [x] 16.3 Add dynamic padding using `--command-bar-height` CSS variable (padding-bottom for bottom, padding-top for top position) (GREEN) — FR17
- [x] 16.4 Verify tests pass, refactor (CLEAN)
- [x] 16.5 Run `pnpm run lint:fix` — all should pass
- [x] 16.6 Run `pnpm run preflight` — all should pass
- [x] 16.7 Run `pnpm run build` — build succeeds without errors

## 17. Page Integration — Task Pages (FR1, FR19)

- [x] 17.1 Write unit tests for task pages with CommandBar: correct props, placeholder reflects targetBox, auto-link fields, CompletedPage has no CommandBar (RED) — FR1, FR19, task-page-layout spec
- [x] 17.2 ActiveTasksPage: replace BoxFilterBar + AddTaskInput with CommandBar (filter=4 boxes: today/week/later/all, eyeToggle, CheckSquare) (GREEN) — task-page-layout spec
- [x] 17.3 InboxPage: replace add button + AddTaskInput with CommandBar (no filter, eyeToggle, CheckSquare, placeholder "New task to inbox...") (GREEN) — task-page-layout spec
- [x] 17.4 GoalDetailPage: add CommandBar (filter=5 boxes incl. inbox, default: all, eyeToggle, CheckSquare, goal_id auto-link, targetBox logic) (GREEN) — FR19
- [x] 17.5 CategoryDetailPage: add CommandBar (filter=5 boxes, default: all, eyeToggle, CheckSquare, category_id auto-link, targetBox logic) (GREEN) — FR19
- [x] 17.6 ContextDetailPage: add CommandBar (filter=5 boxes, default: all, eyeToggle, CheckSquare, context_id auto-link, targetBox logic) (GREEN) — FR19
- [x] 17.7 Verify CompletedPage does NOT render CommandBar — task-page-layout spec
- [x] 17.8 Verify all task page tests pass (CLEAN)
- [x] 17.9 Run `pnpm run lint:fix` — all should pass
- [x] 17.10 Run `pnpm run preflight` — all should pass
- [x] 17.11 Run `pnpm run build` — build succeeds without errors

## 18. Page Integration — Entity Pages (FR1)

- [x] 18.1 Write unit tests for entity pages with CommandBar: correct icon, placeholder, no filter/eye (RED) — FR1
- [x] 18.2 GoalsPage: replace inline add with CommandBar (no filter, no eye, Target icon) (GREEN) — FR1
- [x] 18.3 IdeasPage: replace inline add with CommandBar (no filter, no eye, Lightbulb icon) (GREEN) — FR1
- [x] 18.4 CategoriesPage: replace inline add with CommandBar (no filter, no eye, Tag icon) (GREEN) — FR1
- [x] 18.5 ContextsPage: replace inline add with CommandBar (no filter, no eye, MapPin icon) (GREEN) — FR1
- [x] 18.6 Verify all entity page tests pass (CLEAN)
- [x] 18.7 Run `pnpm run lint:fix` — all should pass
- [x] 18.8 Run `pnpm run preflight` — all should pass
- [x] 18.9 Run `pnpm run build` — build succeeds without errors

## 19. Cleanup (M2)

- [x] 19.1 Remove BoxFilterBar component and its tests
- [x] 19.2 Remove AddTaskInput component and its tests
- [x] 19.3 Remove HiddenTasksToggle component (logic absorbed into CommandBar)
- [x] 19.4 Remove `useInlineAdd` hook if no longer used elsewhere
- [x] 19.5 Clean up unused imports across all modified files
- [x] 19.6 Run `pnpm run lint:fix` — all should pass
- [x] 19.7 Run `pnpm run preflight` — all should pass
- [x] 19.8 Run `pnpm run build` — build succeeds without errors

## 20. Responsive and Desktop (NFR-R1, NFR-R2, NFR-R3, NFR-R4)

- [x] 20.1 Write BDD E2E step definitions for `command_bar_responsive_e2e.feature` (RED) — NFR-R1–R4
- [x] 20.2 Implement full-width on mobile, max-width + centering on desktop (GREEN) — NFR-R1, NFR-R2
- [x] 20.3 Write BDD E2E step definitions for `command_bar_responsive_e2e.feature` — NFR-R1–R4
- [x] 20.4 Run `pnpm run lint:fix` — all should pass
- [x] 20.5 Run `pnpm run preflight` — all should pass
- [x] 20.6 Run `pnpm run build` — build succeeds without errors

## 21. Settings UI (FR13, FR18)

- [x] 21.1 Write unit test: handedness toggle persists value and updates layout (RED) — FR13
- [x] 21.2 Add handedness toggle to Settings page (right/left with preview) (GREEN) — FR13
- [x] 21.3 Verify existing filter bar position setting works with CommandBar — FR18
- [x] 21.4 Verify tests pass (CLEAN)
- [x] 21.5 Run `pnpm run lint:fix` — all should pass
- [x] 21.6 Run `pnpm run preflight` — all should pass
- [x] 21.7 Run `pnpm run build` — build succeeds without errors

## 22. Final Verification (M1, M2, M3, M4)

- [x] 22.1 Run full Vitest suite (`pnpm run test`), fix any failures — M3 (5079 tests, all pass)
- [x] 22.2 Run BDD E2E tests (`pnpm test:bdd`): bddgen conflict fixed, generation succeeds — M3
- [ ] 22.3 Mutation testing on CommandBar hooks and component (target >=95%, minimum acceptable >=90%) — M4 (requires manual run by user)
- [x] 22.4 Verify all 9 pages render CommandBar correctly (M1): tasks, inbox, goals, ideas, categories, contexts, goal-detail, category-detail, context-detail
- [x] 22.5 Verify BoxFilterBar, AddTaskInput, HiddenTasksToggle are fully removed (M2)
- [x] 22.6 Run `pnpm run lint:fix` — all should pass
- [x] 22.7 Run `pnpm run preflight` — all should pass
- [x] 22.8 Run `pnpm run build` — build succeeds without errors
