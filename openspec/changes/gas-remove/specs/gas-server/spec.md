## REMOVED Requirements

### Requirement: GAS server routing via doPost
**Reason**: GAS backend removed from the project. Supabase Edge Functions replace all server-side logic.
**Migration**: None needed — Supabase Edge Functions handle routing.

### Requirement: GAS server authentication
**Reason**: GAS backend removed.
**Migration**: Supabase RLS and JWT verification replace GAS auth.

### Requirement: GAS server error handling
**Reason**: GAS backend removed.
**Migration**: None needed.
