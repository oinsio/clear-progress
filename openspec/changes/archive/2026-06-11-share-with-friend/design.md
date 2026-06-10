# Design: Share with Friend

## Context

Users want to share Clear Progress with friends. The app is a PWA, so sharing means sending the app's URL along with an invitation message.

Initially Web Share API was considered for native sharing on mobile, but testing revealed cross-browser issues: macOS Safari/Chrome share sheets don't reliably include the URL in messages and don't show "Copy Link" option when text is also provided. Simplified to clipboard-only approach for consistency across all platforms.

**Current state:**
- Settings page exists at `packages/client/src/pages/SettingsPage.tsx`
- Sections follow a consistent pattern: header (uppercase, gray), content area, spacing via Tailwind
- i18n via react-i18next, files at `packages/client/src/locales/{ru,en}.json`

**Constraints:**
- Must work on all modern browsers (Chrome, Firefox, Safari, mobile)
- Must match existing Settings page styling
- No analytics tracking (per NG4 in proposal)

## Goals / Non-Goals

**Goals:**
- Add copy link button to Settings page that copies invite message + URL to clipboard
- Show confirmation dialog with single OK button in accent color
- Support Russian and English locales
- Meet WCAG 2.1 AA for accessibility

**Non-Goals:**
- Web Share API integration (removed due to cross-browser inconsistencies)
- Referral tracking or analytics
- Social media preview optimization (Open Graph tags)
- Custom landing page for invited users

## Decisions

### Decision 1: Component structure

**Choice:** Extract share logic into `ShareAppSection` component and `useShare` hook.

**Rationale:**
- `SettingsPage.tsx` is already 500+ lines; adding inline logic bloats it further
- `useShare` hook encapsulates clipboard logic and state management
- Follows existing pattern: `DayBoundarySection`, `MenuOrderSection`, `ServerSection` are separate components

**Files:**
- `packages/client/src/components/settings/ShareAppSection.tsx` — UI component + alert dialog
- `packages/client/src/hooks/useShare.ts` — clipboard copy logic hook

### Decision 2: Clipboard-only approach (no Web Share API)

**Choice:** Copy invite message + URL to clipboard instead of using Web Share API.

**Rationale:**
- Web Share API on macOS Safari/Chrome doesn't reliably pass URL to share targets (Messages, Telegram only receive text, not URL)
- macOS share sheet doesn't show "Copy Link" extension when `text` parameter is provided alongside `url`
- Clipboard API is universally supported and provides consistent behavior
- Simpler implementation with fewer edge cases

**Alternatives considered:**
- Web Share API with `url` in `text` field → still no "Copy Link" in macOS share sheet
- Web Share API without `text` (URL only) → loses invite message context
- Web Share API + separate copy button → two buttons is confusing for a simple feature

### Decision 3: Custom single-button alert dialog

**Choice:** Use a custom `ShareAlertDialog` instead of the shared `ConfirmDialog`.

**Rationale:**
- `ConfirmDialog` always renders two buttons (cancel + confirm) — share result only needs one OK button
- `ConfirmDialog` uses hardcoded `bg-blue-600` instead of the app's accent color (`bg-accent`)
- Simple inline dialog avoids modifying shared component and risking regressions

### Decision 4: URL source

**Choice:** Use `window.location.origin` for shared URL.

**Rationale:**
- Works on both `localhost:5173` (dev) and production
- No need for hardcoded production URL in code
- Environment-agnostic

### Decision 5: i18n keys structure

**Choice:** Nest under `share` namespace in locale files.

**Structure:**
```json
{
  "share": {
    "title": "Share app",
    "description": "Tell your friends about Clear Progress",
    "copyLinkButton": "Copy link",
    "inviteMessage": "Try Clear Progress — an app for managing tasks, goals, and ideas!",
    "linkCopied": "Link copied to clipboard",
    "copyFailed": "Failed to copy link",
    "ok": "OK"
  }
}
```

### Decision 6: Section placement

**Choice:** Insert share section after "Interface Scale", before "Language".

**Rationale:**
- Thematically fits with "global" settings (not workflow-specific like "Day Boundary")
- "Language" section has collapsible panel; placing share before it keeps UI stable

## Risks / Trade-offs

### Risk 1: Clipboard API blocked by permissions
**Impact:** User clicks copy, sees error dialog.

**Mitigation:**
- Error dialog informs user of the failure
- Rare scenario (clipboard permissions usually granted by default)

### Trade-off: No native share sheet on mobile
**Decision:** Removed Web Share API in favor of clipboard-only.

**Consequence:** Mobile users cannot share directly via native share sheet (WhatsApp, Telegram, etc.). They copy the text and paste manually.

**Justification:** Consistent behavior across all platforms. Web Share API had cross-browser issues making the UX unreliable.

## Open Questions

None — all decisions are final based on testing and user confirmation.
