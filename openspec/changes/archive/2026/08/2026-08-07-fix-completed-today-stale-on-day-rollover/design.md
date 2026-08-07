## Context

Driven by FR1–FR8 of this change. "Today"-relative UI surfaces compute the logical date imperatively at render/`useMemo` time with no dependency on the passage of time. When the app stays mounted across a day boundary, the logical date the UI used is never recomputed, so five surfaces go stale (see proposal Impact): `ActiveTasksPage` completed-today (`ActiveTasksPage.tsx:145`), `CompletedPage` grouping (`CompletedPage.tsx:77`), `TaskItem` label (`TaskItem.tsx:244`), `GoalItem` label (`GoalItem.tsx:99`), `TaskDetailsTab` next-date label (`TaskDetailsTab.tsx:311`).

Current constraints:
- The only existing day-boundary timer lives inside `useHiddenTasksReveal.ts:37-62` (`scheduleNextBoundary`), but it only triggers hidden-task reveal — it never publishes a date to render state.
- The repo already has the exact reactive pattern needed: `stores/menuOrderStore.ts` (module-level store: `getSnapshot`/`subscribe`/setter) consumed via `useSyncExternalStore` in `hooks/useMenuOrder.ts`. React 18.3, no external state library.
- Time is always accessed through the `Clock` abstraction (`lib/temporal.ts`): `systemClock` in prod, `fakeClock` in tests. `vi.useFakeTimers`/`Date.now` are forbidden.

## Goals / Non-Goals

**Goals:**
- Provide one shared reactive logical-date source so all five surfaces update on day rollover without a remount (FR1, FR3–FR7).
- Keep exactly one boundary timer + one set of re-arm listeners app-wide (NFR-P1, FR2).
- Extract the boundary-timer math into a shared helper reused by `useHiddenTasksReveal` with zero behavior change (FR8).

**Non-Goals:**
- Changing `getLogicalDate` or the day-boundary setting UI (NG1).
- Changing reveal behavior (NG2) — pure refactor of its timer math.
- Reactivity for authoring-time date defaults (NG3).

## Decisions

### D1: Components subscribe directly to a module-level store (not prop-drilling)

`todayCompleted`/grouping consumers add the reactive date to their `useMemo` deps; leaf label components (`TaskItem`, `GoalItem`, `TaskDetailsTab`) call `useLogicalToday()` directly.

**Why over prop-drilling the date from list parents:** a module-level store means the number of subscribers is decoupled from the number of timers — one timer regardless of list length (NFR-P1). Prop-drilling would still need the timer somewhere, and would additionally require threading a prop through `TaskList→TaskItem`, `GoalList→GoalItem`, and into `TaskDetailsTab` — five render paths, easy to miss one. Direct subscription has every consumer self-register, so no path can be forgotten.

**Alternative considered — event-only (`dispatchEvent` on boundary, each consumer bumps local state):** rejected because it duplicates subscription bookkeeping in every component and has no single snapshot; `useSyncExternalStore` gives a consistent snapshot and tearing-free reads for free.

### D2: Implement as `logicalTodayStore` + `useLogicalToday`, mirroring `menuOrderStore`/`useMenuOrder`

- `stores/logicalTodayStore.ts`: holds `currentSnapshot: ISODate`, a `Set<Listener>`, and exports `getSnapshot()`, `subscribe(listener)`, plus internal recompute. Snapshot recomputed via `getLogicalDate(clock, getCachedDayBoundary())`; `emitChange()` only fires when the date string actually changes (avoids needless renders on spurious re-arms).
- `hooks/useLogicalToday.ts`: `useSyncExternalStore(subscribe, getSnapshot)` — a one-line hook, exactly like `useMenuOrder`.
- Testability: export `_resetForTesting()` and allow injecting a `Clock` (default `systemClock`) so `fakeClock` drives the store in tests — same seam the reveal tests use.

### D3: Ref-counted lazy timer lifecycle (resolves proposal Q1)

The store starts its boundary timer and attaches re-arm listeners (`visibilitychange`, `pageshow`, `DAY_BOUNDARY_CHANGED_EVENT`) when the **first** subscriber registers, and tears them down when the **last** unsubscribes.

**Why over always-on from module load:** cleaner in tests (no dangling timer between cases), no work when no "today" surface is mounted, and it matches `useSyncExternalStore`'s subscribe/unsubscribe lifecycle. Trade-off: slightly more bookkeeping than a module-load singleton — acceptable and covered by unit tests.

### D4: Extract `scheduleNextBoundary(clock, dayBoundary, onFire)` into a shared helper

Move the pure `nextBoundary`/`msUntilBoundary` math (currently `useHiddenTasksReveal.ts:37-62`, incl. `BOUNDARY_BUFFER_MS`) into a shared module. `useHiddenTasksReveal` calls it with `onFire = revealTasks`; the store calls it with `onFire = recompute`. The helper self-reschedules via the caller re-invoking it inside `onFire` (same shape as today). No observable change to reveal (FR8) — guarded by the existing `useHiddenTasksReveal.midnight.test.ts`.

### D5: Consumer wiring

- `ActiveTasksPage`/`CompletedPage`: `const logicalToday = useLogicalToday();` added to the `useMemo` deps alongside `completedTasks`.
- `TaskItem`/`GoalItem`/`TaskDetailsTab`: `useLogicalToday()` called (value used to key the label or simply to force re-render); label functions keep reading `getCachedDayBoundary()` as today. Because these are list leaves, subscribing them directly is what makes the labels reactive.

## Risks / Trade-offs

- **Every `TaskItem` in a long list subscribes to the store** → With a module-level store this is cheap (Set insert + one shared snapshot); still, re-render on rollover touches all mounted items at once. Mitigation: `emitChange` fires only on an actual date-string change (≤ once/day), so the mass re-render happens at most once per boundary.
- **Refactoring `useHiddenTasksReveal`'s timer could regress reveal timing** → Mitigation: extraction is behavior-preserving and covered by `useHiddenTasksReveal.midnight.test.ts`; run it before/after.
- **Timer drift / suspended tabs** (a backgrounded tab may not fire the timeout on time) → Mitigation: `visibilitychange`→visible and `pageshow` re-arm recompute immediately on return, so a missed timeout self-heals (U3).
- **Two independent timers (reveal + store) firing near the same boundary** → Acceptable; they do different work and both use the shared helper with the same buffer. No shared mutable state between them.

## Migration Plan

Additive, no data migration. Deploy the store/hook/helper and rewire consumers together. Rollback = revert the change; no persisted state or schema is touched. No feature flag needed (client-only behavior, covered by tests).

## Open Questions

None — Q1 from the proposal is resolved by D3 (ref-counted lazy lifecycle).
