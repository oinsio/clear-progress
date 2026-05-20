---
name: split-large-tests
description: Split a large test file into several smaller, logically-grouped files. Use this skill whenever the user wants to break up, divide, or refactor a big test file (especially Vitest + React/TypeScript tests) into smaller files — for example when a test file exceeds a few hundred lines, when the user mentions splitting tests "by feature" or "by component", or when they ask to make test files smaller or more maintainable. Trigger it even if the user doesn't say the word "split" explicitly, as long as the intent is to reorganize a large test file into multiple files.
---

# Split Large Tests

Break a large test file into several smaller files organized by logical units, while guaranteeing that no test is lost, no code is duplicated, and the suite still passes. This is built for a Vitest + React + TypeScript stack.

## Why this matters

A 1000-line test file is hard to navigate and review. Splitting it makes each file focused and readable. But a careless split silently drops tests, scatters `vi.mock` calls so mocks stop applying, or copy-pastes the same setup into every file. The whole point of this skill is to split *safely* — the verification steps below are not optional polish, they are the core of the task.

## Workflow

### 1. Analyze the source file

Read the full test file. Identify:
- The logical units it contains — group tests by tested component, hook, feature, scenario, or by existing `describe` blocks.
- Shared setup: fixtures, mock factories, `beforeEach`/`afterEach`, render helpers, common imports.
- All `vi.mock(...)` calls and what they mock.
- The total count of `it`/`test` cases (this is the number you must preserve).

### 2. Propose a split structure and WAIT for confirmation

Before creating or modifying ANY file, present the proposed plan to the user and stop. Do not start writing files until the user confirms. The plan should show:
- Each new file name and the logical unit it covers.
- What shared code goes into a shared module.
- The original test count and how many tests land in each new file.

Present it concisely, for example:

```
Proposed split (original: 42 tests):
- LoginForm.test.tsx        — 11 tests (form validation + submit)
- useAuth.test.ts           — 9 tests (auth hook states)
- AuthProvider.test.tsx     — 14 tests (context/provider behavior)
- session.test.ts           — 8 tests (token/session helpers)
- test-utils.tsx (shared)   — renderWithProviders, mock factories
```

Then ask the user to confirm or adjust. Only proceed after they say yes.

### 3. Apply the split

Once confirmed, create the files following these rules.

**Sizing:**
- Target ~100 lines per file, 200 max.
- Split by meaning, not mechanically by line count.
- Never break up a group of related tests just to hit the line limit — the integrity of a logical block matters more than the size target. It is fine for one cohesive file to exceed 200 lines if splitting it would scatter tightly-coupled tests.

**Shared code:**
- Extract fixtures, render helpers, mock factories, and `beforeEach`/`afterEach` that are used across multiple files into a shared module — e.g. `test-utils.ts(x)`, a `renderWithProviders` helper, or a common setup file referenced via `setupFiles` in `vitest.config.ts`.
- Do not copy-paste shared setup into each file; import it.

**Mocks (Vitest-specific, easy to get wrong):**
- `vi.mock(...)` calls are hoisted to the top of the file and apply at the file level. They do NOT carry across files. So each new file must contain the `vi.mock` calls it actually needs.
- For shared mock factories, extract them into a common module using `vi.hoisted(...)` so the hoisting still works correctly when imported.

**Preserve behavior:**
- Do not change test names (`describe`/`it`/`test`) or test logic. This is a move-and-reorganize operation, not a rewrite.
- Give each file a clear name reflecting its contents, e.g. `useAuth.test.ts`, `LoginForm.test.tsx`.

### 4. Verify migration completeness

This step is mandatory.
- Confirm every test from the original file was moved — none lost, none accidentally duplicated.
- The sum of `it`/`test` cases across the new files must equal the original count.
- Produce a mapping list: every migrated test and which file it now lives in, so the user can verify.
- Run `vitest run` and confirm all tests pass and the number of executed tests matches the original count. If the count differs or anything fails, fix it before considering the task done.

### 5. Verify no code duplication

After the split, check for duplicated code across the new files — repeated imports, repeated setup, repeated helper logic. Use the IDE's code analyzer (duplicated code / clone detection inspection) if available; otherwise inspect manually for repeated blocks.
- If you find repeated fragments, extract them into shared helpers, mocks, or fixtures and remove the duplicates.

## Done criteria

The task is complete only when all of these hold:
1. The user confirmed the split structure before any file changes.
2. Every original test exists in exactly one new file (verified by count + mapping).
3. `vitest run` passes with the same number of tests as before.
4. No duplicated code remains across the new files.
