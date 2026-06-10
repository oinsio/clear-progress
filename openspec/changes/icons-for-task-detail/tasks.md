## 1. Icon constants

- [x] 1.1 Add `TASK_DETAIL_ICONS` map (FileText, Target, MapPin, Tag, Repeat, EyeOff, Copy) and `TAB_ICONS` map (AlignLeft, ListChecks, Paperclip) to `taskEditShared.ts` — FR1-FR11

## 2. DrillDownRow icon prop

- [x] 2.1 Add optional `icon` prop (LucideIcon) to DrillDownRow, render with `w-4 h-4 text-gray-500 aria-hidden="true"` left of label — FR1, NFR-A1, UX1, UX3
- [x] 2.2 Unit test: DrillDownRow renders icon when provided, no icon space when omitted

## 3. TaskDetailsTab icons

- [x] 3.1 Pass icons from `TASK_DETAIL_ICONS` to each DrillDownRow (Goal=Target, Context=MapPin, Category=Tag, Repeat=Repeat, HideUntil=EyeOff) — FR2-FR6
- [x] 3.2 Add FileText icon to Description field label — FR7
- [x] 3.3 Add Copy icon to Duplicate button — FR8

## 4. TaskDetailPanel tab icons

- [x] 4.1 Add icons from `TAB_ICONS` to tab switcher buttons (Details=AlignLeft, Checklist=ListChecks, Attachments=Paperclip) — FR9-FR11

## 5. GoalCardEditMode tab icons

- [ ] 5.1 Add AlignLeft icon to Goal Details tab button — FR12
- [ ] 5.2 Add Paperclip icon to Goal Attachments tab button — FR13

## 6. GoalEditDetailsTab icons

- [ ] 6.1 Add FileText icon to Goal description field label — FR14
- [ ] 6.2 Add Activity icon to Goal status field label — FR15

## 7. IdeaDetailPanel icons

- [ ] 7.1 Add FileText icon to Idea description field label — FR16

## 8. Verification

- [x] 8.1 Run `pnpm run build` — verify no build errors
- [x] 8.2 Verify icons render correctly at 320px viewport — NFR-R1
- [x] 8.3 Run existing DrillDownRow and TaskDetailPanel tests — no regressions
- [ ] 8.4 Verify Goal and Idea icons render correctly — FR12-FR16
- [ ] 8.5 Verify same icon (FileText) used for description across all entities — M3
