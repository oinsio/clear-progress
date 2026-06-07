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
2. Fix errors and warnings (ERROR, WARNING, WEAK WARNING) — except "Duplicated code fragment", handle those in step 3.
3. Fix duplication — three layers, in priority order:
   **A) IDE-reported**: handle any "Duplicated code fragment" from step 1. Read the other fragment's location, compare, extract shared code.
   **B) Similar file names**: Glob for files with similar names in sibling dirs (e.g., `GoalAttachmentsTab` → `**/*AttachmentsTab*`). If candidates share >50% logic, extract shared component/hook/utility, reduce originals to thin wrappers.
   **C) Duplicate definitions**: Grep for each function/constant defined in the file (`function <name>` or `const <name>`, with or without `export`). If defined in multiple files, move canonical definition to the best shared location (`test/mocks/`, `defaultServices.ts`, etc.), replace others with imports.
   Run `get_file_problems` on ALL files changed during dedup (not just the original).
4. Check unused variables/imports — Grep the codebase to confirm truly unused before removing.
5. Re-run `get_file_problems`. If new issues appeared, repeat from step 2.

**Note**: dedup in step 3 may modify files outside the current one. That's expected — later sub-agents will see those changes.

Report what was found and fixed per iteration (or "clean on first pass").
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