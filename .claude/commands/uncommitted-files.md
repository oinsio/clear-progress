---
description: List uncommitted/untracked files and save as a checklist to uncommitted-files.md
---

# List Uncommitted Files

Generate a numbered checklist of all uncommitted and untracked files in the project, save it to `uncommitted-files.md`, then verify completeness.

## Steps

### Step 1: Collect files

Run `git status --porcelain` to get all modified, staged, and untracked files. Exclude `uncommitted-files.md` itself from the list.

### Step 2: Merge with existing checklist

Check if `uncommitted-files.md` already exists in the project root.

**If it exists:**

1. Read the file and parse each line as a checklist item (`[x]` or `[ ]`).
2. Remove lines marked as completed (`[x]`) — these are done and no longer needed.
3. Keep lines marked as uncompleted (`[ ]`) that are still present in `git status`.
4. Remove uncompleted lines for files that no longer appear in `git status` (already committed or reverted).
5. Add new files from `git status` that are not yet in the checklist — append them at the end.

**If it does not exist:**

Create a new checklist with all files from `git status`.

### Step 3: Generate checklist

Format each file as a numbered checklist item:

```
1. [ ] path/to/file-a.ts
2. [ ] path/to/file-b.ts
```

Sort entries alphabetically (existing uncompleted items + new items together). Re-number sequentially. Write the result to `uncommitted-files.md` in the project root.

### Step 4: Verify

Run `git status --porcelain` again and compare the output (excluding `uncommitted-files.md`) against the contents of `uncommitted-files.md`. Every file in `git status` must appear in the checklist and vice versa. If any files are missing, append them to the checklist and re-number. Report the final count to the user.