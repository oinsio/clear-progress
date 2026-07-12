# Rule: antipatterns to avoid

## Process antipatterns

- **Proposal without metrics** — every proposal.md must have concrete Success Metrics (M1, M2...). "Feature works" is not a metric.
- **Proposal as tech spec** — implementation details ("use Redux", "use Context") go into `design.md`, not proposal. Proposal describes WHAT, not HOW.
- **Vague traceability** — "this is probably FR1, I think" is not a link. If the reference is not explicit, it does not exist.
- **Editing archived changes** — history is lost. Create a new change with `Supersedes` reference instead.
- **Huge multi-week change** — impossible to implement coherently, quickly becomes stale. Split into smaller changes.

## Code antipatterns

- **Direct imports from sibling module internals** — only through `index.ts`. Enforce with linter.
- **Files over 200 lines** — bad for AI context. Split into smaller units.

## UI antipatterns

- **Gherkin as test cases** — clicks and API calls instead of user intentions. Describe WHAT the user wants, not HOW they click.
- **Figma as source of truth** — Figma is a reference. Source of truth for colors = design tokens, for behavior = Gherkin, for structure = IA.
- **Inline styles instead of tokens** — no magic numbers in code. Use design tokens.
- **Creating new UI components instead of reusing existing ones** — if `shared/ui` has a Button, do not create MyButton without justification.
- **Only happy path in UI** — always implement loading, error, empty, and offline states. UI States Matrix forces thinking through all of them.
- **Unspoken UX criteria** — if there is an expectation, it must be written in the UX section of proposal.md.
- **A11y "later"** — retrofitting accessibility is far more expensive. axe-core from the first PR.
