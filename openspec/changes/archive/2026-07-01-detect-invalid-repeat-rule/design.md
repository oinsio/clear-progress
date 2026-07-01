## Context

`TaskService.complete()` calls `parseRepeatRule()` which uses `RepeatRuleSchema.safeParse()` — a Zod discriminated union accepting only `type: "fixed"` and `type: "after_completion"`. When validation fails, the function returns `null`, and the completion flow silently skips recurring copy creation. The detail panel also calls `parseRepeatRule()` and shows "No repeat" for invalid rules.

Currently, sync alerts live in `SyncProvider` via `pendingSyncAlerts` state. Adding another alert type (repeat rule) would duplicate this pattern. A universal `AlertProvider` centralizes alert management for all current and future alert types.

## Goals / Non-Goals

**Goals:**
- Single `isRepeatRuleInvalid()` function as source of truth (FR1)
- Discriminated union from `complete()` so callers can distinguish "no rule" from "broken rule" (FR2)
- `AlertProvider` that replaces `SyncProvider` alert state and supports paginated navigation (FR6, FR7, FR8)
- Post-pull diff check for invalid rules with grouped alert (FR5, FR9)

**Non-Goals:**
- Auto-repair of invalid rules (NG1)
- Server-side validation (NG3)
- Toast/snackbar system — alerts use modal dialogs only

## Decisions

### D1: AlertProvider replaces SyncProvider alert state

**Decision**: Create `AlertProvider` at `src/app/providers/AlertProvider.tsx`. Move `pendingSyncAlerts` and `clearSyncAlerts` out of `SyncProvider`. SyncProvider calls `alertContext.addAlerts()` instead.

**Rationale**: SyncProvider already handles sync orchestration — alert presentation is a separate concern. A shared provider prevents duplicating queue/navigation logic for each alert type.

**Alternatives considered**:
- Extend SyncProvider with `pendingRepeatRuleAlerts` — simpler but couples sync with unrelated concerns, doesn't scale
- Event-based (CustomEvent) — lose React lifecycle, harder to test

### D2: Typed alert discriminated union

**Decision**: Alerts use a discriminated union by `type`:

```typescript
type AppAlert =
  | { type: 'sync'; messageKey: string; params?: Record<string, string> }
  | { type: 'repeat_rule_invalid'; taskNames: string[] };
```

Each type has a dedicated renderer component. `AlertOverlay` maps `type` → component.

**Rationale**: Type-safe, each alert type owns its UI. Adding a new type = add union member + renderer.

### D3: Paginated navigation with positional counter

**Decision**: Single `AlertOverlay` renders one alert at a time with `currentIndex` state. Shows `1/N` counter. Buttons: "Back" (if not first), "Next" (if not last), "Understood" (if last or single). Pressing "Understood" dismisses all alerts.

**Rationale**: Simpler than the current `SyncAlertQueue` sequential-dismiss model. User can review previous alerts without losing them. One dismiss action clears everything.

**Alert ordering**: Sync alerts first (higher priority — data loss), then repeat rule alerts. Defined by `ALERT_TYPE_PRIORITY` constant array.

### D4: Discriminated union for complete() result

**Decision**: Change return type of `TaskService.complete()`:

```typescript
type RecurringResult =
  | { status: 'created'; task: Task }
  | { status: 'skipped_invalid_rule' }
  | { status: 'not_recurring' };

async complete(id: string, logicalDate?: string): Promise<{
  completed: Task;
  recurringResult: RecurringResult;
}>
```

**Rationale**: Callers (4 hooks) can pattern-match on `status` to decide whether to show an alert. `null` was ambiguous between "no rule" and "broken rule".

### D5: Post-pull diff check in SyncProvider

**Decision**: After pull applies, filter the diff batch for active incomplete tasks. Run `isRepeatRuleInvalid()` on each. If any found, call `alertContext.addAlerts([{ type: 'repeat_rule_invalid', taskNames }])`.

**Rationale**: Checking only the diff avoids scanning all tasks on every pull. No persistence needed — if the same task appears in a future diff, it triggers again (FR9).

### D6: Shared validator placement

**Decision**: Add `isRepeatRuleInvalid(task: Task): boolean` to `src/utils/repeatRule.ts` alongside existing `parseRepeatRule()`.

**Rationale**: Keeps validation logic co-located with parsing. No new file needed — the function is a one-liner that composes existing `parseRepeatRule`.

## Risks / Trade-offs

- [Risk] SyncProvider refactoring may break existing sync alert tests → Run full sync alert test suite after migration. Contract is preserved: same alerts, same UI, different state owner.
- [Risk] Multiple callers of `complete()` must all handle new return type → TypeScript compiler enforces exhaustive handling. Change all 4 call sites.
- [Trade-off] Paginated navigation is slightly more complex than sequential dismiss → Better UX (user can go back), worth the extra state management.
- [Trade-off] `taskNames` in alert, not task IDs → User can't click through to the task. Acceptable for v1; can add navigation later if needed.
