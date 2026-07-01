## MODIFIED Requirements

### Requirement: Interface scale switching

The system SHALL support four interface scales: "small", "normal", "large", "xLarge". When the scale is changed, the system SHALL set the `data-scale` attribute on `document.documentElement` to the scale value and persist it to localStorage under `STORAGE_KEYS.INTERFACE_SCALE`. The system SHALL apply scaling via `font-size` percentage on the `html` element: "small" = 87.5%, "normal" = 100%, "large" = 125%, "xLarge" = 150%. The system SHALL NOT use the non-standard `zoom` CSS property. The `body` element SHALL NOT have an explicit `font-size` override — it SHALL inherit from `html`.  # implements FR1 of fix-interface-scaling

#### Scenario: Apply interface scale
- **WHEN** interface scale is set to "large"
- **THEN** `document.documentElement` has `data-scale="large"`
- **AND** localStorage contains "large" for the interface scale key

#### Scenario: Apply each interface scale value
- **WHEN** interface scale is set to any valid value
- **THEN** the corresponding `data-scale` attribute is applied

#### Scenario: Font size scales with interface scale
- **WHEN** interface scale is set to "xLarge"
- **THEN** text rendered with Tailwind `rem`-based classes is 50% larger than at "normal" scale

#### Scenario: No zoom property used
- **WHEN** any interface scale is applied
- **THEN** the `html` element does not use the `zoom` CSS property

## ADDED Requirements

### Requirement: All UI elements use rem-based sizing

All text sizes, icon sizes, and content widths in the application SHALL use rem-based values (Tailwind standard classes or arbitrary rem values). Fixed px values SHALL NOT be used for text-size, icon-size, or content-width properties. Lucide icon components SHALL use Tailwind `w-X h-X` className instead of the `size` prop.  # implements FR2, FR3, FR4 of fix-interface-scaling

#### Scenario: Text elements scale with interface scale
- **WHEN** interface scale is changed from "normal" to "large"
- **THEN** all text elements (including small badges, error indicators, labels) increase in size proportionally

#### Scenario: Icons scale with interface scale
- **WHEN** interface scale is changed from "normal" to "large"
- **THEN** all Lucide icons increase in size proportionally

#### Scenario: Content widths scale with interface scale
- **WHEN** interface scale is changed from "normal" to "large"
- **THEN** max-width constraints on content elements scale proportionally

### Requirement: No horizontal overflow at maximum scale

At xLarge scale (150%), the application SHALL NOT produce horizontal scrollbar on viewports with width >= 375px.  # implements NFR-A1 of fix-interface-scaling

#### Scenario: No overflow at 150% scale on mobile viewport
- **WHEN** interface scale is set to "xLarge"
- **AND** viewport width is 375px
- **THEN** there is no horizontal scrollbar
