---
paths:
  - "packages/client/src/test/features/**/*.feature"
---

# Rule: Gherkin scenario conventions

Feature files are executable specifications. They describe behavior in terms of user INTENTIONS, not UI mechanics.

## Tags

Every scenario must have tags linking it to a change and requirement:

```gherkin
@add-tag-search @FR1
Scenario: User adds a tag to a note
```

## Intentions, not clicks

```gherkin
# Bad — describes UI mechanics
Scenario: Click add tag button
  Given the user is on the note page
  When the user clicks the "Add Tag" button
  And the user types "important" in the tag input
  And the user clicks "Save"
  Then the tag "important" appears in the tag list

# Good — describes user intention
Scenario: User tags a note for quick filtering
  Given a note "Project ideas" exists
  When the user adds tag "important" to "Project ideas"
  Then "Project ideas" is tagged with "important"
```

## Structure

```gherkin
Feature: <feature name>
  Implements change <change-name>.

  Background:
    Given <common preconditions>

  @<change-name> @FR-X
  Scenario: <description in terms of intention>
    Given <initial state>
    When <user action>
    Then <observable result>
```

## File naming

- `<feature>_<aspect>.feature` — snake_case
- `<feature>_<aspect>_unit.feature` — when paired with an `_e2e` variant
- `<feature>_<aspect>_e2e.feature` — scenarios requiring a real browser (a11y, responsive)

## Rules

- One feature file per behavior aspect (not one giant file per feature)
- Background seeds shared preconditions — keep it minimal
- Use DataTables for parameterized data, not repeated scenarios
- Step text must be reusable across scenarios — avoid overly specific wording
- If a scenario requires a real browser (focus, aria, layout), it goes into `*_e2e.feature`
