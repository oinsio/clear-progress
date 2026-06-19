## 1. Constants and i18n

- [ ] 1.1 Add section configuration constants: section IDs, section-to-settings mapping, SYNCED_SETTING_KEYS set — FR1, FR8
- [ ] 1.2 Add i18n keys for section headings (Look & Feel, Workspace, Tasks, Account & Sync) and sync legend — FR1, FR9

## 2. SettingsAccordion component (TDD)

- [ ] 2.1 Write tests for SettingsAccordion: renders sections, single-expand behavior, default expanded, keyboard navigation, ARIA attributes — FR1, FR6, FR11, NFR-A1, NFR-A3
- [ ] 2.2 Implement SettingsAccordion component: collapsible sections with chevron, single-expand mode, persisted state via useSectionCollapse — FR1, FR6, FR7, FR11
- [ ] 2.3 Verify tests pass, refactor — UX1, UX2

## 3. SyncIndicator component (TDD)

- [ ] 3.1 Write tests for SyncIndicator: renders cloud icon for synced keys, no icon for local keys, aria-label present — FR8, NFR-A2
- [ ] 3.2 Implement SyncIndicator component: cloud icon from lucide-react with aria-label — FR8, NFR-A2
- [ ] 3.3 Verify tests pass, refactor

## 4. Section components

- [ ] 4.1 Extract LookAndFeelSection: Theme, Accent color (with SyncIndicator), Interface scale, Language — FR2
- [ ] 4.2 Extract WorkspaceSection: Panel side, Always expanded, Pin detail panel, Handedness, Filter position, divider, Menu items — FR3
- [ ] 4.3 Extract TasksSection: Default box (with SyncIndicator), Day start time (with SyncIndicator), divider, Focus mode, Focus strength — FR4
- [ ] 4.4 Wrap ServerSection into AccountSyncSection — FR5

## 5. SettingsPage refactor

- [ ] 5.1 Refactor SettingsPage to use SettingsAccordion with 4 section components — FR1
- [ ] 5.2 Move ShareAppSection below accordion as standalone banner — FR10, UX4
- [ ] 5.3 Add sync legend at page bottom — FR9
- [ ] 5.4 Verify SettingsPage is under 200 lines — M1

## 6. Verification

- [ ] 6.1 Unit tests for section components: correct settings rendered in each section, correct order — FR2, FR3, FR4, FR5
- [ ] 6.2 Mutation testing on new components (SettingsAccordion, SyncIndicator, section components) — target >= 95% — M3
- [ ] 6.3 Build verification: `pnpm run build` passes
- [ ] 6.4 Accessibility check: ARIA attributes, keyboard navigation, aria-label on sync icons — NFR-A1, NFR-A2, NFR-A3
