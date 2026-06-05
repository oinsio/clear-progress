## 1. View Mode Layout Recomposition

- [ ] 1.1 Refactor view-mode JSX in `GoalDetailPage.tsx` to three-row layout: row 1 (cover + status badge + actions), row 2 (name), row 3 (description). Add i18n keys if needed. (FR5)
- [ ] 1.2 Unit tests for layout structure: verify three-row layout renders correctly with all elements, two-row when no description, edit mode unchanged. (FR5)

## 2. Collapsible Description

- [ ] 2.1 Implement collapsible description logic in view mode: `line-clamp-2`, overflow detection via `useRef` + `useLayoutEffect` + `ResizeObserver`, toggle state, chevron icon (ChevronDown/ChevronUp from lucide-react). (FR3, FR4, UX3, UX4)
- [ ] 2.2 Add `aria-expanded` and `aria-label` to toggle icon button. (NFR-A1)
- [ ] 2.3 Unit tests: short description — no toggle; long description — truncated with toggle; expand/collapse toggles; empty description — no row; aria attributes correct. (FR3, FR4)

## 3. Cover Lightbox

- [ ] 3.1 Create `CoverLightbox.tsx` in `components/goals/`: dimmed backdrop, centered image, close button (X), close on backdrop click, close on Escape, focus trap (Tab stays on close button), return focus to trigger on close. (FR1, FR2, NFR-A1)
- [ ] 3.2 Add hover cue (scale effect) to cover circle when goal has real cover; make it clickable to open lightbox. Default SVG cover — not clickable, no hover cue. (FR1, UX1)
- [ ] 3.3 Add i18n keys for lightbox close button aria-label and description toggle aria-label to `ru.json` and `en.json`. (NFR-A1)
- [ ] 3.4 Unit tests for `CoverLightbox`: renders image, closes on X click, closes on backdrop click, closes on Escape, focus trap works. (FR1, FR2, NFR-A1)
- [ ] 3.5 Unit tests for cover circle: clickable only when real cover exists, not clickable for default SVG. (FR1)

## 4. Extract Components from GoalDetailPage

- [ ] 4.1 Analyze `GoalDetailPage.tsx` after implementation — identify cohesive blocks that can be extracted into separate components (e.g., view-mode card, edit-mode form, completed tasks section). Extract only where it reduces the file below the 300-line hard cap and the extracted piece has a clear single responsibility. Do not split purely to reduce line count.

## 5. Verification

- [ ] 5.1 Run `pnpm run lint:fix` — all should pass
- [ ] 5.2 Run `pnpm run preflight` — all should pass
- [ ] 5.3 Run `pnpm run build` — verify no type errors
- [ ] 5.4 Run Stryker mutation testing on changed/new files — target >= 95% score (M3)
- [ ] 5.5 Verify all 6 UI states from the States Matrix render correctly (M1)
