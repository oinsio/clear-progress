# fix-interface-scaling

## Why

The interface scaling system (data-scale + font-size on html) works via rem units, but several UI elements use hardcoded px values and do not respond to scale changes. This breaks user expectations: when switching scale, some icons, small text, and widths remain the same size. Additionally, the current upper scale values (large = 112.5%, xLarge = 125%) produce too subtle an effect — they need to be increased to 125% and 150%.

## What Changes

- **MODIFIED**: Scale values for large (112.5% -> 125%) and xLarge (125% -> 150%)
- **MODIFIED**: 3 text elements with hardcoded px values (`text-[10px]`, `text-[14px]`, `fontSize: Npx`) replaced with rem-based equivalents
- **MODIFIED**: 38 Lucide icons using `size={N}` (px) replaced with Tailwind `w-X h-X` classes (rem)
- **MODIFIED**: 1 max-width using px replaced with rem

## Goals

- G1: All text elements and icons scale proportionally when the scale setting is changed
- G2: Increased scale values (large = 125%, xLarge = 150%) provide a more noticeable effect for users with reduced vision

## Non-Goals

- NG1: Do not change the set of available scales (small/normal/large/xLarge)
- NG2: Do not change the scaling mechanism (font-size on html + rem remains)
- NG3: Do not scale media queries and layout breakpoints — this is intentional

## Users & Scenarios

- U1: A user with reduced vision selects xLarge and expects the entire interface, including small text and icons, to become significantly larger

## Requirements

### Functional

- FR1: Scale values: small = 87.5%, normal = 100%, large = 125%, xLarge = 150%
- FR2: All text elements in the app must use rem-based sizes (Tailwind classes or arbitrary rem values)
- FR3: All Lucide icons must use Tailwind `w-X h-X` classes (rem) instead of `size={N}` (px)
- FR4: All CSS sizes (width, max-width) in content elements must be in rem

### Non-Functional

#### Accessibility — NFR-A1

- NFR-A1: At xLarge (150%) the interface must not have horizontal scrollbar on viewport >= 375px

## UX Acceptance Criteria

- UX1: When switching between scales, all elements (text, icons, spacing) change size proportionally
- UX2: At 150% scale, text and icons remain readable, are not clipped, and do not overflow container boundaries

## Success Metrics

- M1: 0 elements with hardcoded px in text-size, icon-size, and content-width
- M2: All 4 scales are visually correct (no overflow, no text clipping)

## Capabilities

### New Capabilities

No new capabilities.

### Modified Capabilities

- `theme-appearance`: Scale percentage values for large and xLarge are changed, and a requirement is added that all UI elements must use rem-based sizing

## Impact

- `packages/client/src/styles/globals.css` — scale values
- `packages/client/src/components/tasks/TaskItem.tsx` — px text + icon sizes
- `packages/client/src/components/tasks/SidebarSyncBlock.tsx` — px text
- `packages/client/src/components/tasks/TaskQuickActions.tsx` — icon sizes
- `packages/client/src/components/tasks/TaskDetailPanel.tsx` — icon sizes
- `packages/client/src/components/tasks/RepeatRuleSelector.tsx` — icon sizes
- `packages/client/src/components/tasks/SortableChecklistItem.tsx` — icon sizes
- `packages/client/src/components/tasks/HiddenTasksToggle.tsx` — icon sizes
- `packages/client/src/components/ideas/IdeaDetailPanel.tsx` — icon sizes
- `packages/client/src/components/goals/GoalDetailPage.tsx` — icon sizes
- `packages/client/src/components/goals/GoalCoverPicker.tsx` — icon sizes
- `packages/client/src/components/settings/MenuOrderSection.tsx` — icon sizes
- `packages/client/src/components/ui/LinkedText.tsx` — max-width px
- `packages/client/src/pages/SettingsPage.tsx` — fontSize px + icon size
- `packages/client/src/pages/DeletedPage.tsx` — icon sizes
- `packages/client/src/pages/SearchPage.tsx` — icon sizes
- `openspec/specs/theme-appearance/spec.md` — updated scale values
- BDD/unit tests that check specific percentage values

## Open Questions

No open questions.
