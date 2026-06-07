---
description: Diagnose uncommitted files for errors, code duplication, and unused variables using IDE diagnostics
---

# Diagnose Uncommitted Files

Read `uncommitted-files.md` and analyze each listed file via sub-agents — one per file, strictly sequentially. Fix issues found, mark each file done. No commits.

## Steps

### Step 1: Read the checklist

Read `uncommitted-files.md`. Only process unchecked items (`[ ]`), skip `[x]`.

### Step 2: Analyze files sequentially via sub-agents

For each unchecked file, launch a **foreground sub-agent** (Agent tool, subagent_type: general-purpose) with:

```
Analyze `<absolute-path>` for issues. No commits. Up to 3 fix-verify cycles:

1. Run `mcp__jetbrains__get_file_problems(filePath: "<relative-path>", projectPath: "$ARGUMENTS", errorsOnly: false)`.
   **CRITICAL**: After the call, list EVERY returned issue verbatim in this format:
   - [SEVERITY] line N: "description" — `lineContent snippet`
   If the response contains zero items, write: "IDE returned 0 issues."
   Do NOT summarize or skip issues. Every single item must be listed before proceeding.

2. Fix errors and warnings (ERROR, WARNING, WEAK WARNING).
   The ONLY acceptable exceptions to skip (do not fix):
   - "Duplicated code fragment" where the fragment is a `vi.mock()` block (Vitest hoists these, cannot extract)
   - "Duplicated code fragment" where the fragment is a per-file `type FeatureContext = ...` (vitest-cucumber pattern)
   All OTHER "Duplicated code fragment" warnings MUST be handled in step 3A.

3. Fix duplication — three layers, in priority order:
   **A) IDE-reported**: For each "Duplicated code fragment" from step 1 (except the two skippable patterns above): read the other fragment's file/location, compare both, extract shared code into a helper/utility.
   **B) Similar file names**: Glob for files with similar names in sibling dirs (e.g., `GoalAttachmentsTab` → `**/*AttachmentsTab*`). If candidates share >50% logic, extract shared component/hook/utility, reduce originals to thin wrappers.
   **C) Duplicate definitions**: Grep for each function/constant defined in the file (`function <name>` or `const <name>`, with or without `export`). If defined in multiple files, move canonical definition to the best shared location (`test/mocks/`, `defaultServices.ts`, etc.), replace others with imports.
   Run `get_file_problems` on ALL files changed during dedup (not just the original).

4. Check unused variables/imports — Grep the codebase to confirm truly unused before removing.

5. Re-run `get_file_problems`. List ALL returned issues verbatim (same format as step 1). If new issues appeared, repeat from step 2.

**Note**: dedup in step 3 may modify files outside the current one. That's expected — later sub-agents will see those changes.

Your final message MUST use this exact format:
---
**Issues found**: <number> (list each: severity, line, description)
**Issues fixed**: <number>
**Issues skipped (acceptable)**: <number> (list each with reason: vi.mock / FeatureContext / test-arrange-pattern)
**Files changed**: <list or "none">
---
```

**CRITICAL**: Wait for each sub-agent to finish before launching the next.

After each sub-agent completes:
- Mark `[ ]` → `[x]` in `uncommitted-files.md`
- Log result summary

### Step 3: Final verification

Run **sequentially** (wait for each before starting next):

1. `pnpm run lint:fix`
2. `pnpm run preflight`
3. `pnpm run build`

Fix failures before proceeding to the next check.

### Step 4: Report

Summary:
- Total files analyzed
- Files with errors / duplication / unused vars fixed
- Files clean
- Verification status (lint / preflight / build)