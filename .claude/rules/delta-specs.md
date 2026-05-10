---
paths:
  - "openspec/changes/**/specs/**"
  - "openspec/specs/**"
---

# Rule: domain spec format

Delta specs describe what changes in the domain model. They live in `openspec/changes/<change>/specs/<capability>/spec.md` during development and merge into `openspec/specs/<capability>/spec.md` after archive.

## Delta format

Use ADDED / MODIFIED / REMOVED markers:

```markdown
## Entity: Note

### MODIFIED
fields:
  + tag_ids: { type: array<TagId>, max_items: 20, default: [] }

invariants:
  + tag_ids unique within note  # implements FR1 of add-tag-search
  + all tag_ids reference existing tags  # implements FR2 of add-tag-search
```

## Use case format

```markdown
## Use case: AddTagToNote (NEW)

Inputs:
- noteId: NoteId
- tagId: TagId

Effects:
- tag_ids gets tagId added (if not already present)  # FR1
- note.updated_at set to now()

Errors:
- TagNotFoundError — tag does not exist  # FR2
- TagLimitExceeded — over 20 tags limit  # FR1
```

## Rules

- Every invariant and use case MUST have `# implements FR-X of <change-name>` comment
- Use YAML-like notation for field definitions
- Keep specs focused: one capability per spec file
- Delta specs are temporary — they describe the change, not the full state
- After `/opsx:archive`, deltas merge into `openspec/specs/` — never edit archived specs directly
