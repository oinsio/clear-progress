# Design: Share with Friend

## Context

Users want to share Clear Progress with friends. The app is a PWA, so sharing means sending the app's URL. Modern browsers provide Web Share API for native sharing on mobile devices, but desktop browsers often lack this API or have limited support.

**Current state:**
- Settings page exists at `packages/client/src/pages/SettingsPage.tsx`
- Sections follow a consistent pattern: header (uppercase, gray), content area, spacing via Tailwind
- `ConfirmDialog` component exists for modal confirmations (`packages/client/src/components/shared/ConfirmDialog.tsx`)
- i18n via react-i18next, files at `packages/client/src/locales/{ru,en}.json`

**Constraints:**
- Must work on mobile (iOS Safari 12+, Android Chrome 89+) and desktop (Chrome, Firefox, Safari)
- Must match existing Settings page styling
- No analytics tracking (per NG4 in proposal)

## Goals / Non-Goals

**Goals:**
- Add share button to Settings page that uses Web Share API on supported devices
- Provide clipboard fallback for browsers without Web Share API
- Support Russian and English locales
- Meet WCAG 2.1 AA for accessibility

**Non-Goals:**
- Referral tracking or analytics
- Social media preview optimization (Open Graph tags)
- Custom landing page for invited users

## Decisions

### Decision 1: Component structure

**Choice:** Extract share logic into `ShareAppSection` component and `useShare` hook.

**Rationale:**
- `SettingsPage.tsx` is already 500+ lines; adding inline logic bloats it further
- `useShare` hook encapsulates Web Share API detection, fallback logic, and state management
- Follows existing pattern: `DayBoundarySection`, `MenuOrderSection`, `ServerSection` are separate components

**Alternatives considered:**
- Inline logic in `SettingsPage.tsx` → rejected due to file size and maintainability
- Single component with no hook → rejected because logic would be harder to test in isolation

**Files:**
- `packages/client/src/components/settings/ShareAppSection.tsx` — UI component
- `packages/client/src/hooks/useShare.ts` — share logic hook

### Decision 2: Web Share API detection

**Choice:** Check `navigator.share` availability at runtime, not user agent sniffing.

**Rationale:**
- Feature detection is more reliable than UA parsing
- Browsers can add/remove features in updates

**Implementation:**
```typescript
const isShareSupported = typeof navigator.share === "function";
```

### Decision 3: Fallback mechanism

**Choice:** Use `navigator.clipboard.writeText()` with `ConfirmDialog` for feedback.

**Rationale:**
- Clipboard API is widely supported (Chrome 66+, Firefox 63+, Safari 13.1+)
- Reuses existing `ConfirmDialog` component instead of adding toast/snackbar dependency
- User expects immediate feedback on desktop (dialog is more noticeable than toast)

**Error handling:**
- If clipboard API also fails (permissions blocked), show error variant of `ConfirmDialog`

### Decision 4: URL source

**Choice:** Use `window.location.origin` for shared URL.

**Rationale:**
- Works on both `localhost:5173` (dev) and `https://oinsio.github.io/clear-progress/` (prod)
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
    "button": "Share",
    "inviteMessage": "Try Clear Progress — an app for managing tasks, goals, and ideas!",
    "linkCopied": "Link copied to clipboard",
    "copyFailed": "Failed to copy link"
  }
}
```

**Rationale:**
- Namespacing prevents key collisions
- Easy to find all share-related strings

### Decision 6: Section placement

**Choice:** Insert share section after "Interface Scale", before "Language".

**Rationale:**
- Thematically fits with "global" settings (not workflow-specific like "Day Boundary")
- "Language" section has collapsible panel; placing share before it keeps UI stable
- User preference from exploration phase

### Decision 7: AbortError handling

**Choice:** Silently ignore `AbortError` from Web Share API.

**Rationale:**
- `AbortError` is thrown when user cancels native share sheet
- No user feedback needed — user explicitly cancelled, showing error is confusing

**Implementation:**
```typescript
try {
  await navigator.share(shareData);
} catch (err) {
  if (err.name === "AbortError") return; // user cancelled
  // fallback to clipboard
}
```

## Risks / Trade-offs

### Risk 1: Clipboard API blocked by permissions
**Impact:** User clicks share, sees error dialog, cannot copy link.

**Mitigation:**
- Error dialog instructs user to manually copy URL from address bar
- Rare scenario (clipboard permissions usually granted by default)

### Risk 2: Web Share API not available on older mobile browsers
**Impact:** Users on iOS <12 or Android Chrome <89 fall back to clipboard.

**Mitigation:**
- Clipboard fallback covers this case
- According to caniuse.com, iOS 12+ and Android Chrome 89+ cover >95% of mobile users in 2026

### Risk 3: Share section increases SettingsPage bundle size
**Impact:** Minimal — new section adds ~2KB (component + hook + i18n strings).

**Mitigation:**
- Not critical for a PWA where assets are cached after first load
- Bundle size impact acceptable given functionality benefit

### Trade-off: No social media preview optimization
**Decision:** Not adding Open Graph meta tags (per NG5).

**Consequence:** When user shares link on social media, preview will be generic (no custom image/description).

**Justification:** Scope reduction; can be added later if user feedback demands it.

## Open Questions

None — all decisions are final based on exploration phase and user confirmation.
