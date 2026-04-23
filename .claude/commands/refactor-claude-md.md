---
description: Audit and refactor CLAUDE.md using Anthropic's official best practices. Runs in dry-run mode by default; pass --apply to write changes.
argument-hint: "[path/to/CLAUDE.md] [--apply]"
---

# Refactor CLAUDE.md

You are a senior engineer auditing a `CLAUDE.md` file. Refactor it into a lean, high-signal document following Anthropic's official best practices for Claude Code.

## Arguments

Parse `$ARGUMENTS` as follows:

- **Path argument** (optional): any non-flag token is the path to the target `CLAUDE.md`. Default: `./CLAUDE.md`.
- **`--apply` flag** (optional): when present, write the refactored files to disk after presenting the plan. When absent, run in **dry-run mode** — propose everything, write nothing.

If `$ARGUMENTS` is empty, use defaults: `./CLAUDE.md` in dry-run mode.

Announce the parsed mode and path in the first line of your response, e.g.:
> Running in **dry-run** mode on `./CLAUDE.md`. No files will be written. Pass `--apply` to persist changes.

---

## Core Constraint (Why This Exists)

`CLAUDE.md` is loaded into context **at the start of every single session**. Every line costs tokens forever and competes for Claude's attention. A bloated `CLAUDE.md` is worse than a missing one — important rules get lost in the noise and Claude ignores them.

Your job is to make this file **shorter, sharper, and more effective**.

---

## Core Principles (Non-Negotiable)

### 1. The Deletion Test
For every line, ask: **"If I remove this, will Claude start making mistakes in this project?"**
- **No** → delete it.
- **Unsure** → delete it. It can always come back if a real failure mode surfaces.
- **Yes** → keep it, but check if it belongs in a more targeted mechanism (skill, hook, subagent).

### 2. Context Is a Finite Resource
Treat `CLAUDE.md` like a hot path. Every token must earn its place.

### 3. Right Mechanism for the Right Knowledge

| Knowledge type                                    | Correct location                                  | Why                     |
|---------------------------------------------------|---------------------------------------------------|-------------------------|
| Rules applying to **every** session, project-wide | `CLAUDE.md`                                       | Always loaded           |
| Domain-specific workflows, occasional knowledge   | `.claude/skills/<name>/SKILL.md`                  | Loaded on demand        |
| Actions that **must** happen deterministically    | `.claude/settings.json` hooks                     | Guaranteed execution    |
| Specialized review / investigation tasks          | `.claude/agents/<name>.md` subagents              | Isolated context        |
| Deep reference documentation                      | Regular docs, linked via `@path` from `CLAUDE.md` | Avoids context bloat    |
| Personal notes not meant for the team             | `CLAUDE.local.md` (gitignored)                    | Keeps shared file clean |

### 4. Claude Already Knows a Lot
Do not instruct Claude on what it can infer from `package.json`, `tsconfig.json`, `pyproject.toml`, `Cargo.toml`, or the file tree. Do not state standard language/framework conventions.

---

## Execution Flow

Follow these phases **in order**. Do not skip.

### Phase 1: Explore (read-only)
1. Read the target `CLAUDE.md` in full.
2. List the project's top-level structure (one level deep is enough).
3. Check for `.claude/` directory — list existing skills, hooks, subagents, commands.
4. Resolve all `@imports` in the file and read them.
5. Read the relevant manifest(s) — `package.json`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Gemfile`, etc. — to see what's already discoverable.

### Phase 2: Classify
Build a working table: **Line / Section | Verdict (Keep / Remove / Migrate) | Reasoning**.
Apply the Deletion Test to every meaningful line. Be ruthless.

#### ✅ KEEP
- Bash commands Claude **cannot guess** (non-standard scripts, custom CLIs, unusual flags)
- Code style rules that **differ** from language defaults
- Test commands and preferred test runners (especially when multiple exist)
- Repository etiquette specific to this project (branch naming, PR conventions, commit format)
- Architectural decisions specific to this project (e.g., "never import from `internal/` across domains")
- Environment quirks (required env vars, required versions, platform setup)
- Non-obvious gotchas (e.g., "migrations must run before tests")

#### ❌ REMOVE
- Anything discoverable from manifests or file structure
- Standard language/framework conventions
- Detailed API documentation — **link to docs instead**
- Frequently-changing info (version numbers, people, sprint goals)
- Long explanations, tutorials, "why we chose X" essays
- File-by-file codebase descriptions
- Self-evident practices ("write clean code", "handle errors")
- Duplicate rules phrased differently across sections

#### 🔄 MIGRATE (good content, wrong place)

| Pattern                                                   | Destination                                   |
|-----------------------------------------------------------|-----------------------------------------------|
| Domain-specific conventions (only relevant in one module) | `.claude/skills/<domain>/SKILL.md`            |
| "Always run X after editing Y"                            | Hook in `.claude/settings.json` (PostToolUse) |
| Specialized review/audit procedures                       | `.claude/agents/<name>.md` subagent           |
| Reference material / long explanations                    | Docs file, linked via `@docs/<name>.md`       |
| Personal preferences not for the team                     | `CLAUDE.local.md` (gitignored)                |

### Phase 3: Propose Migrations
For every `Migrate` item, specify the **exact** target path and draft the full content for that target. No content is silently dropped — if it has value, it must land somewhere.

### Phase 4: Rewrite
Produce the new `CLAUDE.md`. Structural rules:
- Short section headers: `# Code style`, `# Workflow`, `# Testing`, `# Gotchas`
- Bullet lists, not prose paragraphs
- One rule per line when possible
- No tutorial-style explanations — directives, not essays
- Target length: **roughly 20–50 lines** for most projects. If more, scrutinize again.
- `IMPORTANT` / `YOU MUST` markers reserved **only** for rules Claude has historically violated
- Use `@path/to/file` to reference files that should be loaded on demand

### Phase 5: Self-Verify
Run the checklist at the bottom. If anything fails, iterate before presenting output.

### Phase 6: Present or Apply
- **Dry-run (default):** present the three artifacts below. Do not touch the filesystem. End with: *"Run this command again with `--apply` to write these changes."*
- **With `--apply`:** present the three artifacts, then write all files. For each written file, report the path. After writing, remind the user: *"Review `git diff` before committing."*

---

## Output Format (Three Artifacts)

### 1. Audit Report
A structured summary:
- **Mode:** dry-run or apply
- **Target:** path to the refactored file
- **Stats:** lines before → lines after, percentage reduction
- **Kept:** count of retained lines, grouped by section
- **Removed:** bulleted list of removed items, each with a one-line reason
- **Migrated:** table with columns *Source content | Destination | Reason*

### 2. New `CLAUDE.md`
The complete proposed replacement, in a fenced code block labeled ```markdown.

### 3. Migration Artifacts
For each migrated item, show in a fenced code block:
- **Path:** the new file path
- **Content:** the full file content
- **Reason:** one line on why this mechanism (skill vs. hook vs. subagent vs. docs vs. local)

If running with `--apply`, write each file after presenting it.

---

## Before / After Examples

These illustrate the transformation pattern. Apply the same reasoning to the target file.

### Example 1: Remove what Claude already knows

**Before (6 lines, zero signal):**
```markdown
# About the project
This project is a web application built with React and TypeScript.
It uses Vite as the build tool and Tailwind CSS for styling.
The backend is a Node.js Express server.
We follow standard React conventions including functional components and hooks.
All files use TypeScript with strict mode enabled.
```

**After:**
```markdown
(deleted — all discoverable from package.json, tsconfig.json, and file extensions)
```

### Example 2: Migrate to a hook

**Before (advisory, often ignored):**
```markdown
# Code quality
- ALWAYS run `npm run lint:fix` after editing any `.ts` or `.tsx` file.
- ALWAYS run `npm run typecheck` before declaring a task complete.
```

**After in `CLAUDE.md`:**
```markdown
# Verification
- Lint and typecheck run automatically via hooks. Address any failures they surface.
```

**Plus new hook in `.claude/settings.json`:**
```json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "npm run lint:fix && npm run typecheck" }
        ]
      }
    ]
  }
}
```

**Reasoning:** Advisory rules are inconsistently followed. Hooks are deterministic.

### Example 3: Migrate to a skill

**Before (domain knowledge loaded on every session):**
```markdown
# Payment processing
When working with the payment module in `src/payments/`:
- Never log card numbers, CVVs, or PAN data.
- Amounts are integers in minor units (cents), never floats.
- Use the `PaymentIntent` aggregate; never call Stripe SDK directly from controllers.
- Idempotency keys required on all write operations.
- Refunds go through `RefundService` for audit logging.
```

**After in `CLAUDE.md`:**
```markdown
(removed — migrated to skill)
```

**Plus new `.claude/skills/payments/SKILL.md`:**
```markdown
---
name: payments
description: Conventions for the payment module in src/payments/. Use whenever editing payment, refund, or Stripe-related code.
---
# Payments
- Never log card numbers, CVVs, or PAN data.
- Amounts: integers in minor units (cents), never floats.
- Use `PaymentIntent` aggregate; never call Stripe SDK from controllers.
- Idempotency keys required on all write operations.
- Refunds go through `RefundService` for audit logging.
```

**Reasoning:** Only relevant when touching `src/payments/`. As a skill, it loads on demand instead of consuming baseline context on every session.

### Example 4: Keep high-signal content as-is

**Before and after (unchanged):**
```markdown
# Gotchas
- `make dev` requires `DATABASE_URL` to be set, or it silently falls back to SQLite.
- Migrations must run before any test — `make test` does this, `pytest` directly does not.
- The `legacy/` directory is frozen. Do not modify files there without an explicit request.
```

**Reasoning:** Each line passes the Deletion Test. Non-obvious behaviors Claude cannot infer from code, with concrete failure modes if violated.

---

## Self-Verification Checklist

Verify every item before presenting output. If any fails, iterate.

- [ ] Every remaining line passes the Deletion Test
- [ ] No line describes what's in `package.json` / `tsconfig.json` / equivalent
- [ ] No line states a standard language/framework convention
- [ ] No line is longer than necessary — prose compressed into directives
- [ ] No duplicate rules phrased differently across sections
- [ ] Every removed item has a documented fate (deleted, migrated, moved to local)
- [ ] Every migration target is justified (why skill vs. hook vs. subagent vs. docs)
- [ ] New file uses short section headers and bullet lists
- [ ] Meaningfully shorter than original (aim for ≥30% reduction, usually more)
- [ ] `IMPORTANT` / `YOU MUST` markers reserved for historically-violated rules
- [ ] Referenced files use `@path/to/file` so Claude loads them on demand
- [ ] No valuable content was silently dropped

---

## Anti-Patterns to Avoid

- **Expanding** `CLAUDE.md` under the theory "more rules = better behavior." The opposite is true past a threshold.
- **Keeping rules "just in case."** If the Deletion Test can't justify them, they go.
- **Skill-dumping:** migrating everything to skills just to shorten `CLAUDE.md` while bloating `.claude/skills/` with low-value entries. Skills have a quality bar too.
- **Verbose rewrites** under the guise of "clarity."
- **Generic best-practices sections** with advice Claude already follows by default.
- **Silent drops:** removing content without stating where it went.

---

## Final Principle

The best `CLAUDE.md` is one so lean that every remaining line is obviously necessary. If someone asks "why is this rule here?", the answer should be immediate and specific — tied to a real failure mode in this project. If the answer is "it seemed like a good idea," the line should not exist.

Refactor accordingly.
