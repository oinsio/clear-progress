## Context

Task, goal, and idea descriptions support multi-line input via `<textarea>`. However, in view mode they are rendered using `<span>` (via `LinkedText`) and `<p>` (in `IdeaItem`), which by default collapse `\n` into a space (HTML `white-space: normal`).

`LinkedText` serves as the single rendering point for description text:
- `EditableDescription` → `LinkedText` (view mode) — tasks, goals, ideas
- `GoalDetailPage` → `LinkedText` — goal card

The only exception is `IdeaItem`, which renders the description via a bare `<p>` element.

Driven by FR1, FR2, FR3 from proposal.

## Goals / Non-Goals

**Goals:**
- Preserve newline characters in view mode for all entities

**Non-Goals:**
- Supporting `white-space: pre` (preserving multiple spaces is not required)
- Refactoring `IdeaItem` to use `LinkedText`

## Decisions

### D1: `whitespace-pre-line` over `whitespace-pre-wrap`

`pre-line` collapses multiple spaces but preserves line breaks. `pre-wrap` preserves both spaces and line breaks. Chose `pre-line` because multiple spaces in descriptions are formatting artifacts, not intentional user choices.

### D2: Class inside `LinkedText` rather than at each call-site

Adding `whitespace-pre-line` to the `LinkedText` component itself (on the outer `<span>`) covers all 4 usages with a single change. The alternative — adding the class via `className` at each call-site — is less reliable (easy to miss new usages).

## Risks / Trade-offs

- [Risk] `whitespace-pre-line` in `LinkedText` may affect future usages where newlines are unwanted → Unlikely: `LinkedText` is designed for user-entered text where line breaks are always expected.
- [Trade-off] `line-clamp-2` on `GoalDetailPage` limits visible lines to 2 — newlines will only be visible within that limit → Acceptable: `line-clamp` is an intentional choice for card compactness.
