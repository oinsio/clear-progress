---
name: "OPSX: Apply Sequential"
description: Implement tasks from an OpenSpec change one-by-one in sub-agents, sequentially. No commits.
category: Workflow
tags: [workflow, artifacts, experimental]
---

Wrapper around `/opsx:apply` that enforces sequential sub-agent execution and no commits.

**How it works**: Invoke `/opsx:apply $ARGUMENTS` via the Skill tool, but with the following additional constraints injected into the execution:

## Execution constraints

1. **One task per sub-agent** — each pending task must be implemented in a separate foreground sub-agent (Agent tool). The sub-agent receives the full task context (proposal, specs, design, affected files) and implements that single task.

2. **Strictly sequential** — do NOT launch the next sub-agent until the current one finishes and returns its result. Never run tasks in parallel.

3. **No commits** — the sub-agent prompt MUST include: "Do NOT make any git commits." The user will commit manually.

4. **Mark progress immediately** — after each sub-agent completes successfully, mark the task as done in the tasks file (`- [ ]` → `- [x]`) and log a brief summary before moving to the next task.

5. **Pause on issues** — if a sub-agent reports a blocker, unclear requirement, or design issue, stop and ask the user before continuing.
