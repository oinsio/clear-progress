---
paths:
  - "docs/ia/**"
---

# Rule: Information Architecture documents

IA documents describe the structure and navigation of the application. They are the source of truth for sitemap, URL structure, and information hierarchy.

## File naming

`docs/ia/NNNN-ia-vN.md` — versioned, four-digit sequential number.

## Required format

```markdown
---
id: IA-NNNN
title: Information Architecture vN
status: accepted
links:
  related_changes: [list of related changes from openspec/]
---

# Information Architecture

## Sitemap
(mermaid graph or text tree)

## Navigation Patterns
(how users move between screens)

## Information Hierarchy
(what is primary, secondary, tertiary on each screen)

## URL Structure
(route patterns and parameters)
```

## Rules

- Check IA before starting a new feature — does the feature fit the current structure?
- If the feature requires IA changes, update IA in a separate PR before implementing
- New IA version does not delete the old one — keep history
- Reference IA from proposal.md in the "Affected IA" section
