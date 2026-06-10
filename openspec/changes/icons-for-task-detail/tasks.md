## 1. Icon constants

- [ ] 1.1 Add `TASK_DETAIL_ICONS` map (FileText, Target, MapPin, Tag, Repeat, EyeOff, Copy) and `TAB_ICONS` map (AlignLeft, ListChecks, Paperclip) to `taskEditShared.ts` — FR1-FR11

## 2. DrillDownRow icon prop

- [ ] 2.1 Add optional `icon` prop (LucideIcon) to DrillDownRow, render with `w-4 h-4 text-gray-500 aria-hidden="true"` left of label — FR1, NFR-A1, UX1, UX3
- [ ] 2.2 Unit test: DrillDownRow renders icon when provided, no icon space when omitted

## 3. TaskDetailsTab icons

- [ ] 3.1 Pass icons from `TASK_DETAIL_ICONS` to each DrillDownRow (Goal=Target, Context=MapPin, Category=Tag, Repeat=Repeat, HideUntil=EyeOff) — FR2-FR6
- [ ] 3.2 Add FileText icon to Description field label — FR7
- [ ] 3.3 Add Copy icon to Duplicate button — FR8

## 4. TaskDetailPanel tab icons

- [ ] 4.1 Add icons from `TAB_ICONS` to tab switcher buttons (Details=AlignLeft, Checklist=ListChecks, Attachments=Paperclip) — FR9-FR11

## 5. Verification

- [ ] 5.1 Run `pnpm run build` — verify no build errors
- [ ] 5.2 Verify icons render correctly at 320px viewport — NFR-R1
- [ ] 5.3 Run existing DrillDownRow and TaskDetailPanel tests — no regressions
