#!/usr/bin/env bash
# Reset remote database: drop all tables and re-apply all migrations from scratch.
# WARNING: This destroys ALL data in the remote database.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

log() { echo "[reset-db] $*"; }
error() { echo "[reset-db] ERROR: $*" >&2; exit 1; }

command -v supabase >/dev/null 2>&1 || error "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"

# implements FR6 of setup-deployment-environments
DEPLOY_ENV="${1:-}"
[[ -n "${DEPLOY_ENV}" ]] || error "Environment argument is required. Usage: reset-db.sh <dev|qa|prod>"

case "${DEPLOY_ENV}" in
  dev|qa|prod) ;;
  *) error "Unknown environment '${DEPLOY_ENV}'. Use 'dev', 'qa', or 'prod'." ;;
esac

ENV_FILE="${PACKAGE_DIR}/.env.${DEPLOY_ENV}"
LOCAL_ENV_FILE="${ENV_FILE}.local"

[[ -f "${ENV_FILE}" ]] || error "Environment file not found: ${ENV_FILE}"
set -a
# shellcheck source=../.env.prod
source "${ENV_FILE}"
# shellcheck source=../.env.prod.local
[[ -f "${LOCAL_ENV_FILE}" ]] && source "${LOCAL_ENV_FILE}"
set +a

[[ -n "${SUPABASE_PROJECT_REF:-}" ]] || error "SUPABASE_PROJECT_REF is not set in ${ENV_FILE}"

log "This will DROP all tables and re-apply migrations for project ${SUPABASE_PROJECT_REF}."
read -rp "[reset-db] Are you sure? (y/N): " confirm
[[ "${confirm}" =~ ^[Yy]$ ]] || { log "Aborted."; exit 0; }

cd "${PACKAGE_DIR}"

log "Linking to project ${SUPABASE_PROJECT_REF}..."
supabase link --project-ref "${SUPABASE_PROJECT_REF}"

log "Resetting remote database..."
supabase db reset --linked

log "Database reset complete. All migrations re-applied."
