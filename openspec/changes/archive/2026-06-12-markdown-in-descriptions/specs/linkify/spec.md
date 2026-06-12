# Linkify — Delta Spec

## REMOVED Requirements

### Requirement: LinkedText component

`LinkedText` component is REMOVED. It was used to render plain text with auto-detected URLs as clickable links in entity descriptions. After migration to `DescriptionMarkdown` + `LinkChip`, it has zero production imports. Implements FR10 of markdown-in-descriptions.

All associated tests are removed:
- `LinkedText.test.tsx` — unit tests
- `linkify_linked_text.steps.ts` — BDD step definitions
- `LinkedText` mocks in `GoalCardViewMode` test files

## MODIFIED Requirements

### Requirement: Newline preservation in LinkedText

REMOVED — `LinkedText` no longer exists. Newline handling in descriptions is now managed by `DescriptionMarkdown` via markdown paragraph rendering.

### Requirement: URL shortening utility

`shortenUrl` function remains available in `@/utils/linkify` for use by `LinkChip` and `DescriptionMarkdown`. No changes to the function itself. Implements FR9 of markdown-in-descriptions.

### Requirement: Link extraction utility

`extractLinks` function remains available in `@/utils/linkify`. No production consumers after `LinkedText` removal, but retained as a general utility. No changes to the function itself.
