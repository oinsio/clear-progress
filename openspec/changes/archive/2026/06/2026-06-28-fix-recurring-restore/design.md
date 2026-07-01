# Design: fix-recurring-restore

## Context

When `softDelete()` is called on a recurring task with active copies, it promotes the first active copy to be the new chain original (`original_task_id: ""`). The link between the deleted task and the promoted original is lost. When `restore()` is called, the deleted task returns as a second original — creating two independent recurrence chains.

Driven by FR1–FR5 from proposal.md.

Current code: `TaskService.ts`, lines 270–334.

## Goals / Non-Goals

**Goals:**
- Preserve the link during softDelete for correct restore behavior (FR1)
- Conditional restore logic: neutralize repeat_rule or restore as original (FR2–FR5)

**Non-Goals:**
- New fields in data model (NG2)
- UI changes (NG1)
- Refactoring existing logic (NG3)

## Decisions

### D1: Reuse `original_task_id` to store the link to the promoted successor

**Decision**: In `softDelete()`, on promotion, write the promoted copy's ID into the deleted task's `original_task_id`.

**Rationale**: `original_task_id` on a deleted task is effectively unused — the task is out of the chain. Reusing the field preserves the "link to related task" semantics without changing the data model. The context is unambiguous: on a deleted task, `original_task_id` means "who was promoted in my place".

**Alternative**: A new `promoted_to_id` field — rejected because it requires a DB migration, sync protocol changes, and contract updates.

### D2: Conditional repeat_rule clearing on restore

**Decision**: If the promoted successor is alive — clear `repeat_rule`, `next_date`, `appear_date`. The task becomes a regular (one-time) task; the chain stays with the promoted successor.

**Rationale**: Simplest approach with a predictable outcome. User gets the task back (without recurrence), and the chain is not duplicated.

**Alternative 1**: Restore as a copy (`original_task_id` → promoted) — rejected because it violates `original_task_id` semantics (an original cannot be a "copy" of its own copy). Also, completing both A and C would compete for the same hidden copy.

**Alternative 2**: Return originality back to A, making the promoted task a copy again — rejected because the promoted task may have already created its own chain (scenario 5). Reverse rebinding is too complex and risky.

### D3: If the promoted successor is also deleted — restore as original

**Decision**: If `getById(original_task_id)` returns a deleted or non-existent task — clear `original_task_id` and keep `repeat_rule`. The task becomes the chain original again.

**Rationale**: No conflict — no second active original with repeat_rule exists.

## State Transition Diagrams

### softDelete() — with promotion (FR1)

```
Before softDelete(A):
┌─────────────────┐       ┌─────────────────┐
│ A (original)    │──────▶│ B (copy)        │
│ orig_id: ""     │       │ orig_id: "A"    │
│ repeat: daily   │       │ repeat: daily   │
│ is_deleted: F   │       │ is_deleted: F   │
└─────────────────┘       └─────────────────┘

After softDelete(A):
┌─────────────────┐       ┌─────────────────┐
│ A               │       │ B (new original)│
│ orig_id: "B" ◀──│───NEW │ orig_id: ""     │
│ repeat: daily   │       │ repeat: daily   │
│ is_deleted: T   │       │ is_deleted: F   │
└─────────────────┘       └─────────────────┘
  Link preserved!           Promoted
```

### restore() — promoted successor alive (FR3)

```
Before restore(A):
┌─────────────────┐       ┌─────────────────┐
│ A (deleted)     │       │ B (original)    │
│ orig_id: "B"    │       │ orig_id: ""     │
│ repeat: daily   │       │ repeat: daily   │
│ is_deleted: T   │       │ is_deleted: F   │
└─────────────────┘       └─────────────────┘

After restore(A):
┌─────────────────┐       ┌─────────────────┐
│ A (regular)     │       │ B (original)    │
│ orig_id: "B"    │       │ orig_id: ""     │
│ repeat: ""  ◀───│─CLEAR │ repeat: daily   │
│ next_date: ""   │       │ is_deleted: F   │
│ appear_date: "" │       │                 │
│ is_deleted: F   │       │                 │
└─────────────────┘       └─────────────────┘
  One chain only!           Chain stays here
```

### restore() — promoted successor deleted (FR4)

```
Before restore(A):
┌─────────────────┐       ┌─────────────────┐
│ A (deleted)     │       │ B (deleted)     │
│ orig_id: "B"    │       │ orig_id: ""     │
│ repeat: daily   │       │ repeat: daily   │
│ is_deleted: T   │       │ is_deleted: T   │
└─────────────────┘       └─────────────────┘

After restore(A):
┌─────────────────┐       ┌─────────────────┐
│ A (original)    │       │ B (deleted)     │
│ orig_id: "" ◀───│─CLEAR │ orig_id: ""     │
│ repeat: daily   │       │ repeat: daily   │
│ is_deleted: F   │       │ is_deleted: T   │
└─────────────────┘       └─────────────────┘
  Restored as original      Still deleted
```

## Decision Matrix: restore() Behavior

| # | orig_id | repeat_rule | Successor state | Action                               | Resulting state                  |
|---|---------|-------------|-----------------|--------------------------------------|----------------------------------|
| 1 | `""`    | `""`        | N/A             | No changes                           | Regular task                     |
| 2 | `""`    | `"daily"`   | N/A             | No changes                           | Original (no promotion happened) |
| 3 | `"B"`   | `""`        | N/A             | No changes                           | Non-recurring copy               |
| 4 | `"B"`   | `"daily"`   | Active          | Clear repeat, next_date, appear_date | Non-recurring, chain at B        |
| 5 | `"B"`   | `"daily"`   | Deleted         | Clear orig_id                        | Original with repeat             |
| 6 | `"B"`   | `"daily"`   | Non-existent    | Clear orig_id                        | Original with repeat             |
| 7 | `"B"`   | `"daily"`   | Hidden, active  | Clear repeat, next_date, appear_date | Non-recurring, chain at B        |

## End-to-End Scenario Walkthrough

```
Scenario 5: Promoted successor completed and created its own copy

1. complete(A) → B created (orig_id: "A")
2. softDelete(A) → B promoted (orig_id: ""), A.orig_id = "B"
3. complete(B) → C created (orig_id: "B")
4. restore(A):
   - A.orig_id="B", A.repeat="daily"
   - getById("B") → B exists, is_deleted=false
   - → Clear repeat on A

Result:
┌───────────┐   ┌───────────┐   ┌───────────┐
│ A         │   │ B         │   │ C         │
│ repeat:"" │   │ orig:"" ──│──▶│ orig:"B"  │
│ orig:"B"  │   │ compl: T  │   │ compl: F  │
│ del: F    │   │ repeat:✓  │   │ repeat:✓  │
└───────────┘   └───────────┘   └───────────┘
  Regular task    Chain: B → C (single chain)
```

## Risks / Trade-offs

- **[Dual semantics of original_task_id on deleted tasks]** → On a deleted task, `original_task_id` now means "promoted successor" instead of "chain origin". This is safe because deleted tasks are outside the chain. Dedup logic (`findDuplicateRecurringGroups`) filters by `is_deleted: false`, so this change does not affect it. **Mitigation**: behavior is well-scoped to deleted tasks only.
- **[Loss of repeat_rule on restore]** → Trade-off: user loses recurrence on the restored task when the promoted successor is alive. This is better than two chains. The user can manually re-add the repeat_rule if needed. **Mitigation**: the promoted successor continues the chain, so recurrence is not lost system-wide.
