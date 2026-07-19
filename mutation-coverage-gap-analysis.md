# Mutation coverage gap analysis — task 6.2 (fix-stale-sync-overwrites)

Scope: `TaskRepository.ts`, `GoalRepository.ts`, `ContextRepository.ts`, `CategoryRepository.ts`.

## Summary

Stryker's whole-file mutation score for these 4 files (53–56% for Goal/Context/Category, 94% for Task)
is below the M3 threshold (>=95%, min 90%). All surviving/uncovered mutants sit in code this change
did **not** touch. The code this change actually modified — the FR5 LWW wiring inside
`applyServerRecords()` (via `shouldOverwritePendingLocalRecord` from `applyServerRecordLww.ts`) — has
a 100% mutant kill rate in all 4 files. No mutant inside the diff introduced by this change survived
or went uncovered.

## Uncovered functionality, by file

### GoalRepository.ts / ContextRepository.ts / CategoryRepository.ts (same shape in all three)

1. **`create()` schema-validation branch** (Goal L22-29, Context L22-29, Category L22-29)
   - Survived mutant: `if (!result.success)` → `if (false)` at line 24.
   - Meaning: no test ever calls `create()` with data that fails `Client*Schema.safeParse`. The
     error-logging (`console.error(...)`) and `throw new Error(...)` branch is never exercised, so a
     mutant that deletes the branch condition survives.

2. **`update()` schema-validation branch** (Goal L31-38, Context L31-38, Category L31-38)
   - NoCoverage on the whole `if` block, both string literals (`""`,` `` `).
   - Same gap as `create()`, but for `update()`.

3. **`bulkUpsert()` per-item schema-validation branch** (Goal L40-49, Context L40-49, Category L40-49)
   - NoCoverage on the `if (!result.success)` block inside the loop, including the `result.success`
     boolean literal and both `ConditionalExpression` mutants (true/false).
   - Meaning: no test calls `bulkUpsert()` with an item that fails validation; the loop's early
     `throw` for a bad item is never reached.

4. **`getChangedSince()`** (Goal L51-53, Context L51-53, Category L51-53)
   - NoCoverage on the whole method body and its string literal.
   - Meaning: no test calls `getChangedSince()` at all for these three repositories.

5. **`getNeedingSync()` filter predicate** (Goal L55-57, Context L55-59, Category L55-59)
   - NoCoverage on the whole filter arrow function, the `MethodExpression` (`db.goals`/`db.contexts`/
     `db.categories`), the `EqualityOperator` (`syncStatus === "pending"` → `!== "pending"`), and both
     `ConditionalExpression` mutants.
   - Meaning: no test calls `getNeedingSync()` for these three repositories, so the pending-status
     filter logic is unverified.

### TaskRepository.ts

1. **`getByGoalId()` visibility filter** (L35-47)
   - Survived mutant: `options?.includeHidden || !task.is_hidden` → `true` at line 44 (the whole
     filter condition replaced by a constant `true`).
   - Meaning: existing tests call `getByGoalId()` but never assert that a *hidden* task is excluded
     when `includeHidden` is falsy/omitted — so a mutant that makes the filter always pass survives.
     Need a case where a hidden task exists and `includeHidden` is not set (or `false`), asserting it
     is excluded from the result, alongside a case where `includeHidden: true` returns it.

2. **Delete/soft-delete style validation branches** (L79-101, three near-identical blocks)
   - NoCoverage on three `BlockStatement`s plus their string literals — same shape as the
     create/update/bulkUpsert validation gaps above (this file has 3 write-path methods with
     validation instead of 3 repositories × 1 pattern each).

## Why this is out of this change's scope

Every one of the above gaps pre-dates `fix-stale-sync-overwrites`: `create`, `update`, `bulkUpsert`,
`getChangedSince`, `getNeedingSync`, and `getByGoalId` are unmodified by this change (confirmed via
`git diff main` for each file — the diff is confined to the new import, the `*_ENTITY_NAME` constant,
and the body of `applyServerRecords()`). FR5 and M3 (proposal.md) scope mutation testing to the
behavior this change introduces; closing these gaps would mean writing schema-validation and
query-filter characterization tests unrelated to LWW pull protection.

## Disposition

Per user decision: analysis recorded here; task 6.2 is considered satisfied on a diff-scoped basis
(100% mutant kill rate within the actual change). No new tests were added for the pre-existing gaps
listed above. If closing them is wanted later, it should be a separate, explicitly-scoped change
(new tests for `create`/`update`/`bulkUpsert` validation branches, `getChangedSince`, `getNeedingSync`,
and `getByGoalId`'s hidden-task filter across these 4 repositories).
