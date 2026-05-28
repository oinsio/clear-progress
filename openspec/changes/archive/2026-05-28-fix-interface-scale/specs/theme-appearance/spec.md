## MODIFIED Requirements

### Requirement: Interface scale switching

The system SHALL support four interface scales: "small", "normal", "large", "xLarge". When the scale is changed, the system SHALL set the `data-scale` attribute on `document.documentElement` to the scale value and persist it to localStorage under `STORAGE_KEYS.INTERFACE_SCALE`. The system SHALL apply scaling via `font-size` percentage on the `html` element: "small" = 87.5%, "normal" = 100%, "large" = 112.5%, "xLarge" = 125%. The system SHALL NOT use the non-standard `zoom` CSS property. The `body` element SHALL NOT have an explicit `font-size` override — it SHALL inherit from `html`.  # implements FR1, FR2, FR3, FR4, FR5, FR6 of fix-interface-scale

#### Scenario: Apply interface scale
- **WHEN** interface scale is set to "large"
- **THEN** `document.documentElement` has `data-scale="large"`
- **AND** localStorage contains "large" for the interface scale key

#### Scenario: Apply each interface scale value
- **WHEN** interface scale is set to any valid value
- **THEN** the corresponding `data-scale` attribute is applied

#### Scenario: Font size scales with interface scale
- **WHEN** interface scale is set to "xLarge"
- **THEN** text rendered with Tailwind `rem`-based classes is 25% larger than at "normal" scale

#### Scenario: No zoom property used
- **WHEN** any interface scale is applied
- **THEN** the `html` element does not use the `zoom` CSS property
