---
description: Diagnose uncommitted files for errors, code duplication, and unused variables using IDE diagnostics
---

# Diagnose Uncommitted Files

Read `uncommitted-files.md` and analyze each listed file using sub-agents — one file per sub-agent, strictly sequentially. Fix issues found, mark each file as done after its sub-agent completes. Do not make any commits.

## Steps

### Step 1: Read the checklist

Read `uncommitted-files.md` in the project root. Parse the numbered checklist items. Only process files that are NOT yet checked (i.e., `[ ]`, skip `[x]`).

### Step 2: Analyze files sequentially via sub-agents

For each unchecked file in order, launch a **foreground sub-agent** (Agent tool, subagent_type: general-purpose) with the following prompt template:

```
Analyze the file `<absolute-path>` for issues. Do NOT make any commits.

1. Run `mcp__ide__getDiagnostics(uri: "<absolute-path>")`.
2. If there are `error`-level diagnostics — fix them.
3. Check for unused variables/imports — for each, grep the codebase to confirm it's truly unused. If unused, remove it. If used elsewhere, leave it.
4. Check for code duplication within the file — extract common logic if reasonable.
5. After fixing, re-run diagnostics to confirm no errors remain.
6. Report what you found and fixed (or "no issues").
```

**CRITICAL**: Do NOT launch the next sub-agent until the current one finishes and returns its result.

After each sub-agent completes successfully:
- Update `uncommitted-files.md` by changing `[ ]` to `[x]` for that file.
- Log the sub-agent's result summary before proceeding to the next file.

### Step 3: Final verification

After all files are processed, run these checks **sequentially** (one at a time, wait for each to finish):

1. `pnpm run lint:fix` — all should pass
2. `pnpm run preflight` — all should pass
3. `pnpm run build` — verify no type errors

If any check fails, fix the issues before proceeding to the next one.

### Step 4: Report

After all files are processed and verification passes, print a summary:
- Total files analyzed
- Files with errors fixed
- Files with duplication resolved
- Files with unused variables removed
- Files with no issues
- Final verification status (lint / preflight / build)