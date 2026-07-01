# Clear Progress

Personal app for working with idea/goal/task. Client-first architecture.

IMPORTANT: Read existing code, tests, and patterns before generating new code.

## Code Style

- No hardcoded values — .claude/rules/code-style.md
- Descriptive naming — .claude/rules/naming.md

## Data Rules

- **IDs**: UUID v4, generated client-side via `crypto.randomUUID()`
- **Soft delete**: set `is_deleted = true`, never remove rows
- **Versioning**: `revision` is assigned by the server on push, never incremented client-side
- **Timestamps** (created_at, updated_at, completed_at): ISO 8601 with Z suffix (`"2025-01-15T10:30:00.000Z"`)
- **Date-only** (next_date, appear_date): ISO date format (`"2025-01-15"`)
- **Empty optional fields**: use `""` (empty string), never `null` or `undefined`
- **sort_order**: string for lexicographic manual ordering within lists

## Testing

- **TDD**: Red-Green-Refactor cycle — .claude/rules/tdd-workflow.md
- **Mutation testing**: `npm run test:mutation` — target >=95%, minimum acceptable >=90%
- **BDD Unit** (vitest-cucumber): .claude/rules/bdd-unit.md (scoped)
- **BDD E2E** (playwright-bdd): .claude/rules/bdd-e2e.md (scoped), ADR: docs/adr/0003-bdd-e2e-via-playwright-bdd.md

## Mutation testing (Stryker)

- NEVER run the full Stryker suite yourself — it's slow and spikes memory usage, freezing the machine and forcing a reboot. This includes `cd packages/client && npx stryker run` (without `--mutate`) and `pnpm run test:mutation` (runs all mutation tests in the project). When a full run is needed, ask the user to run it and share the report.
- You MAY run Stryker scoped to specific files (up to 5 files at a time, never more), then analyze the resulting JSON report yourself. Code and tests live in separate packages; `packages/client` is the main one, so `cd` into it first and use paths relative to that package, e.g. `cd packages/client && npx stryker run --mutate 'src/services/tokenManager.ts,src/services/tokenPersistence.ts'`.
- Read the report from the same package: `packages/client/reports/mutation/mutation-report.json`.
- ALWAYS wait for a run to finish completely before starting another. Never relaunch while a run is still in progress — concurrent or back-to-back runs spike memory usage and freeze the machine.

## Running tests

Running test suites in parallel — or relaunching before the previous run finishes — spikes memory usage and freezes the machine, forcing a reboot. The TDD/BDD suites are especially prone to this. Strict rules:

- Run tests STRICTLY ONE AT A TIME. Issue exactly one test command, wait for its full output, and only then consider the next one.
- NEVER run test commands in the background (no trailing `&`, no background execution mode). Tests must run in the foreground so the run blocks until it completes.
- NEVER issue multiple test commands in a single batch of tool calls. One test command per turn — do not launch a second while the first is still running.
- Do NOT run multiple suites (unit + integration + e2e + bdd) for small changes. Scope each run to the specific file or suite affected.
- Integration tests are the slowest and heaviest — run them only when changes directly affect integration behavior, or once at the end. Never alongside other suites.
- If unsure whether a run is still going, STOP and ask the user instead of launching another.

## Architecture

- Data model & sync: docs/architecture/data-model-and-sync.md
- Recurring tasks: .claude/rules/skip-logic.md, .claude/rules/timezone-policy.md

## Post-Edit Workflow

1. Call `get_file_problems` via JetBrains MCP for changed files — fix errors immediately
2. Run `pnpm run build` to verify build

## Process Invariants

- Every requirement in `proposal.md` MUST have an ID (`FR1`, `NFR-P1`, `UX1`, `M1`, etc.)
- Every code/test artifact MUST reference its requirement via `# implements FR-X of <change-name>`
- Archived changes (`openspec/changes/archive/`) are immutable — create a new change to correct
- Files must stay under 200 lines for AI context quality
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
| `archive-path.md`       | `openspec/changes/archive/**`           | Year/month grouping for archived changes                  |
| `delta-specs.md`        | `openspec/**/specs/**`                  | Delta spec format with ADDED/MODIFIED/REMOVED             |
| `design-decisions.md`   | `openspec/**/design.md`                 | When and how to write local ADR                           |
| `gherkin.md`            | `**/features/**/*.feature`              | Intentions not clicks, tagging conventions                |
| `bdd-unit.md`           | `**/*.feature`, `**/*.steps.ts`         | vitest-cucumber conventions, step definition pattern      |
| `bdd-e2e.md`            | `**/*_e2e.feature`, `**/*_e2e.steps.ts` | playwright-bdd conventions, config, scripts               |
| `contracts.md`          | `**/application/**`, `**/ports*`        | Port interfaces and contract test patterns                |
| `ui-states.md`          | `**/components/**`, `**/pages/**`       | UI states, a11y, design system, optimistic updates        |
| `adr.md`                | `docs/adr/**`                           | Global ADR format and lifecycle                           |
| `ia.md`                 | `docs/ia/**`                            | Information Architecture document format                  |