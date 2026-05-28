# Simplify Backend Connection

## Why

The current backend connection flow requires a separate `/setup` page with multiple phases, accordion toggles, and no navigation — making users feel trapped. Supabase (the primary backend) is hidden behind a collapsed accordion while GAS is expanded by default. The Anon Key field uses `type="password"` despite being a public key. Settings page doesn't show which server is connected. The flow takes 5+ steps; target is 3.

## What Changes

- **REMOVED**: Standalone `/setup` page and `ROUTES.SETUP` constant — connection moves entirely into Settings page
- **REMOVED**: `SetupPage.tsx`, `GasSetupSection.tsx`, `GasConnectedSection.tsx`, `SupabaseSetupSection.tsx`, `SupabaseConnectedSection.tsx`
- **MODIFIED**: Settings page gets a new "Server" section replacing the current "Sync" section, with inline connection forms
- **MODIFIED**: Supabase Anon Key input changes from `type="password"` to `type="text"` (public key, no masking needed)
- **MODIFIED**: GAS Client ID becomes **required** (was optional) — without it OAuth is impossible
- **MODIFIED**: Right panel "Login" button text and route → "Configure server" → `/settings`
- **MODIFIED**: OAuth redirect URL changes from `/setup` to `/settings`
- **MODIFIED**: First launch lands on inbox (empty), no redirect to `/setup`
- **MODIFIED**: Integration tests updated to use `/settings` instead of `/setup`

## Goals

- G1: Reduce backend connection to 3 steps from Settings page
- G2: Make Supabase the primary (first-shown) backend option
- G3: Show connected server info (type + URL) in Settings
- G4: Eliminate dead-end `/setup` page — users always have full navigation

## Non-Goals

- NG1: Changing the core connection service logic (`disconnect()`, `getConnectionConfig()`) — service layer stays mostly the same (minor addition of per-type persistence)
- NG2: Changing the sync protocol or adapter interfaces
- NG3: Adding new backend types
- NG4: Auto-detection of backend type from URL

## Users & Scenarios

- U1: New user — opens app for the first time, sees empty inbox, goes to Settings, connects Supabase in 3 steps
- U2: Existing GAS user — goes to Settings, sees "Configure server" options, connects GAS with required Client ID
- U3: Connected user — sees server type and URL in Settings, can trigger full sync or disconnect
- U4: Switching user — disconnects from one backend, connects to another; previous backend settings are preserved for easy switching back

## Requirements

### Functional

- FR1: Settings page SHALL display a "Server" section with connection status, server type, and URL when connected
- FR2: When not connected, the Server section SHALL show explanatory text and two equally-styled buttons: "Connect Supabase" and "Connect Google Apps Script"
- FR3: Clicking "Connect Supabase" SHALL show an inline form with Project URL (`type="text"`) and Anon Key (`type="text"`) fields, plus "Connect" and "Cancel" buttons
- FR4: Clicking "Connect Google Apps Script" SHALL show an inline form with Script URL and Client ID fields (both required), plus "Connect" and "Cancel" buttons
- FR5: "Cancel" button SHALL return to the backend selection view (FR2)
- FR6: Supabase "Connect" button SHALL be disabled until both URL and Anon Key are non-empty
- FR7: GAS "Connect" button SHALL be disabled until both URL and Client ID are non-empty
- FR8: After successful Supabase connection check, OAuth provider buttons SHALL be displayed inline
- FR9: After successful GAS ping, "Sign in with Google" button SHALL be displayed inline
- FR10: Connected state SHALL show: server type label, server URL, user account (email), "Full sync" button, and "Disconnect" button
- FR11: `ROUTES.SETUP` SHALL be removed; `/setup` route SHALL not exist
- FR12: `main.tsx` SHALL NOT redirect to `/setup` on first launch; user lands on inbox
- FR13: Right panel login button SHALL display "Configure server" text and navigate to `/settings`
- FR14: OAuth redirect URL SHALL point to `/settings` instead of `/setup`
- FR15: GAS connection SHALL require Client ID (not optional) — ping is still performed, but awaiting-signin phase always follows for GAS
- FR16: OAuth provider buttons (Supabase) and "Sign in with Google" (GAS) phases SHALL display a "Cancel" button that disconnects and returns to the corresponding connection form
- FR17: Connection settings SHALL be persisted per backend type so that switching from one type to another preserves previously entered settings
- FR18: Form fields SHALL display placeholder text showing example values (URL format, key format, Client ID format)
- FR19: Form fields SHALL display helper descriptions below each input explaining where to find the value
- FR20: Backend selection buttons SHALL have equal visual weight (no accent highlighting on either)

### Non-Functional

#### Performance

- NFR-P1: Connection check (Supabase or GAS ping) SHALL complete within 5 seconds or show timeout error

#### Accessibility

- NFR-A1: All form inputs SHALL have associated `<label>` elements
- NFR-A2: Connection status changes SHALL use `aria-live="polite"` regions
- NFR-A3: All interactive elements SHALL be keyboard-navigable

#### Responsive

- NFR-R1: Server section form SHALL be usable on viewports from 320px to 2560px

## UX Acceptance Criteria

- UX1: Supabase option SHALL appear before GAS option in the backend selection
- UX2: Connected state SHALL clearly show which backend type, URL, and user account is active
- UX3: Error states SHALL display inline within the Server section (no modals, no page navigation)
- UX4: Loading states (connecting, initializing) SHALL show spinner and disable form controls
- UX5: "Disconnect" SHALL require confirmation dialog (existing `ConfirmDisconnectDialog`)
- UX6: "Full sync" SHALL require confirmation dialog (existing `ConfirmFullSyncDialog`)

## UI States Matrix

| Connection State          | Server Section Content                                                                                   |
|---------------------------|----------------------------------------------------------------------------------------------------------|
| Not configured            | Hint text + equally-styled "Connect Supabase" + "Connect GAS" buttons                                    |
| Supabase form             | URL + Anon Key inputs (with placeholders, descriptions), pre-filled from saved config, Connect + Cancel  |
| GAS form                  | URL + Client ID inputs (with placeholders, descriptions), pre-filled from saved config, Connect + Cancel |
| Connecting                | Form disabled, spinner, "Connecting..." text                                                             |
| Supabase providers loaded | OAuth provider buttons + Cancel button                                                                   |
| Supabase no providers     | Info message: configure providers in dashboard + Cancel button                                           |
| GAS awaiting signin       | "Sign in with Google" button + Cancel button                                                             |
| GAS initializing          | Spinner, "Initializing..." text                                                                          |
| GAS not initialized       | Warning + back button (edge case: ping ok but init needed without auth)                                  |
| Connection error          | Error message inline, form re-enabled for retry                                                          |
| Connected (synced)        | Green dot, server type + URL + account, Full sync + Disconnect buttons                                   |
| Connected (syncing)       | Yellow pulsing dot, server type + URL + account                                                          |
| Connected (error/offline) | Red dot, server type + URL + account, Full sync + Disconnect buttons                                     |
| Connected (unauthorized)  | Red dot, re-auth prompt                                                                                  |

## Behavior

Behavior specs in `features/server_connection/*.feature` with `@simplify-backend-connection` tags.

## Affected IA

No IA changes — Settings page already exists, Server section replaces Sync section in same location.

## Success Metrics

- M1: Backend connection completes in 3 user actions from Settings page (was 5+)
- M2: Zero references to `ROUTES.SETUP` or `/setup` path in codebase after change
- M3: All existing integration tests pass with updated selectors
- M4: Mutation testing score >= 95% on new Server section components

## Open Questions

No open questions. First-time user onboarding (tutorial tasks on first launch) is a separate change.
