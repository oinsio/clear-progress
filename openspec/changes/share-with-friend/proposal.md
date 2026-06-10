# Share with Friend

## Why

Users who enjoy Clear Progress want an easy way to recommend it to friends. Currently, sharing requires manually explaining the app and finding the URL. Adding a native share button streamlines this process, leveraging the device's built-in sharing capabilities (Web Share API) to send the app link via messaging apps, email, or social media.

## What Changes

**ADDED**:
- Share button in Settings page (after "Interface Scale", before "Language")
- Web Share API integration with fallback to clipboard copy
- Confirmation dialog for fallback scenario (desktop browsers without Web Share API)
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

- **G1**: Enable users to share the app with one tap on mobile devices
- **G2**: Provide a seamless fallback experience on desktop (copy to clipboard)
- **G3**: Support multilingual share messages (Russian and English)

## Non-Goals

- **NG1**: Referral tracking (who invited whom)
- **NG2**: Referral rewards or gamification
- **NG3**: Custom landing page for invited users
- **NG4**: Analytics on share button usage
- **NG5**: Social media preview cards optimization (Open Graph tags)

## Users & Scenarios

- **U1**: Mobile user (iOS Safari, Android Chrome) — taps "Share" → native share sheet appears → selects messenger/email → sends link
- **U2**: Desktop user (Chrome/Firefox) — clicks "Share" → dialog shows "Link copied to clipboard" → pastes link manually
- **U3**: User on Safari macOS — clicks "Share" → native share menu appears (macOS share sheet)

## Requirements

### Functional

- **FR1**: Settings page displays a "Share app" section after "Interface Scale" and before "Language"
- **FR2**: Section contains a button labeled per i18n (ru: "Поделиться", en: "Share")
- **FR3**: Button triggers Web Share API if available, with data: `title`, `text`, `url: window.location.origin`
- **FR4**: If Web Share API unavailable, copy `window.location.origin` to clipboard
- **FR5**: Show confirmation dialog after clipboard copy with message from i18n
- **FR6**: Dialog has single "OK" button to dismiss
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
- **UX2**: Share section has icon (Share icon from lucide-react) and descriptive text
- **UX3**: On mobile, user sees native share sheet with familiar apps (WhatsApp, Telegram, etc.)
- **UX4**: On desktop, user sees clear feedback that link was copied (dialog, not toast)
- **UX5**: User can dismiss confirmation dialog by clicking backdrop, Escape, or "OK" button

## UI States Matrix

| Scenario               | Share API | Clipboard API | UI State                         |
|------------------------|-----------|---------------|----------------------------------|
| Mobile (iOS/Android)   | ✅         | ✅             | Native share sheet               |
| Desktop Safari (macOS) | ✅         | ✅             | macOS share menu                 |
| Desktop Chrome/Firefox | ❌         | ✅             | Dialog: "Link copied"            |
| Clipboard blocked      | ❌         | ❌             | Dialog: "Copy failed" (error)    |
| User cancels share     | ✅         | N/A           | No feedback (AbortError ignored) |

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
- **M2**: Web Share API works on iOS Safari 12+, Android Chrome 89+, macOS Safari 12.1+
- **M3**: Clipboard fallback works on desktop Chrome/Firefox
- **M4**: i18n keys are present in both ru.json and en.json
- **M5**: Confirmation dialog meets WCAG 2.1 AA (keyboard navigation, ARIA attributes)

## Open Questions

None — all questions resolved during exploration phase.
