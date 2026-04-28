# Clear Progress

Personal GTD app. React PWA + Google Apps Script backend + Google Sheets storage.

IMPORTANT: Read existing code, tests, and patterns before generating new code.

## Structure

- `packages/client/` — React PWA (see @packages/client/CLAUDE.md)
- `packages/adapter-gas/` — Google Apps Script (see @packages/adapter-gas/CLAUDE.md)
- `packages/contract/` — Shared contract (see @packages/contract/CLAUDE.md)
- `packages/adapter-inmemory/` — In-memory adapter for testing

## Code Style

- TypeScript strict, no `any` unless absolutely necessary
- No default exports (except page components and `db.ts`)
- No hardcoded values — @.claude/rules/code-style.md
- Descriptive naming — @.claude/rules/naming.md
- Components: `PascalCase.tsx`; hooks: `useXxx.ts`; services/utils: `camelCase.ts`; constants: `UPPER_SNAKE_CASE`

## Data Rules — IMPORTANT

- **IDs**: UUID v4, generated client-side via `crypto.randomUUID()`
- **Soft delete**: set `is_deleted = true`, never remove rows
- **Versioning**: increment `version` (+1) on every change — used for sync
- **Timestamps** (created_at, updated_at, completed_at): ISO 8601 with Z suffix (`"2025-01-15T10:30:00.000Z"`)
- **Date-only** (next_date, appear_date): ISO date format (`"2025-01-15"`)
- **Empty optional fields**: use `""` (empty string), never `null` or `undefined`
- **sort_order**: integer for manual ordering within lists
- Recurring tasks skip logic: @.claude/docs/architecture/recurring-tasks-skip-logic.md
- Recurring tasks timezone policy: @.claude/docs/architecture/recurring-tasks-timezone-policy.md

## Data Model & Sync Protocol

Entities, relationships, backend API, pull/push protocol, sync engine:
@.claude/docs/data-model-and-sync.md

## Testing

- **TDD**: Red-Green-Refactor cycle — @.claude/docs/tdd-workflow.md
- Co-locate tests: `Component.test.tsx` next to `Component.tsx`
- Frontend tests: run from `packages/client/`; backend tests: run from `packages/adapter-gas/`
- **Mutation testing**: `npm run test:mutation` — target ≥95% score

## Monorepo Commands

```bash
# Development
pnpm dev                    # Start client dev server
pnpm build                  # Build all packages
pnpm test                   # Run all tests
pnpm lint                   # Lint all packages
pnpm typecheck              # Type check all packages
pnpm preflight              # Run lint + typecheck + test

# Package-specific
pnpm --filter @clear-progress/client dev
pnpm --filter @clear-progress/client test
pnpm --filter @clear-progress/adapter-gas build
```