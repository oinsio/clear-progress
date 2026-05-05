# Clear Progress

Personal GTD app. Client-first architecture.

IMPORTANT: Read existing code, tests, and patterns before generating new code.

## Code Style

- No hardcoded values — @.claude/rules/code-style.md
- Descriptive naming — @.claude/rules/naming.md

## Data Rules

- **IDs**: UUID v4, generated client-side via `crypto.randomUUID()`
- **Soft delete**: set `is_deleted = true`, never remove rows
- **Versioning**: increment `version` (+1) on every change — used for sync
- **Timestamps** (created_at, updated_at, completed_at): ISO 8601 with Z suffix (`"2025-01-15T10:30:00.000Z"`)
- **Date-only** (next_date, appear_date): ISO date format (`"2025-01-15"`)
- **Empty optional fields**: use `""` (empty string), never `null` or `undefined`
- **sort_order**: integer for manual ordering within lists

## Testing

- **TDD**: Red-Green-Refactor cycle — @.claude/docs/tdd-workflow.md
- **Mutation testing**: `npm run test:mutation` — target ≥95% score
- **BDD Unit** (vitest-cucumber): @.claude/docs/architecture/bdd-unit-vitest-cucumber.md
- **BDD E2E** (playwright-bdd): @.claude/docs/architecture/bdd-e2e-playwright-bdd.md

## Architecture

- Data model & sync: @.claude/docs/data-model-and-sync.md
- Recurring tasks: @.claude/docs/architecture/recurring-tasks-skip-logic.md, @.claude/docs/architecture/recurring-tasks-timezone-policy.md

## Post-Edit Workflow

1. Call `getDiagnostics` via JetBrains MCP for changed files — fix errors immediately
2. Run `pnpm run build` to verify build