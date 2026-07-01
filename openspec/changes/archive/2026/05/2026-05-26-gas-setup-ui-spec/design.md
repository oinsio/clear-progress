## Context

GAS setup UI is fully implemented across two components:
- **GasSetupSection** — collapsible section with URL input, Client ID input, multi-phase connection flow (input → connecting → awaiting_signin → not_initialized → initializing → error)
- **GasConnectedSection** — displays connected URL, Client ID, sign-in prompt, disconnect and go-to-app actions

Supporting utilities: `parseGasInput` (resolves Deployment ID to full GAS URL), `parseClientId` (appends Google Client ID suffix). Connection is validated via `adapter.ping()`.

The Supabase equivalent (`supabase-ui-connection` spec, `supabase_setup_connection.feature`) already has full coverage. This change follows the same patterns.

## Goals / Non-Goals

**Goals:**
- Create openspec specs documenting GAS setup behavior as the authoritative reference
- Add BDD feature files and step definitions covering the full GAS connection lifecycle
- Follow established patterns from `supabase_setup_connection.steps.tsx`

**Non-Goals:**
- No refactoring of existing GAS setup code
- No E2E tests (GAS setup E2E not in scope)
- No GAS adapter or server spec changes (already exist separately)

## Decisions

### Decision 1: BDD tests at component level via React Testing Library

Follow the established pattern from `supabase_setup_connection.steps.tsx` — render `SetupPage` with mocked dependencies, interact via `data-testid` attributes, verify UI state transitions. This tests the full component integration rather than isolated units.

Alternative considered: testing GasSetupSection in isolation — rejected because the component is tightly coupled with SetupPage state (accordion toggling, connected/disconnected routing).

### Decision 2: Separate feature files by concern

Split into three feature files:
- `gas_setup_connection.feature` — connection flow (input, connect, error, init phases)
- `gas_setup_connected.feature` — connected state (URL display, sign-in prompt, disconnect)
- `gas_setup_url_parsing.feature` — pure utility tests (parseGasInput, parseClientId)

This matches the separation in the Supabase setup tests and keeps each file under 400 lines.

### Decision 3: Single capability spec

All GAS setup UI behavior fits in one `gas-setup-ui` spec since it covers a single UI surface (SetupPage GAS section). No need to split like settings (which had fundamentally different storage strategies).

## Risks / Trade-offs

- [Risk] Specs may drift from implementation → Mitigation: BDD tests serve as executable specs
- [Risk] GasSetupSection has complex phase state machine → Mitigation: cover each phase transition explicitly in scenarios
