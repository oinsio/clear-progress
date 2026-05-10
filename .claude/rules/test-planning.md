# Rule: maximize automated tests in task planning

When decomposing a change into tasks, always prefer automated tests over manual testing. Manual testing ("check manually", "verify visually") should be a last resort for things that genuinely cannot be automated.

## Required automated test types

### For every change

- **Unit tests (Vitest)** — domain logic, utils, hooks via TDD
- **Mutation testing (Stryker)** — verify test quality, target >= 95% score
- **BDD unit tests (vitest-cucumber)** — executable Gherkin specs for business rules

### For changes with UI

- **BDD E2E tests (playwright-bdd)** — NFR scenarios requiring a real browser (a11y, responsive, keyboard)
- **A11y tests (axe-core)** — automated accessibility checks, run in CI
- **Visual regression tests** — catch unintended visual changes
- **Component tests** — Storybook stories for all UI states

### For changes with ports/adapters

- **Contract tests** — shared test suite run against every adapter (in-memory, real backend)

### For changes with performance requirements

- **Performance tests** — Lighthouse CI for NFR-P metrics, `performance.now()` for operation timing in unit BDD

## Task decomposition rules

1. Every FR/NFR/UX from proposal must have at least one automated test covering it
2. The `tasks.md` verification section must list concrete test commands, not "check manually"
3. If a scenario is in Gherkin — it must have step definitions (unit or e2e)
4. A11y tests are part of the implementation, not a separate "nice to have" phase
5. Visual regression and Lighthouse go into CI pipeline, not manual pre-release checks

## Bad vs good task examples

```markdown
# Bad — manual verification
- [ ] 5.1 Manually verify keyboard navigation works
- [ ] 5.2 Check responsive layout on mobile
- [ ] 5.3 Visually confirm loading states

# Good — automated verification
- [ ] 5.1 BDD E2E: keyboard navigation scenarios (@NFR-A1)
- [ ] 5.2 BDD E2E: responsive layout scenarios (@NFR-R1), viewport 320px-2560px
- [ ] 5.3 Storybook stories for loading/error/empty/offline states
- [ ] 5.4 axe-core assertions in E2E tests
- [ ] 5.5 Mutation testing >= 95% on new domain code
```
