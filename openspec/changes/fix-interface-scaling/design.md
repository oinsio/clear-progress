## Context

Interface scaling is implemented via `html { font-size: X% }` + `data-scale` attribute. Tailwind classes (text-sm, w-4, px-3) use rem and scale correctly. However, the codebase has patterns with hardcoded px values that do not respond to scale changes:

1. Arbitrary Tailwind values in px: `text-[10px]`, `text-[14px]`, `max-w-[260px]`
2. Lucide icon prop `size={N}` — renders SVG with `width`/`height` in px
3. Inline style `fontSize: Npx` in SettingsPage

Current scale values (large = 112.5%, xLarge = 125%) produce too subtle an effect. The user wants large = 125%, xLarge = 150%.

## Goals / Non-Goals

**Goals:**
- All text and icon elements scale via rem (FR2, FR3, FR4)
- Increased scale values for large and xLarge (FR1)
- Consistent pattern for Lucide icons via Tailwind classes

**Non-Goals:**
- Do not change media queries (NG3)
- Do not add new scales (NG1)
- Do not change the scaling mechanism (NG2)

## Decisions

### D1: Replace Lucide `size` with Tailwind classes

**Decision**: Remove the `size={N}` prop from all Lucide icons and replace with `className="w-X h-X"`.

**Rationale**: The Lucide size prop renders `width="N" height="N"` in px on SVG. Tailwind w-X h-X classes use rem and scale properly. This is the only way to make icons scalable without custom CSS hacks.

**Size mapping**:
| size (px) | Tailwind class |
|-----------|---------------|
| 10 | w-2.5 h-2.5 |
| 12 | w-3 h-3 |
| 14 | w-3.5 h-3.5 |
| 16 | w-4 h-4 |
| 17 | w-4 h-4 |
| 18 | w-[1.125rem] h-[1.125rem] |
| 20 | w-5 h-5 |
| 28 | w-7 h-7 |

**Alternative considered**: Use CSS custom property `--icon-size: calc(Npx * var(--scale-factor))` — rejected as it adds unnecessary complexity and does not follow existing project patterns.

**Note**: Tailwind v4 does not have a standard `w-4.5` class (1.125rem). We use the arbitrary value `w-[1.125rem] h-[1.125rem]` for size=18.

### D2: Replace arbitrary px with rem in text and layout values

**Decision**: `text-[10px]` -> `text-[0.625rem]`, `text-[14px]` -> `text-sm`, `max-w-[260px]` -> `max-w-[16.25rem]`, `fontSize: Npx` -> Tailwind class.

**Rationale**: Direct replacement of px with rem equivalents preserves the current visual appearance at normal scale while adding scalability.

### D3: "Aa" preview in SettingsPage

**Decision**: Replace inline `style={{ fontSize: ${iconSize}px }}` with Tailwind classes (text-sm, text-base, text-lg, text-xl) depending on the scale option.

**Rationale**: The preview should demonstrate a fixed relative size for each scale button, independent of the current scale. Tailwind classes provide visually distinct sizes.

## Risks / Trade-offs

- **[Risk] Visual issues at 150%**: At increased scale, elements may not fit within containers, especially on mobile (375px viewport). -> **Mitigation**: Visual testing of all 4 scales at minimum viewport (NFR-A1).
- **[Risk] Tailwind w-4.5 does not exist**: For size=18, an arbitrary value is needed. -> **Mitigation**: Use `w-[1.125rem] h-[1.125rem]`, which is valid in Tailwind.
- **[Risk] Icons in buttons may visually "jump"**: When replacing size with className, the size may differ slightly due to rem rounding. -> **Mitigation**: Visual verification; the difference is sub-pixel and imperceptible.
