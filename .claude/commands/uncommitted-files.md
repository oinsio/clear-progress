---
description: List uncommitted/untracked files and save as a checklist to uncommitted-files.md
---

# List Uncommitted Files

Generate a numbered checklist of all uncommitted and untracked files in the project, save it to `uncommitted-files.md`, then verify completeness.

## Steps

### Step 1: Collect files

Run `git status --porcelain` to get all modified, staged, and untracked files. Exclude `uncommitted-files.md` itself from the list.

### Step 2: Generate checklist

Format each file as a numbered checklist item:

```
1. [ ] path/to/file-a.ts
2. [ ] path/to/file-b.ts
```

Sort entries alphabetically. Write the result to `uncommitted-files.md` in the project root.

### Step 3: Verify

Run `git status --porcelain` again and compare the output (excluding `uncommitted-files.md`) against the contents of `uncommitted-files.md`. Every file in `git status` must appear in the checklist and vice versa. If any files are missing, append them to the checklist and re-number. Report the final count to the user.