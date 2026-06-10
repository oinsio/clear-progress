# Share with Friend

## Why

Users who enjoy Clear Progress want an easy way to recommend it to friends. Currently, sharing requires manually explaining the app and finding the URL. Adding a native share button streamlines this process, leveraging the device's built-in sharing capabilities (Web Share API) to send the app link via messaging apps, email, or social media.

## What Changes

**ADDED**:
- Share section in Settings page (after "Interface Scale", before "Language") with "Copy link" button
- Clipboard copy of invite message + app URL
- Confirmation dialog with single OK button in accent color
- i18n keys for share messages in Russian and English

## Capabilities

### New Capabilities
- `app-sharing`: User-initiated sharing of the app URL to invite others

### Modified Capabilities
<!-- No existing capabilities require requirement changes -->

## Impact

**Affected code**:
- `packages/client/src/pages/SettingsPage.tsx` — new share section
- `packages/client/src/components/settings/ShareAppSection.tsx` — new component
- `packages/client/src/hooks/useShare.ts` — new hook for share logic
- `packages/client/src/locales/ru.json` — new i18n keys
- `packages/client/src/locales/en.json` — new i18n keys

**No breaking changes**. No API changes. No database schema changes.

## Goals

- **G1**: Enable users to copy invite message + app link with one click
- **G2**: Provide clear feedback after copying (confirmation dialog)
- **G3**: Support multilingual share messages (Russian and English)

## Non-Goals

- **NG1**: Referral tracking (who invited whom)
- **NG2**: Referral rewards or gamification
- **NG3**: Custom landing page for invited users
- **NG4**: Analytics on share button usage
- **NG5**: Social media preview cards optimization (Open Graph tags)

## Users & Scenarios

- **U1**: Any user (mobile or desktop) — clicks "Copy link" → invite message + URL copied to clipboard → dialog confirms "Link copied" → user pastes link in messenger/email

## Requirements

### Functional

- **FR1**: Settings page displays a "Share app" section after "Interface Scale" and before "Language"
- **FR2**: Section contains a "Copy link" button labeled per i18n (ru: "Скопировать ссылку", en: "Copy link")
- **FR3**: ~~Removed — Web Share API dropped due to cross-browser inconsistencies~~
- **FR4**: Button copies invite message + `window.location.origin` to clipboard
- **FR5**: Show confirmation dialog after clipboard copy with message from i18n
- **FR6**: Dialog has single "OK" button in accent color to dismiss
- **FR7**: Share message text is localized (ru/en) and describes the app purpose

### Non-Functional

#### Performance
- **NFR-P1**: Share action completes within 100ms (excluding native OS dialogs)

#### Accessibility
- **NFR-A1**: Share button has proper `aria-label` from i18n
- **NFR-A2**: Confirmation dialog is keyboard-navigable (Tab, Enter, Escape)
- **NFR-A3**: Confirmation dialog has `role="alertdialog"` and `aria-labelledby`/`aria-describedby`

#### Responsive
- **NFR-R1**: Share section matches existing settings section styling on all screen sizes (320px–2560px)

## UX Acceptance Criteria

- **UX1**: Share button is visually consistent with other settings sections (same typography, spacing, borders)
- **UX2**: Share section has icon (Copy icon from lucide-react) and descriptive text
- **UX3**: ~~Removed — no native share sheet~~
- **UX4**: User sees clear feedback that link was copied (dialog with single OK button in accent color)
- **UX5**: User can dismiss confirmation dialog by clicking backdrop, Escape, or "OK" button

## UI States Matrix

| Scenario               | Clipboard API | UI State                      |
|------------------------|---------------|-------------------------------|
| Any browser            | ✅             | Dialog: "Link copied"         |
| Clipboard blocked      | ❌             | Dialog: "Copy failed" (error) |

## Behavior

Behavior specs defined in:
- `packages/client/src/test/features/app_sharing/app_sharing.feature` (@share-with-friend)

## Visual Reference

No Figma mockup required — reuses existing SettingsPage section pattern.

Design tokens (spacing, colors, typography) are source of truth.

## Affected IA

No IA changes required. Share section is an additive feature within existing Settings page.

## Success Metrics

- **M1**: Share button is discoverable (placed in Settings after Interface Scale)
- **M2**: Clipboard copy works on all modern browsers (Chrome, Firefox, Safari, mobile)
- **M3**: Confirmation dialog uses app accent color, not hardcoded blue
- **M4**: i18n keys are present in both ru.json and en.json
- **M5**: Confirmation dialog meets WCAG 2.1 AA (keyboard navigation, ARIA attributes)

## Open Questions

None — all questions resolved during exploration phase.
