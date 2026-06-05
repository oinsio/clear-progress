## Context

The goal detail page (`GoalDetailPage.tsx`, ~770 lines) contains a view-mode card that displays the goal's cover, name, description, status badge, and action buttons in a single flex row. This layout becomes cramped with long names/descriptions and doesn't allow full-size cover preview. The edit mode is not affected.

Current view-mode structure (lines 574–656):
```
<div flex items-start gap-3>
  <div> cover circle </div>
  <div flex-1> name + description + status badge </div>
  <div> focus + completed + edit buttons </div>
</div>
```

Existing components used: `GoalStatusBadge`, `LinkedText`, `GoalCoverPicker` (edit only).

## Goals / Non-Goals

**Goals:**
- Recompose view-mode layout into 3 rows without changing edit mode (FR5)
- Add lightbox overlay for cover preview (FR1, FR2)
- Add collapsible description with line-clamp (FR3, FR4)

**Non-Goals:**
- Extracting view-mode into a separate component (keep it inline for now — file is within limits)
- Adding image zoom/pan or swipe-to-dismiss
- Changing any behavior outside the goal card area

## Decisions

### D1: Lightbox as a local component, not shared

**Decision**: Create `CoverLightbox.tsx` in `components/goals/` as a focused component for this use case.

**Rationale**: The app has no existing lightbox/modal for images. Building a generic one would be over-engineering for a single use case. If needed elsewhere later, it can be extracted.

**Alternatives**: Use a third-party lightbox library — rejected, too heavy for one image display.

### D2: CSS line-clamp for description truncation

**Decision**: Use Tailwind's `line-clamp-2` class for truncation. Detect overflow via `scrollHeight > clientHeight` comparison in a `useRef` + `useLayoutEffect` to conditionally show the toggle icon.

**Rationale**: Pure CSS approach is simple and performant. The JS overflow detection is needed only to know whether to show the toggle — no text manipulation required.

**Alternatives**: Count characters/lines in JS — fragile across font sizes and viewport widths.

### D3: Chevron icon for expand/collapse toggle

**Decision**: Use `ChevronDown` / `ChevronUp` from lucide-react (already a project dependency) as the toggle icon. Place it inline at the end of the description area.

**Rationale**: Chevron is a universally understood affordance for expand/collapse. Lucide is already used throughout the app.

### D4: Focus trap in lightbox via onKeyDown

**Decision**: Implement focus trap manually with `onKeyDown` handler on the lightbox container (trap Tab to close button, handle Escape). No external focus-trap library.

**Rationale**: The lightbox has exactly one focusable element (close button), so a full focus-trap library is unnecessary. A simple `onKeyDown` handler covers NFR-A1.

## Risks / Trade-offs

- [Risk] `scrollHeight > clientHeight` detection may not trigger on first render if fonts haven't loaded → Mitigation: run check in `useLayoutEffect` and also on `ResizeObserver` callback for the description element.
- [Risk] Line-clamp appearance varies slightly across browsers → Mitigation: Tailwind's `line-clamp` uses `-webkit-line-clamp` which has broad support (97%+ on caniuse). Acceptable for a PWA.
- [Trade-off] Keeping view-mode inline in GoalDetailPage rather than extracting a component — simpler change, but the file stays large. Acceptable since it's ~770 lines and the refactor doesn't add significant new lines.
