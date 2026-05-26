# GAS Setup UI Spec

## Why

The GAS setup UI (GasSetupSection, GasConnectedSection) is fully implemented but lacks formal specifications and BDD tests. The analogous Supabase setup UI already has an openspec spec (`supabase-ui-connection`) and BDD feature files. This creates a documentation gap, making it harder to verify GAS setup behavior and detect regressions.

## What Changes

- **ADDED**: OpenSpec capability spec for GAS setup UI — URL input, connection validation via ping, Client ID input, initialization flow, connected state display, disconnect
- **ADDED**: BDD feature files covering GAS setup connection flow, error handling, connected state, and parseGasInput utility
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every GAS setup UI behavior has a formal specification in openspec
- G2: BDD feature files cover all GAS setup scenarios (connect, error, init, connected state, disconnect)
- G3: Close the documentation gap between GAS setup and Supabase setup UI

## Non-Goals

- NG1: No changes to GasSetupSection or GasConnectedSection implementation code
- NG2: No E2E/Playwright tests (out of scope for this change)
- NG3: No changes to the GAS adapter or server specs (already exist)
- NG4: No changes to the connection-management spec (already exists)

## Users & Scenarios

- U1: Developer maintaining GAS setup code — uses specs as reference for expected behavior
- U2: AI agent implementing changes to setup flow — uses specs to understand the GAS connection lifecycle

## Requirements

### Functional

- FR1: Spec documents GasSetupSection collapsible section with URL and Client ID inputs
- FR2: Spec documents parseGasInput resolving Deployment ID to full GAS URL
- FR3: Spec documents connection validation via adapter ping
- FR4: Spec documents error states (connection failure, init failure)
- FR5: Spec documents initialization flow for uninitialized backends (with and without Client ID)
- FR6: Spec documents GasConnectedSection displaying URL, Client ID, sign-in prompt, disconnect, and go-to-app actions
- FR7: Spec documents parseClientId appending Google Client ID suffix
- FR8: BDD scenarios cover GasSetupSection connect flow (happy path, errors, phases)
- FR9: BDD scenarios cover GasConnectedSection display and actions
- FR10: BDD scenarios cover parseGasInput and parseClientId utilities

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/gas_setup_ui/gas_setup_connection.feature` — @gas-setup-ui-spec @FR1 @FR3 @FR4 @FR5 @FR8
- `features/gas_setup_ui/gas_setup_connected.feature` — @gas-setup-ui-spec @FR6 @FR9
- `features/gas_setup_ui/gas_setup_url_parsing.feature` — @gas-setup-ui-spec @FR2 @FR7 @FR10

## Affected IA

No changes.

## Success Metrics

- M1: 100% of GAS setup UI behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: All BDD tests pass in <5s

## Open Questions

(none)

## Capabilities

### New Capabilities

- `gas-setup-ui`: GAS backend setup UI — URL input with Deployment ID resolution, Client ID input, connection validation via ping, initialization flow, connected state display with disconnect

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/gas-setup-ui/spec.md`
- New feature files: 3 files under `packages/client/src/test/features/gas_setup_ui/`
- New step definitions: corresponding `.steps.ts` files
- No changes to existing implementation code
