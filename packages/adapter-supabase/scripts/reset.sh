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

# ─── Reset Storage buckets via Management API ────────────────────────────────

[[ -n "${SUPABASE_ACCESS_TOKEN:-}" ]] || error "SUPABASE_ACCESS_TOKEN is not set in ${ENV_FILE}"
[[ -n "${SUPABASE_URL:-}" ]] || error "SUPABASE_URL is not set in ${ENV_FILE}"

MANAGEMENT_API="https://api.supabase.com"

log "Fetching service role key via Management API..."
API_KEYS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${SUPABASE_ACCESS_TOKEN}" \
  "${MANAGEMENT_API}/v1/projects/${SUPABASE_PROJECT_REF}/api-keys")
API_KEYS_HTTP_CODE=$(echo "${API_KEYS_RESPONSE}" | tail -1)
API_KEYS_BODY=$(echo "${API_KEYS_RESPONSE}" | sed '$d')

[[ "${API_KEYS_HTTP_CODE}" == "200" ]] || error "Failed to fetch API keys (HTTP ${API_KEYS_HTTP_CODE}): ${API_KEYS_BODY}"

SERVICE_ROLE_KEY=$(echo "${API_KEYS_BODY}" | python3 -c "
import sys, json
keys = json.load(sys.stdin)
for k in keys:
    if k.get('name') == 'service_role':
        print(k['api_key'])
        break
")
[[ -n "${SERVICE_ROLE_KEY}" ]] || error "service_role key not found in API keys response"

STORAGE_API="${SUPABASE_URL}/storage/v1"

log "Listing storage buckets..."
BUCKETS_RESPONSE=$(curl -s -w "\n%{http_code}" \
  -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
  -H "apikey: ${SERVICE_ROLE_KEY}" \
  "${STORAGE_API}/bucket")
BUCKETS_HTTP_CODE=$(echo "${BUCKETS_RESPONSE}" | tail -1)
BUCKETS_BODY=$(echo "${BUCKETS_RESPONSE}" | sed '$d')

if [[ "${BUCKETS_HTTP_CODE}" != "200" ]]; then
  log "WARNING: Failed to list buckets (HTTP ${BUCKETS_HTTP_CODE}): ${BUCKETS_BODY}"
  log "Skipping storage reset."
else
  BUCKET_IDS=$(echo "${BUCKETS_BODY}" | python3 -c "
import sys, json
buckets = json.load(sys.stdin)
for b in buckets:
    print(b['id'])
" 2>/dev/null || true)

  if [[ -z "${BUCKET_IDS}" ]]; then
    log "No storage buckets found."
  else
    for BUCKET_ID in ${BUCKET_IDS}; do
      log "Emptying bucket '${BUCKET_ID}'..."
      EMPTY_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        "${STORAGE_API}/bucket/${BUCKET_ID}/empty")
      EMPTY_HTTP_CODE=$(echo "${EMPTY_RESPONSE}" | tail -1)
      if [[ "${EMPTY_HTTP_CODE}" != "200" ]]; then
        log "WARNING: Failed to empty bucket '${BUCKET_ID}' (HTTP ${EMPTY_HTTP_CODE})"
      fi

      log "Deleting bucket '${BUCKET_ID}'..."
      DELETE_RESPONSE=$(curl -s -w "\n%{http_code}" -X DELETE \
        -H "Authorization: Bearer ${SERVICE_ROLE_KEY}" \
        -H "apikey: ${SERVICE_ROLE_KEY}" \
        "${STORAGE_API}/bucket/${BUCKET_ID}")
      DELETE_HTTP_CODE=$(echo "${DELETE_RESPONSE}" | tail -1)
      if [[ "${DELETE_HTTP_CODE}" != "200" ]]; then
        log "WARNING: Failed to delete bucket '${BUCKET_ID}' (HTTP ${DELETE_HTTP_CODE})"
      fi
    done
    log "Storage buckets deleted."
  fi
fi

# ─── Reset database ──────────────────────────────────────────────────────────

log "Linking to project ${SUPABASE_PROJECT_REF}..."
supabase link --project-ref "${SUPABASE_PROJECT_REF}"

log "Resetting remote database..."
supabase db reset --linked

log "Database reset complete. All migrations re-applied."
