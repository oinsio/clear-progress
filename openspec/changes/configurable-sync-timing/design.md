# Design: Configurable Sync Timing

## Context

Sync timing is driven by two module-level constants consumed only in `SyncProvider.tsx`:
`SYNC_INTERVAL_MS` (5 min) at the periodic `setInterval` (line ~369) and `SYNC_DEBOUNCE_MS`
(15 s) inside `schedulePush` (line ~224). The app already has a first-class **synced settings**
mechanism (IndexedDB `settings` table + push/pull with LWW/local-dirty-wins), used today by
`accent_color`, `default_box`, `day_boundary`, and custom accents, plus a localStorage cache for
fast first-paint reads. This change turns the two timing constants into synced settings, reusing
that mechanism end-to-end. Driven by FR1–FR8 of the proposal.

## Goals / Non-Goals

**Goals:**
- Make both timing values user-configurable and cross-device synced (FR1, FR2, FR5).
- Apply changes at runtime without an app reload (FR3, FR4).
- Preserve exact current behavior by default (G3, M1).

**Non-Goals:**
- No backend, wire-schema, or IndexedDB-schema changes (NG3) — `settings` already stores arbitrary key/value.
- No configurable ping/refresh timing (NG1); no per-entity overrides (NG2); no master pause switch (NG4).

## Decisions

### D1: Store as synced settings, mirror `day_boundary`

Both values become entries in the `settings` store, added to `SYNCED_SETTING_KEYS`. `SettingsService`
gains typed getters (`getSyncIntervalMinutes`, `getAutoSyncDelaySeconds`) that parse, validate, and
default (invalid → default; no clamping — see D2). `useSettings` exposes read state + setters and mirrors writes into the localStorage cache
(`syncCache`) exactly as `dayBoundary` does, so `SyncProvider` reads correct timing before IndexedDB
finishes loading.

*Alternative considered:* localStorage-only preference (like theme/language). Rejected — the
requirement is explicit cross-device sync (G2), which the `settings` path already provides for free.

### D2: Values stored as strings; parse at the edge

Settings values are strings on the wire. We store minutes/seconds as decimal integer strings
(`"5"`, `"15"`, `""`). Parsing/clamping/defaulting happens in `SettingsService` getters, which return
either a positive number or a sentinel for "disabled/immediate". Empty string is a valid, meaningful
value (interval → disabled; delay → immediate), distinct from "absent" (→ default). Milliseconds
never appear in storage or UI — conversion (`* 60000` / `* 1000`) happens only where the timers are set.

Invalid values (non-numeric, non-integer, out-of-range) fall back to the **default** — they are never
clamped: clamping `"5000"` to 1440 would silently invent a value the user never chose. Self-healing is
read-only with respect to the settings store: the getter returns the default and removes the invalid
localStorage cache entry, but never rewrites the IndexedDB value (no `needsSync` write → no
self-inflicted sync cycle). An invalid stored value is replaced only by an explicit user write or a
valid pulled value (FR7).

### D3: Debounce reads current value via ref (T3)

`schedulePush` uses `setTimeout` afresh on every call, so we keep the effective delay in a
`delayMsRef` updated whenever the setting changes; `schedulePush` reads `delayMsRef.current` at
schedule time. A `0`/empty delay schedules `setTimeout(sync, 0)` — an immediate (next-tick) sync that
still coalesces synchronous bursts.

*Alternative considered:* recreate the debounce closure via `useCallback` deps. Works, but a ref
avoids re-subscribing every consumer of `schedulePush` and keeps the mutex/timer refs stable.

### D4: Periodic interval recreated by an effect keyed on the value (T2)

Unlike the debounce, the periodic sync is a long-lived `setInterval` created once. To apply changes
at runtime we move it into a `useEffect` keyed on the effective interval value: the cleanup clears the
old interval and the effect body creates a new one. When the value is "disabled" the effect creates
no interval (and clears any existing one). This is the one genuinely new control-flow wrinkle versus
the debounce.

*Alternative considered:* a self-rescheduling `setTimeout` chain that re-reads the value each tick.
Rejected — an effect keyed on the value is simpler, declarative, and matches existing SyncProvider
timer patterns; teardown on unmount already exists.

### D5: Constants become defaults, not sources of truth

`SYNC_INTERVAL_MS` / `SYNC_DEBOUNCE_MS` are retained and reused as the default when the setting is
absent, guaranteeing byte-for-byte current behavior (M1). New sibling constants:
`DEFAULT_SYNC_INTERVAL_MIN = 5`, `MIN/MAX_SYNC_INTERVAL_MIN = 1/1440`,
`DEFAULT_AUTO_SYNC_DELAY_SEC = 15`, `MIN/MAX_AUTO_SYNC_DELAY_SEC = 0/900`. No hardcoded literals in
logic (code-style rule). To avoid drift between the two representations of the same default, the ms
constants are redefined as derived values: `SYNC_INTERVAL_MS = DEFAULT_SYNC_INTERVAL_MIN * 60_000`,
`SYNC_DEBOUNCE_MS = DEFAULT_AUTO_SYNC_DELAY_SEC * 1000`.

### D6: UI reuses the `DayBoundarySection` pattern

A new `SyncTimingSection` renders two labeled integer inputs with unit suffixes, `aria-describedby`
help text, and a `SyncIndicator` per key, committing on blur/Enter with revert-on-invalid. It is
placed in `AccountSyncSection` above `ServerSection`. If persisting a committed value fails, the input
reverts to the last stored value and the failure is visibly indicated (UX5); the sync engine keeps
running on the previous timing.

### D7: Value propagation into SyncProvider (local writes and pull)

`SyncProvider` owns both timers and must learn about new values even when the settings UI is not
mounted, so it never depends on `useSettings` component state. It reads both settings itself
(localStorage cache synchronously at start-up, then `SettingsService`) and re-reads them when:

- the existing `sync_complete` event fires after a sync — this covers values arriving via **pull**
  (FR3, FR4, G2, U4);
- a new `SYNC_TIMING_CHANGED_EVENT` (constant in `src/constants/index.ts`) is dispatched by the
  `useSettings` setters after a local write, mirroring the existing `DAY_BOUNDARY_CHANGED_EVENT`
  pattern.

The re-read updates `delayMsRef` (D3) and the state value driving the interval-recreation effect
(D4). Both listeners are removed on unmount.

*Alternative considered:* subscribing `useSettings` to `sync_complete` and pushing values down.
Rejected — `useSettings` state is per-component and absent while the settings page is closed; the
owner of the timers must be the subscriber.

## Consequences

Positive:
- Each device can be tuned to its workflow, while defaults keep today's behavior byte-for-byte (G3, M1).
- Reuses the existing settings sync path and the existing `sync_complete` event end-to-end — no new
  infrastructure, schema, or protocol.
- Pulled values take effect without an app reload (U4) through the same re-read path as local writes.

Negative:
- `SyncProvider` gains two event subscriptions and a re-read path — more moving parts in an already
  central component.
- Both timer lifecycles now depend on runtime state; tests must cover recreation and teardown, not
  only creation.

## Risks / Trade-offs

- **Cross-device lag** → A changed value reaches another device only on its next pull; the new timing
  "catches up" one sync cycle later. Acceptable and inherent to LWW sync.
- **Self-referential write triggers a push** → `useSettings` calls `schedulePush()` after every
  write, including writing the timing settings themselves. The write schedules exactly one sync using
  the *new* value — desired, and bounded by NFR-P1 (no more than one cycle per write).
- **Both disabled at once** (interval empty + delay empty/0) → Background sync then relies only on
  mount, `online`, manual click, and debounced-after-edit. This is a valid user choice; UX3 help text
  makes the consequence visible. Not a bug.
- **Stale/corrupt cached value at start-up** → Self-healing getters fall back to the default and
  remove the bad cache entry (FR7), so the sync engine never receives `NaN`/negative timeouts.
- **Immediate delay hammering** → `0` ms still coalesces synchronous bursts via debounce reset; worst
  case is one sync shortly after each distinct edit, which the mutex serializes.

## Migration Plan

No data migration. On first load after deploy, neither key exists → getters return defaults →
identical behavior. When the user first sets a value it is created with `needsSync` and propagates
normally. Rollback is safe: removing the feature reverts to the constants; any stored `sync_interval`
/`auto_sync_delay` settings become inert extra rows in the `settings` table (ignored).

## Open Questions

None — bounds and disable semantics are confirmed (interval 1–1440 min, empty = disabled; delay
0–900 s, 0/empty = immediate; defaults 5 min / 15 s).
