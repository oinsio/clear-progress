# Rule: development process invariants

These rules apply to ALL work in the project, regardless of artifact type.

## Archived changes are immutable

Never edit files in `openspec/changes/archive/`. If a change needs correction, create a new change with `Supersedes: <old-change-name>` in proposal.

## File size limit

Keep files under 400 lines. Long files degrade AI context quality. One file = one thing.

## Module boundaries

Import only through `index.ts` of a module. Never import from internal files of a sibling module.

```typescript
// Bad
import { something } from "../notes/domain/noteEntity";

// Good
import { something } from "../notes";
```

## Change naming

Use `kebab-case-descriptive` for change names: `add-tag-search`, `fix-login-bug`, `refactor-sync`. Never use generic names like `update`, `changes`, `wip`.

## Context hygiene

Clean the AI agent context before running `/opsx:apply`, especially for large changes. Stale context leads to incoherent code.

## Artifact layering

Lower-layer artifacts always reference IDs from upper layers:
1. PRD (`proposal.md`) — what and why
2. Domain Spec + Behavior Spec (Gherkin) + IA — what entities, rules, and structure
3. Contract Spec (ports) + Design System + ADR — how layers connect
4. Code + tests — implementation

If an artifact has no upward reference — it is either unnecessary or missing a link.

## Change scope

One change = one initiative, completable in 1-4 weeks. If a change grows beyond that, split it into smaller changes.
