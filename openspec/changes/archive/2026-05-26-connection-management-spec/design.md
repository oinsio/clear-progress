# Design: Connection Management Spec

## Context

Connection management is implemented across multiple layers:
- **ConnectionService** (`connectionService.ts`) — pure functions for connect/disconnect/getConfig/getSavedConfig/getBackendType, persisting to localStorage
- **useConnectionConfig** hook — reactive state via `BACKEND_CONNECTION_EVENT` custom event and `storage` event
- **useConnectionStatus** hook — derives status from config + auth + sync state with strict priority order
- **useBackendConnected** hook — deprecated wrapper returning boolean
- **ConnectionConfig** schema (`@clear-progress/contract`) — Zod discriminated union (gas | supabase)

Existing unit tests cover all layers but lack BDD feature files. The offline_mode change already has a `connection_status.feature` covering FR4 of add-offline-mode-specs — we add new BDD tests for the service layer (connect, disconnect, read) and create a formal spec. This change is driven by FR1-FR11 from proposal.

## Goals / Non-Goals

**Goals:**
- Create openspec spec documenting connection management behavior as the authoritative reference
- Add BDD feature files and step definitions for ConnectionService operations
- Add BDD feature files and step definitions for connection status derivation logic
- Follow established patterns from other entity BDD tests (vitest-cucumber)

**Non-Goals:**
- No refactoring of existing connection code
- No E2E tests (connection UI is covered by setup wizards)
- No duplicate of offline_mode connection_status.feature (that covers a different change's FR)

## Decisions

### Decision 1: BDD tests at service level, not hook level for ConnectionService

Focus BDD tests on `ConnectionService` functions (connect, disconnect, getConnectionConfig, getSavedConnectionConfig, getBackendType) since these contain the core business logic (localStorage persistence, schema validation, event dispatch). Hook tests already exist as standard vitest tests and test React rendering behavior, not business rules.

Alternative considered: BDD tests for useConnectionConfig hook — rejected because the hook is a thin reactive wrapper with no domain logic worth expressing in Gherkin.

### Decision 2: Separate BDD feature for connection status derivation

Add a new `connection_status_derivation.feature` in the `connection_management/` directory covering the status priority rules (FR7). Although `offline_mode/connection_status.feature` exists, it belongs to a different change and requirement context. Our feature focuses on the complete derivation logic from this change's perspective.

Alternative considered: Extending the existing offline_mode feature — rejected because it would violate change immutability and mix traceability links.

### Decision 3: Use localStorage directly for service BDD steps

ConnectionService operates on localStorage, not IndexedDB. BDD steps will use `localStorage.setItem/getItem` directly for setup and verification, matching the existing unit test pattern.

## Risks / Trade-offs

- [Risk] Connection status BDD may overlap with offline_mode BDD tests -> Mitigation: Our tests reference connection-management-spec FRs and focus on the complete priority chain, while offline_mode tests focus on sync-driven statuses
- [Risk] Specs may drift from implementation -> Mitigation: BDD tests serve as executable specs, keeping them in sync
