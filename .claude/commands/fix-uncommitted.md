---
description: Diagnose uncommitted files for errors, code duplication, and unused variables using IDE diagnostics
---

# Diagnose Uncommitted Files

Read `uncommitted-files.md` and analyze each listed file one-by-one using IDE diagnostics. Fix issues found, then mark the file as done in the checklist. Do not make any commits.

## Steps

### Step 1: Read the checklist

Read `uncommitted-files.md` in the project root. Parse the numbered checklist items. Only process files that are NOT yet checked (i.e., `[ ]`, skip `[x]`).

### Step 2: Analyze files sequentially

For each unchecked file in order:

1. **Run diagnostics** — call `mcp__ide__getDiagnostics` for the file to get IDE-reported problems.
2. **Check for errors** — if there are `error`-level diagnostics, fix them immediately.
3. **Check for code duplication** — look for duplicated logic that can be extracted into shared utilities or helpers. If duplication is found across files already processed, extract the common code.
4. **Check for unused variables** — for each reported unused variable, verify it is genuinely unused (grep the codebase). If truly unused, remove it. If used elsewhere, the diagnostic is a false positive — leave it.
5. **Mark as done** — once all issues for the file are resolved (or none were found), update `uncommitted-files.md` by changing `- [ ]` to `- [x]` for that file.

IMPORTANT: Process files strictly one at a time. Do NOT start analyzing the next file until the current one is fully resolved and marked as done.

### Step 3: Final verification

After all files are processed, run these checks sequentially:

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