## MODIFIED Requirements

### Requirement: Provider row displayed in ServerConnectedStatus

`ServerConnectedStatus` SHALL display an OAuth provider row between the URL row and the account email row when `authProvider` is a non-empty string and `config.type` is `"supabase"`. The row SHALL show the localized label ("OAuth провайдер" / "OAuth provider"), a colon, and the capitalized provider name. If `authProvider` is empty or null, the row SHALL NOT be rendered.  # implements FR3 of gas-remove

#### Scenario: Provider row visible for authenticated Supabase session
- **WHEN** user is connected to Supabase backend
- **AND** `authProvider` is `"google"`
- **THEN** a row is displayed between URL and account email
- **AND** the row shows "OAuth провайдер: Google" (ru) or "OAuth provider: Google" (en)

#### Scenario: Provider row hidden when no provider info
- **WHEN** user is connected to Supabase backend
- **AND** `authProvider` is `null` or empty
- **THEN** no provider row is displayed

### Requirement: ProviderIcon component maps providers to icons

`ProviderIcon` component SHALL accept a `provider` string prop and render the corresponding icon. The mapping SHALL be:  # implements FR3 of gas-remove

| Provider   | Icon source                                     |
|------------|-------------------------------------------------|
| `google`   | Inline SVG (Google logo)                        |
| `azure`    | Inline SVG (Microsoft logo)                     |
| `github`   | `Github` from lucide-react                      |
| `apple`    | `Apple` from lucide-react                       |
| `facebook` | `Facebook` from lucide-react                    |
| `twitter`  | `Twitter` from lucide-react                     |
| `gitlab`   | `Gitlab` from lucide-react                      |
| `slack`    | `Slack` from lucide-react                       |
| `linkedin` | `Linkedin` from lucide-react                    |
| `supabase` | Inline SVG (Supabase green lightning bolt logo) |
| `email`    | `Mail` from lucide-react                        |

For any provider not in the table, `ProviderIcon` SHALL return `null`.

#### Scenario: Google provider renders inline SVG
- **WHEN** `provider` is `"google"`
- **THEN** an inline SVG with the Google logo is rendered with `aria-hidden="true"`

#### Scenario: GitHub provider renders lucide icon
- **WHEN** `provider` is `"github"`
- **THEN** `Github` icon from lucide-react is rendered with `aria-hidden="true"`

#### Scenario: Supabase provider renders inline SVG
- **WHEN** `provider` is `"supabase"`
- **THEN** an inline SVG with the Supabase lightning bolt logo is rendered with `aria-hidden="true"`

#### Scenario: Unknown provider renders nothing
- **WHEN** `provider` is `"saml"`
- **THEN** `ProviderIcon` returns `null`

### Requirement: Backend selection buttons display logos

`ServerBackendSelection` SHALL display a `ProviderIcon` with `provider="supabase"` on the Supabase button. Icons SHALL be positioned before the button text using inline-flex layout with gap. Icons SHALL have `aria-hidden="true"` (inherited from `ProviderIcon`).  # implements FR3 of gas-remove

#### Scenario: Supabase button shows Supabase logo
- **WHEN** backend selection is displayed
- **THEN** Supabase button contains the Supabase lightning bolt icon before the text

## REMOVED Requirements

### Requirement: Provider row hidden for GAS connections
**Reason**: GAS backend removed. No GAS connections possible.
**Migration**: None needed.

### Requirement: GAS provider icon in ProviderIcon mapping
**Reason**: GAS backend removed. `GasIcon` SVG and `gas` mapping deleted from `ProviderIcon`.
**Migration**: None needed.

### Requirement: GAS button in backend selection
**Reason**: GAS backend removed. Only Supabase button remains in `ServerBackendSelection`.
**Migration**: None needed.
