## ADDED Requirements

### Requirement: Create GAS adapter from connection config

The system SHALL create a GAS sync adapter by calling `createGasAdapter(config.url, getAccessToken)` when the active connection config has `type: "gas"`. The adapter SHALL implement the `SyncAdapter` interface.

#### Scenario: GAS config creates GAS adapter  # implements FR1, FR5 of adapter-loader-spec
- **WHEN** `createSyncAdapter()` is called and `getConnectionConfig()` returns a config with `type: "gas"` and `url: "https://script.google.com/test"`
- **THEN** `createGasAdapter` is called with the config URL and `getAccessToken` function
- **AND** the returned object is the GAS adapter instance

### Requirement: Create Supabase adapter from connection config

The system SHALL create a Supabase sync adapter by calling `createSupabaseAdapter(getSupabaseClient())` when the active connection config has `type: "supabase"`. The adapter SHALL implement the `SyncAdapter` interface.

#### Scenario: Supabase config creates Supabase adapter  # implements FR1, FR6 of adapter-loader-spec
- **WHEN** `createSyncAdapter()` is called and `getConnectionConfig()` returns a config with `type: "supabase"`
- **THEN** `createSupabaseAdapter` is called with the Supabase client instance
- **AND** the returned object is the Supabase adapter instance

### Requirement: Error when no backend configured

The system SHALL throw an error with message "No backend configured" when `getDefaultSyncAdapter()` is called and `getConnectionConfig()` returns `null`.

#### Scenario: No config throws error  # implements FR2 of adapter-loader-spec
- **WHEN** `getDefaultSyncAdapter()` is called and no connection config exists
- **THEN** an error is thrown with message "No backend configured"

### Requirement: Lazy caching of adapter instance

The `getDefaultSyncAdapter()` function SHALL create the adapter on the first call and return the cached instance on subsequent calls. The factory function (`createGasAdapter` or `createSupabaseAdapter`) SHALL be called exactly once regardless of how many times `getDefaultSyncAdapter()` is invoked.

#### Scenario: Adapter is cached after first creation  # implements FR3 of adapter-loader-spec
- **WHEN** `getDefaultSyncAdapter()` is called twice with a valid GAS config
- **THEN** both calls return the same adapter instance
- **AND** `createGasAdapter` is called exactly once

### Requirement: IIFE fallback for module-scope initialization

The `defaultSyncAdapter` module-scope constant SHALL attempt to create an adapter at module load time via an IIFE. If no connection config is available, it SHALL return `null` as a placeholder (cast to `SyncAdapter`). If a config is available, it SHALL return the created adapter.

#### Scenario: IIFE returns null when no config at load time  # implements FR4 of adapter-loader-spec
- **WHEN** the `defaultServices` module is loaded and no connection config exists
- **THEN** `defaultSyncAdapter` is `null`

#### Scenario: IIFE returns adapter when config exists at load time  # implements FR4 of adapter-loader-spec
- **WHEN** the `defaultServices` module is loaded and a valid GAS config exists
- **THEN** `defaultSyncAdapter` is the GAS adapter instance
