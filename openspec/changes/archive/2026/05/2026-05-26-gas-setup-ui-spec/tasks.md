## 1. OpenSpec Stable Spec

- [x] 1.1 Create `openspec/specs/gas-setup-ui/spec.md` — GAS setup UI capability (URL input with Deployment ID resolution, Client ID input, connection validation via ping, initialization flow, connected state display, disconnect) — implements FR1, FR2, FR3, FR4, FR5, FR6, FR7

## 2. BDD Feature Files — URL Parsing

- [x] 2.1 Create `features/gas_setup_ui/gas_setup_url_parsing.feature` — scenarios for parseGasInput (Deployment ID, full URL, whitespace) and parseClientId (plain ID, full ID) — @gas-setup-ui-spec @FR2 @FR7 @FR10

## 3. BDD Step Definitions — URL Parsing

- [x] 3.1 Create `features/gas_setup_ui/steps/gas_setup_url_parsing.steps.ts` — step definitions for pure utility functions

## 4. BDD Feature Files — Connection Flow

- [x] 4.1 Create `features/gas_setup_ui/gas_setup_connection.feature` — scenarios for connect flow (empty URL disables button, successful ping to initialized/uninitialized backend, with/without Client ID, ping failure, network error, loading state, init flow) — @gas-setup-ui-spec @FR1 @FR3 @FR4 @FR5 @FR8

## 5. BDD Step Definitions — Connection Flow

- [x] 5.1 Create `features/gas_setup_ui/steps/gas_setup_connection.steps.tsx` — step definitions using React Testing Library with mocked dependencies

## 6. BDD Feature Files — Connected State

- [x] 6.1 Create `features/gas_setup_ui/gas_setup_connected.feature` — scenarios for connected state (URL display, Client ID display, sign-in prompt, disconnect, go to app) — @gas-setup-ui-spec @FR6 @FR9

## 7. BDD Step Definitions — Connected State

- [x] 7.1 Create `features/gas_setup_ui/steps/gas_setup_connected.steps.tsx` — step definitions for connected state display and actions

## 8. Verification

- [x] 8.1 Run all BDD tests and verify they pass
- [x] 8.2 Verify build: `pnpm run build`
