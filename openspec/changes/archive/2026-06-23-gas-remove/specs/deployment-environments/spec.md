## REMOVED Requirements

### Requirement: GAS multi-environment deployments
**Reason**: GAS backend removed. The `deploy.sh` script in `packages/adapter-gas/` is deleted along with the entire package.
**Migration**: Use Supabase `deploy.sh` and `reset-db.sh` for all environments.
