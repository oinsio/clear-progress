## MODIFIED Requirements

### Requirement: Pin detail panel uses Pin icon button instead of switch toggle

The "pin detail panel" setting in WorkspaceSection SHALL use a Pin icon button with text label instead of a switch toggle. The Pin icon SHALL match the visual style from TaskDetailPanel: `fill-current` class when pinned (active), `rotate-45` class when unpinned (inactive). The button SHALL use accent color when active and gray when inactive. Implements FR11 of improve-sidebar-ux.

#### Scenario: Pin button shows pinned state
- **WHEN** detail panel is pinned
- **THEN** the Pin icon has `fill-current` class (filled pin)
- **AND** the icon uses accent color

#### Scenario: Pin button shows unpinned state
- **WHEN** detail panel is not pinned
- **THEN** the Pin icon has `rotate-45` class (angled pin)
- **AND** the icon uses gray color

#### Scenario: Clicking pin button toggles state
- **WHEN** user clicks the pin button in settings
- **THEN** the `isDetailPanelPinned` preference toggles

#### Scenario: Pin button has accessible label
- **WHEN** detail panel is pinned
- **THEN** pin button has `aria-label` with localized "Unpin" text
- **WHEN** detail panel is not pinned
- **THEN** pin button has `aria-label` with localized "Pin" text
