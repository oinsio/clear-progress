## 1. Update scale values (FR1)

- [ ] 1.1 Update `globals.css`: large = 125% (--scale-factor: 1.25), xLarge = 150% (--scale-factor: 1.5)
- [ ] 1.2 Update InterfaceScaleProvider tests if they check specific percentages (125% instead of 112.5%, 150% instead of 125%)
- [ ] 1.3 Update delta spec `theme-appearance` (already done in specs)

## 2. Fix text with hardcoded px (FR2)

- [ ] 2.1 `TaskItem.tsx:306` — replace `text-[10px]` with `text-[0.625rem]`
- [ ] 2.2 `SidebarSyncBlock.tsx:202,271` — replace `text-[14px]` with `text-sm`
- [ ] 2.3 `SettingsPage.tsx:442` — replace `style={{ fontSize: ${iconSize}px }}` with Tailwind classes (text-sm/text-base/text-lg/text-xl)

## 3. Replace Lucide size={N} with Tailwind classes (FR3)

- [ ] 3.1 `TaskItem.tsx` — replace 7 icons (size 10, 12, 16, 20)
- [ ] 3.2 `TaskQuickActions.tsx` — replace 6 icons (size 17 -> w-4 h-4)
- [ ] 3.3 `TaskDetailPanel.tsx` — replace 4 icons (size 16, 18)
- [ ] 3.4 `RepeatRuleSelector.tsx` — replace 5 icons (size 16, 18)
- [ ] 3.5 `DeletedPage.tsx` — replace 7 icons (size 14, 16)
- [ ] 3.6 `IdeaDetailPanel.tsx` — replace 2 icons (size 16, 18)
- [ ] 3.7 `SortableChecklistItem.tsx` — replace 1 icon (size 14)
- [ ] 3.8 `HiddenTasksToggle.tsx` — replace 1 icon (size 20)
- [ ] 3.9 `GoalDetailPage.tsx` — replace 1 icon (size 18)
- [ ] 3.10 `GoalCoverPicker.tsx` — replace 1 icon (size 10)
- [ ] 3.11 `MenuOrderSection.tsx` — replace 1 icon (size 18)
- [ ] 3.12 `SearchPage.tsx` — replace 1 icon (size 16)
- [ ] 3.13 `SettingsPage.tsx` — replace 1 icon (size 16)

## 4. Fix max-width with px (FR4)

- [ ] 4.1 `LinkedText.tsx:31` — replace `max-w-[260px]` with `max-w-[16.25rem]`

## 5. Update specs

- [ ] 5.1 Update `openspec/specs/theme-appearance/spec.md` — sync scale values after archival

## 6. Verification

- [ ] 6.1 Run `pnpm run build` — build succeeds without errors
- [ ] 6.2 Run `pnpm run lint:fix` — all should pass
- [ ] 6.3 Run `pnpm run preflight` — all should pass
- [ ] 6.4 Visual check of all 4 scales in browser (NFR-A1, UX1, UX2)
- [ ] 6.5 Verify no horizontal scrollbar at 150% on 375px viewport (NFR-A1)
