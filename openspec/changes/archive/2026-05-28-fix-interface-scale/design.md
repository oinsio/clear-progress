## Context

Interface scale currently uses two CSS mechanisms:
1. `zoom` on `html[data-scale]` — non-standard property, scales visually but doesn't change `rem` base
2. `font-size: calc(1rem * var(--scale-factor))` on `body` — multiplies by scale factor, but Tailwind's `rem` classes resolve against `html` (unchanged 16px), not `body`

Result: text classes like `text-sm`, `text-base`, `text-lg` always render at the same pixel size regardless of scale setting. Driven by FR1-FR6 from proposal.

## Goals / Non-Goals

**Goals:**
- Replace `zoom` with standard `font-size` percentage on `html` so all `rem`-based values scale naturally
- Remove redundant body `font-size` to avoid double scaling
- Keep `--scale-factor` CSS variable for backward compatibility

**Non-Goals:**
- Changing InterfaceScaleProvider logic (it only sets `data-scale` attribute)
- Modifying BDD unit tests (they test attribute/localStorage, not CSS properties)

## Decisions

### D1: Use percentage `font-size` on `html` instead of `zoom`

**Decision**: Set `font-size: 87.5% | 100% | 112.5% | 125%` on `html[data-scale]` selectors.

**Rationale**: Percentage font-size on `html` changes the root `rem` value. Since Tailwind uses `rem` for text, spacing, and sizing — everything scales naturally. Unlike `zoom`, this is a standard CSS property supported across all browsers including iOS Safari.

**Alternative considered**: Using `transform: scale()` — rejected because it doesn't affect layout flow and requires container adjustments.

### D2: Remove body font-size calc

**Decision**: Remove `font-size: calc(1rem * var(--scale-factor))` from `body`.

**Rationale**: With `font-size` on `html`, `1rem` already equals the scaled value. Keeping the calc would double the effect (e.g., xLarge: `1rem` = 20px, then `20px * 1.25` = 25px).

### D3: Keep `--scale-factor` CSS variable

**Decision**: Preserve `--scale-factor` variable declarations in each `html[data-scale]` rule.

**Rationale**: E2E tests assert on this variable's value. Removing it would require more test changes for no functional benefit. It also serves as documentation of the numeric factor.

## Risks / Trade-offs

- [Risk] Elements using fixed `px` values won't scale → Mitigation: Tailwind classes are `rem`-based by default; `px` is only used for borders and shadows where scaling isn't desired.
- [Risk] Third-party components with `px` sizing won't scale → Mitigation: Currently no third-party UI components in use.
