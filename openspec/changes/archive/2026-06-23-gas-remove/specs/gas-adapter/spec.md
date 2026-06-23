## REMOVED Requirements

### Requirement: GasSyncAdapter implements SyncAdapter interface
**Reason**: GAS backend removed from the project due to slow performance and complex setup. Supabase is the sole backend.
**Migration**: Use Supabase adapter (`createSupabaseAdapter`) instead.

### Requirement: GAS adapter transport via fetch
**Reason**: GAS backend removed.
**Migration**: None needed — Supabase adapter uses `supabase.functions.invoke()`.

### Requirement: GAS adapter authentication via Bearer token
**Reason**: GAS backend removed.
**Migration**: Supabase SDK handles auth automatically.

### Requirement: GAS adapter timeout handling
**Reason**: GAS backend removed.
**Migration**: None needed.

### Requirement: GAS adapter response validation
**Reason**: GAS backend removed.
**Migration**: None needed — Supabase adapter validates responses identically.
