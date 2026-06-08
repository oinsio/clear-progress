# Capability: Supabase Provider Display

## Purpose

Display the OAuth provider name and icon in ServerConnectedStatus for Supabase connections, giving users visibility into which authentication method is active.

## ADDED Requirements

### Requirement: Provider row displayed in ServerConnectedStatus

`ServerConnectedStatus` SHALL display an OAuth provider row between the URL row and the account email row when `authProvider` is a non-empty string and `config.type` is `"supabase"`. The row SHALL show the localized label ("OAuth провайдер" / "OAuth provider"), a colon, and the capitalized provider name. If `authProvider` is empty or null, the row SHALL NOT be rendered.

#### Scenario: Provider row visible for authenticated Supabase session
- **WHEN** user is connected to Supabase backend
- **AND** `authProvider` is `"google"`
- **THEN** a row is displayed between URL and account email
- **AND** the row shows "OAuth провайдер: Google" (ru) or "OAuth provider: Google" (en)

#### Scenario: Provider row hidden when no provider info
- **WHEN** user is connected to Supabase backend
- **AND** `authProvider` is `null` or empty
- **THEN** no provider row is displayed

#### Scenario: Provider row hidden for GAS connections
- **WHEN** user is connected to GAS backend
- **THEN** no provider row is displayed regardless of auth state

### Requirement: Provider icon displayed next to provider name

The provider row SHALL display an icon before the provider name when a matching icon is available. Icons SHALL use `aria-hidden="true"` since the text label is always present. Icon size SHALL be 14–16px, consistent with the surrounding text.

#### Scenario: Known provider shows icon and name
- **WHEN** `authProvider` is `"github"`
- **THEN** GitHub icon from lucide-react is displayed before "GitHub" text

#### Scenario: Unknown provider shows only text
- **WHEN** `authProvider` is `"keycloak"`
- **THEN** no icon is displayed
- **AND** "Keycloak" text is displayed

### Requirement: ProviderIcon component maps providers to icons

`ProviderIcon` component SHALL accept a `provider` string prop and render the corresponding icon. The mapping SHALL be:

| Provider   | Icon source                  |
|------------|------------------------------|
| `google`   | Inline SVG (Google logo)     |
| `azure`    | Inline SVG (Microsoft logo)  |
| `github`   | `Github` from lucide-react   |
| `apple`    | `Apple` from lucide-react    |
| `facebook` | `Facebook` from lucide-react |
| `twitter`  | `Twitter` from lucide-react  |
| `gitlab`   | `Gitlab` from lucide-react   |
| `slack`    | `Slack` from lucide-react    |
| `linkedin` | `Linkedin` from lucide-react |

For any provider not in the table, `ProviderIcon` SHALL return `null`.

#### Scenario: Google provider renders inline SVG
- **WHEN** `provider` is `"google"`
- **THEN** an inline SVG with the Google logo is rendered with `aria-hidden="true"`

#### Scenario: GitHub provider renders lucide icon
- **WHEN** `provider` is `"github"`
- **THEN** `Github` icon from lucide-react is rendered with `aria-hidden="true"`

#### Scenario: Unknown provider renders nothing
- **WHEN** `provider` is `"saml"`
- **THEN** `ProviderIcon` returns `null`

### Requirement: Provider icons on OAuth sign-in buttons

`ServerOAuthProviders` SHALL display a `ProviderIcon` on each OAuth provider button, positioned before the capitalized provider name. For unknown providers where `ProviderIcon` returns `null`, only the text name is shown. Icons SHALL use the same `ProviderIcon` component and mapping as the connected status row.

#### Scenario: Known provider button shows icon and name
- **WHEN** OAuth provider buttons are displayed
- **AND** provider is `"google"`
- **THEN** Google icon SVG is rendered inside the button with `aria-hidden="true"`
- **AND** "Google" text label is displayed after the icon

#### Scenario: Unknown provider button shows only name
- **WHEN** OAuth provider buttons are displayed
- **AND** provider is `"keycloak"`
- **THEN** no icon is rendered inside the button
- **AND** "Keycloak" text label is displayed

### Requirement: Provider row styling matches existing info rows

The provider row SHALL use the same CSS classes as the URL and account rows: `text-xs text-gray-400`. The row SHALL have `data-testid="server-connected-provider"` for testing.

#### Scenario: Provider row has consistent styling
- **WHEN** provider row is rendered
- **THEN** it uses `text-xs text-gray-400` classes
- **AND** it has `data-testid="server-connected-provider"`

### Requirement: i18n key for provider label

The label SHALL use i18n key `settings.server.oauthProvider`. Russian value: `"OAuth провайдер"`. English value: `"OAuth provider"`.

#### Scenario: Label localized in Russian
- **WHEN** app language is Russian
- **THEN** provider label is "OAuth провайдер"

#### Scenario: Label localized in English
- **WHEN** app language is English
- **THEN** provider label is "OAuth provider"
