## MODIFIED Requirements

### Requirement: Adapter registration replaced with per-type factory

`adapter-supabase` SHALL export `createSupabaseAdapter(supabaseClient)` as the factory function for creating Supabase sync adapters.  # implements FR4 of gas-remove

#### Scenario: Supabase adapter created via factory
- **WHEN** `createSupabaseAdapter(supabaseClient)` is called
- **THEN** a `SupabaseSyncAdapter` instance is returned

## REMOVED Requirements

### Requirement: GAS adapter factory reference
**Reason**: GAS backend removed. `createGasAdapter(url, getAccessToken)` no longer exists.
**Migration**: None needed — `defaultServices.ts` only calls `createSupabaseAdapter`.
