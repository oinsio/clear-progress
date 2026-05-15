# Clear Progress

Personal app suitable for working with the GTD method. Client-first architecture.

IMPORTANT: Read existing code, tests, and patterns before generating new code.
 
NEVER run mutation tests yourself. Instead, ask the user to run them for you. Analyze mutation test reports instead of running Stryker tests.

## Code Style

- No hardcoded values — .claude/rules/code-style.md
- Descriptive naming — .claude/rules/naming.md

## Data Rules

- **IDs**: UUID v4, generated client-side via `crypto.randomUUID()`
- **Soft delete**: set `is_deleted = true`, never remove rows
- **Versioning**: increment `version` (+1) on every change — used for sync
- **Timestamps** (created_at, updated_at, completed_at): ISO 8601 with Z suffix (`"2025-01-15T10:30:00.000Z"`)
- **Date-only** (next_date, appear_date): ISO date format (`"2025-01-15"`)
- **Empty optional fields**: use `""` (empty string), never `null` or `undefined`
- **sort_order**: integer for manual ordering within lists

## Testing

- **TDD**: Red-Green-Refactor cycle — .claude/rules/tdd-workflow.md
- **Mutation testing**: `npm run test:mutation` — target >=95%, minimum acceptable >=90%
- **BDD Unit** (vitest-cucumber): .claude/rules/bdd-unit.md (scoped)
- **BDD E2E** (playwright-bdd): .claude/rules/bdd-e2e.md (scoped), ADR: docs/adr/0003-bdd-e2e-via-playwright-bdd.md

## Architecture

- Data model & sync: docs/architecture/data-model-and-sync.md
- Recurring tasks: .claude/rules/skip-logic.md, .claude/rules/timezone-policy.md

## Post-Edit Workflow

1. Call `getDiagnostics` via JetBrains MCP for changed files — fix errors immediately
2. Run `pnpm run build` to verify build

## Process Invariants

- Every requirement in `proposal.md` MUST have an ID (`FR1`, `NFR-P1`, `UX1`, `M1`, etc.)
- Every code/test artifact MUST reference its requirement via `# implements FR-X of <change-name>`
- Archived changes (`openspec/changes/archive/`) are immutable — create a new change to correct
- Files must stay under 400 lines for AI context quality
- Imports only through `index.ts` of a module, never from sibling internals
- Changes named `kebab-case-descriptive` — no generic names (`update`, `wip`)
- UI must handle ALL states: loading, error, empty, offline — not just happy path
- Task plans must maximize automated tests (BDD, contract, mutation, axe-core, visual regression) — avoid manual testing steps

## Development Workflow (OpenSpec)

```
/opsx:propose <idea> → /opsx:apply → /opsx:archive
```

For complex features: `/opsx:explore` first, then `/opsx:propose`.

Active changes: `openspec/changes/`. Archived: `openspec/changes/archive/`. Stable specs: `openspec/specs/`.

## Process Rules (`.claude/rules/`)

| Rule file               | Scope                                   | What it covers                                            |
|-------------------------|-----------------------------------------|-----------------------------------------------------------|
| `traceability.md`       | global                                  | Requirement IDs and traceability links in all artifacts   |
| `process-invariants.md` | global                                  | Immutability, file size, module boundaries, change naming |
| `antipatterns.md`       | global                                  | Common mistakes to avoid (process, code, UI)              |
| `test-planning.md`      | global                                  | Maximize automated tests in task decomposition            |
| `tdd-workflow.md`       | global                                  | Red-Green-Refactor cycle, mutation testing thresholds     |
| `proposal-format.md`    | `openspec/**/proposal.md`               | Required sections and format for PRD                      |
| `delta-specs.md`        | `openspec/**/specs/**`                  | Delta spec format with ADDED/MODIFIED/REMOVED             |
| `design-decisions.md`   | `openspec/**/design.md`                 | When and how to write local ADR                           |
| `gherkin.md`            | `**/features/**/*.feature`              | Intentions not clicks, tagging conventions                |
| `bdd-unit.md`           | `**/*.feature`, `**/*.steps.ts`         | vitest-cucumber conventions, step definition pattern      |
| `bdd-e2e.md`            | `**/*_e2e.feature`, `**/*_e2e.steps.ts` | playwright-bdd conventions, config, scripts               |
| `contracts.md`          | `**/application/**`, `**/ports*`        | Port interfaces and contract test patterns                |
| `ui-states.md`          | `**/components/**`, `**/pages/**`       | UI states, a11y, design system, optimistic updates        |
| `adr.md`                | `docs/adr/**`                           | Global ADR format and lifecycle                           |
| `ia.md`                 | `docs/ia/**`                            | Information Architecture document format                  |