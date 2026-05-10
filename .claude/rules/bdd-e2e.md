---
paths:
  - "**/*_e2e.feature"
  - "**/steps/*_e2e.steps.ts"
  - "playwright.bdd.config.ts"
  - ".features-gen/**"
---

# Rule: BDD E2E conventions (playwright-bdd)

Full rationale: docs/adr/0003-bdd-e2e-via-playwright-bdd.md

## Naming

- `*_e2e.feature` — scenarios requiring a real browser (playwright-bdd)
- `*_e2e.steps.ts` — step definitions for playwright-bdd
- `*_unit.feature` / `*_unit.steps.ts` — unit BDD (vitest-cucumber), not playwright-bdd

## Config

- Use `playwright.bdd.config.ts` (separate from `playwright.config.ts`)
- `.features-gen/` is auto-generated and in `.gitignore`

## Traceability

- Tags `@<change-name> @NFR-X` above each Scenario in feature files
- Comment `// Verifies NFR-X of <change-name>` in step definitions

## Scripts

```
pnpm test:bdd       — generate + run all BDD e2e tests
pnpm test:bdd:a11y  — accessibility only (NFR-A*)
pnpm test:all       — unit + BDD e2e + regular e2e
```

## Dependencies

- `playwright-bdd` (devDependency)
- `.features-gen/` and `cucumber-report/` in `.gitignore`
