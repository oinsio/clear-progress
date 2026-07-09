## 1. Types and Constants

- [ ] 1.1 Add `GoalFilter` type to `types/common.ts` — `"active" | "paused" | "finished" | "all"` (FR1)
- [ ] 1.2 Add constants to `constants/index.ts`: `GOAL_FILTER_OPTIONS`, `DEFAULT_GOAL_FILTER`, `GOAL_FILTER_STATUS_MAP`, `GOAL_FILTER_ORDER`, `STORAGE_KEYS.GOAL_FILTER` (FR1, FR2, FR3, FR4, FR5)
- [ ] 1.3 Move `FINISHED_GOAL_STATUSES` from `GoalItem.tsx` to `constants/index.ts`, update import in GoalItem (D5)
- [ ] 1.4 Add i18n keys `goalFilter.active`, `goalFilter.paused`, `goalFilter.finished`, `goalFilter.all` to `ru.json` and `en.json` (NFR-A1)
- [ ] 1.5 Add i18n keys `goal.emptyActive`, `goal.emptyPaused`, `goal.emptyFinished` to `ru.json` and `en.json` (FR8)
- [ ] 1.6 Add `GOAL_FILTER_EMPTY_MESSAGE_KEYS` constant mapping each GoalFilter to its i18n empty message key (FR8)
- [ ] 1.7 Unit tests for constants: GOAL_FILTER_STATUS_MAP covers all statuses, GOAL_FILTER_OPTIONS has 4 values, DEFAULT_GOAL_FILTER is "all"

## 2. useGoalFilter Hook

- [ ] 2.1 TDD: Write failing tests for `useGoalFilter` — returns default "all", persists selected value, returns setter (FR2, FR6)
- [ ] 2.2 Implement `useGoalFilter` hook using `usePreference` with enum config (FR6, D2)
- [ ] 2.3 Verify tests pass, refactor if needed

## 3. Generic CommandBarFilter

- [ ] 3.1 Define `CommandBarFilterItem` interface: `{ value: string, icon: React.ComponentType<{ className?: string }>, label: string }` (FR7)
- [ ] 3.2 Update `CommandBarFilterConfig` to use `items: CommandBarFilterItem[]`, `activeValue: string`, `onChange: (value: string) => void` instead of BoxFilter-specific fields (FR7)
- [ ] 3.3 Update `CommandBarFilter` component to render from generic items instead of hardcoded `BOX_FILTER_ICONS` (FR7)
- [ ] 3.4 Update `ActiveTasksPage` to build `CommandBarFilterItem[]` from BoxFilter constants + BoxIcons (M3)
- [ ] 3.5 Update `InboxPage` if it uses CommandBarFilter (verify and fix)
- [ ] 3.6 Update existing CommandBar/CommandBarFilter tests for new generic API
- [ ] 3.7 Run `pnpm run build` to verify no type errors

## 4. GoalsPage Integration

- [ ] 4.1 Build `GOAL_FILTER_ITEMS` array: `[{ value: "active", icon: Play, label }, ...]` with AllBoxesIcon for "all" (FR9)
- [ ] 4.2 Integrate `useGoalFilter` in GoalsPage, pass filter config to CommandBar (FR1, FR10)
- [ ] 4.3 Filter `activeGoals` by `GOAL_FILTER_STATUS_MAP[goalFilter]` (FR3, FR4, FR5)
- [ ] 4.4 Implement filter-specific empty state messages using `GOAL_FILTER_EMPTY_MESSAGE_KEYS` (FR8)
- [ ] 4.5 Update GoalsPage tests: filter renders, filter changes update displayed goals, empty states per filter
- [ ] 4.6 Run `pnpm run build` to verify

## 5. Verification

- [ ] 5.1 Run full unit test suite: `cd packages/client && npx vitest run`
- [ ] 5.2 Mutation testing on new files (scoped): `useGoalFilter.ts`, constants changes — target >= 95% (M4)
- [ ] 5.3 Verify ActiveTasksPage box filter still works (no regressions) (M3)
- [ ] 5.4 Verify a11y: filter buttons have aria-labels (NFR-A1), active button visually distinguishable (NFR-A2)
