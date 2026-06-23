## REMOVED Requirements

### Requirement: Google Sheets data schema
**Reason**: GAS backend removed. Google Sheets is no longer used as a database.
**Migration**: Data is stored in Supabase PostgreSQL.

### Requirement: Sheets CRUD operations
**Reason**: GAS backend removed.
**Migration**: Supabase Edge Functions handle CRUD via PostgreSQL.

### Requirement: Sheets type coercion
**Reason**: GAS backend removed.
**Migration**: PostgreSQL handles types natively.

### Requirement: Sheets metadata operations
**Reason**: GAS backend removed.
**Migration**: None needed.
