## Context

Entity creation UI is currently split across multiple components: `BoxFilterBar` (filter + eye + add button on task pages), `AddTaskInput` (inline textarea that appears on click), and per-page inline add patterns for goals/ideas/categories/contexts. Each page composes these differently via `topToolbar`/`bottomToolbar` slots in `TaskPageLayout`.

The goal is to replace all of these with a single `CommandBar` component that is configured via props. The component uses `position: fixed` and publishes its height as a CSS variable for content padding.

Visual specification is embedded in `proposal.md` (section "Visual Specification").

## Goals / Non-Goals

**Goals:**
- Single reusable component replacing BoxFilterBar + AddTaskInput + HiddenTasksToggle + inline add buttons (FR1)
- Telegram-style auto-grow textarea with stacking behavior (FR10, FR11)
- Works on all entity pages with different configurations (FR5, FR7)
- Dynamic height awareness via CSS variable (FR16, FR17)

**Non-Goals:**
- Changing entity creation logic (services, hooks remain as-is)
- Changing routing or navigation
- Adding new entity types

## Decisions

### D1: Component API — configuration object props

**Decision**: CommandBar accepts optional configuration objects for each section rather than many flat props.

```typescript
interface CommandBarProps {
  filter?: {
    boxes: BoxFilter[];
    activeBox: BoxFilter;
    onBoxChange: (box: BoxFilter) => void;
  };
  eyeToggle?: {
    isVisible: boolean;
    onToggle: () => void;
  };
  entityIcon: LucideIcon;
  placeholder: string;
  onSubmit: (value: string) => void;
}
```

**Why**: Grouping related props makes the optional nature of filter/eyeToggle clear. Pages without filter simply omit the prop. Position and handedness come from existing hooks (`useFilterBarPosition`, new `useHandedness`), not from props — they are user preferences, not page-specific configuration.

**Alternative considered**: Flat props (`activeBox`, `onBoxChange`, `showFilter`, `showEye`, etc.) — rejected because too many optional props create ambiguity about valid combinations.

### D2: Height communication — CSS custom property via ResizeObserver

**Decision**: CommandBar observes its own height with ResizeObserver and sets `--command-bar-height` on `document.documentElement`. Content containers use `padding-bottom: var(--command-bar-height)` (or `padding-top` for top position).

**Why**: Pure CSS solution, no React context or state needed. Any element in the tree can react to height changes. ResizeObserver fires on textarea growth, stacking changes, etc.

**Alternative considered**: React context with height state — rejected because it causes re-renders on every height change. CSS variable is zero-cost for React.

### D3: Textarea auto-resize — measure in row-mode, then decide stacking

**Decision**: Anti-oscillation algorithm:
1. On init: measure `singleLineHeight` (textarea scrollHeight with 1 line of text)
2. On input: temporarily remove `stacked` class, measure `scrollHeight` in row layout
3. If `scrollHeight > singleLineHeight` → text wraps, apply stacking, set explicit height (capped at computed max-height from CSS `max-h-40`)
4. If single visual line → remove inline styles, let CSS `min-h-9` manage

Max height is read from `getComputedStyle(textarea).maxHeight` rather than hardcoded — this way it scales with the interface scale setting (`max-h-40` = 10rem = 160px at normal, 200px at large, 240px at xLarge).

**Why**: Measuring in row-mode gives a stable threshold. If we measured in stacked mode, the wider textarea would fit more text per line, causing oscillation between row and stacked layouts.

### D4: Position fixed with safe-area handling

**Decision**: CommandBar uses `position: fixed` with `bottom: 0` or `top: 0` depending on user preference. On iOS, `safe-area-bottom` padding is applied for bottom position (existing pattern from BoxFilterBar).

**Why**: Fixed position keeps CommandBar always visible regardless of scroll. This matches the Telegram/Linear pattern for input bars.

**Alternative considered**: Keep current flow-based layout with toolbar slots — rejected because it doesn't support the "always visible" requirement and complicates the Telegram-style growth behavior.

### D5: Handedness — CSS class on CommandBar root

**Decision**: Add `.left-handed` class to CommandBar root element. This triggers:
- `flex-direction: row-reverse` on the bar (filter goes right, buttons go left)
- `flex-direction: row-reverse` on `.bar-actions` (eye/+ order flips in row mode)
- Entity icon inside textarea stays left-aligned (no mirror for LTR text)
- Stack order unchanged (+ always at bottom — ergonomic for thumb)

Stored in localStorage as `STORAGE_KEYS.HANDEDNESS` with values `"right"` (default) | `"left"`.

**Why**: Simple CSS-only solution, no layout recalculation needed.

### D6: Filter collapse on textarea focus

**Decision**: When textarea receives focus, if filter is expanded, collapse it and apply the currently displayed (active) box value. No delay, instant collapse.

**Why**: Discussed with user — soft mutual exclusion. Filter doesn't block textarea, but gets out of the way when user starts typing.

### D7: Page integration — each page configures CommandBar via props

**Decision**: Remove `topToolbar`/`bottomToolbar` slots from TaskPageLayout. CommandBar renders independently (fixed position) and is composed in each page component. The page passes entity-specific config:

| Page               | filter                         | eyeToggle | entityIcon  | onSubmit                                  |
|--------------------|--------------------------------|-----------|-------------|-------------------------------------------|
| ActiveTasksPage    | 4 boxes (today/week/later/all) | yes       | CheckSquare | createTask({box: targetBox})              |
| InboxPage          | no                             | yes       | CheckSquare | createTask({box: "inbox"})                |
| GoalDetailPage     | 5 boxes (+inbox, default: all) | yes       | CheckSquare | createTask({goal_id, box: targetBox})     |
| CategoryDetailPage | 5 boxes (+inbox, default: all) | yes       | CheckSquare | createTask({category_id, box: targetBox}) |
| ContextDetailPage  | 5 boxes (+inbox, default: all) | yes       | CheckSquare | createTask({context_id, box: targetBox})  |
| GoalsPage          | no                             | no        | Target      | createGoal                                |
| IdeasPage          | no                             | no        | Lightbulb   | createIdea                                |
| CategoriesPage     | no                             | no        | Tag         | createCategory                            |
| ContextsPage       | no                             | no        | MapPin      | createContext                             |

`targetBox` = active filter value if specific box, OR user's default box (from synced settings) if filter is "all". Enter key and + button both trigger `onSubmit`.

**Why**: Each page already knows its entity type and creation logic. CommandBar just provides the UI.

### D8: Desktop + detail panel width matching

**Decision**: Defer complex width-matching logic. On initial implementation, CommandBar will have the same max-width as the page content container and will center with the page. For master-detail layout, the page container already handles width splitting — CommandBar inside the main content area will naturally match its width.

If CommandBar is fixed-positioned, we can use a layout approach where the fixed bar reads its width from a CSS variable set by the page layout (e.g., `--task-list-width`), or we constrain the fixed bar's width to match the content container via the same max-width + margin logic.

**Why**: Simpler initial implementation. Can be refined later if the visual alignment isn't satisfactory.

## Risks / Trade-offs

- **[Risk] Removing BoxFilterBar/AddTaskInput may break existing tests** → Mitigation: update all page-level tests to use new CommandBar test IDs. Run full test suite before merge.
- **[Risk] position: fixed on iOS has known quirks with virtual keyboard** → Mitigation: test on real iOS devices. Use `visualViewport` API if needed to adjust position when keyboard opens.
- **[Risk] ResizeObserver may not fire synchronously enough for smooth textarea growth** → Mitigation: use `requestAnimationFrame` for height updates. The mockup already validates this approach works.
- **[Trade-off] CSS variable for height vs React context** → Chose CSS variable for performance (no re-renders), but it means non-React consumers must read from DOM. Acceptable for this project.
- **[Trade-off] Removing toolbar slots from TaskPageLayout** → Reduces flexibility but simplifies the component. If future needs arise, slots can be re-added.
