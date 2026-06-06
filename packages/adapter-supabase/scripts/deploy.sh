#!/usr/bin/env bash
# implements FR17, M4 of add-supabase-adapter
# implements FR4 of add-file-attachments
# Automates: migrations apply, Edge Functions deploy, Storage bucket creation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

log() { echo "[deploy] $*"; }
error() { echo "[deploy] ERROR: $*" >&2; exit 1; }

# implements FR6 of setup-deployment-environments
DEPLOY_ENV="${1:-}"
[[ -n "${DEPLOY_ENV}" ]] || error "Environment argument is required. Usage: deploy.sh <dev|qa|prod>"

FILES_BUCKET="files"

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------

command -v supabase >/dev/null 2>&1 || error "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"

# ---------------------------------------------------------------------------
# Load .env
# ---------------------------------------------------------------------------

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

log "Deploying to ${DEPLOY_ENV} environment..."

[[ -n "${SUPABASE_PROJECT_REF:-}" ]] || error "SUPABASE_PROJECT_REF is not set in .env"

# ---------------------------------------------------------------------------
# Link project
# ---------------------------------------------------------------------------

log "Linking to project ${SUPABASE_PROJECT_REF}..."
cd "${PACKAGE_DIR}"
supabase link --project-ref "${SUPABASE_PROJECT_REF}"

# ---------------------------------------------------------------------------
# 1. Apply migrations
# ---------------------------------------------------------------------------

log "Applying database migrations..."
supabase db push

log "Migrations applied."

# ---------------------------------------------------------------------------
# 2. Deploy Edge Functions
# ---------------------------------------------------------------------------

FUNCTIONS=(
  ping
  init
  pull
  push
  purge
  upload-file
  upload-files
  get-file
  delete-file
)

log "Deploying Edge Functions..."
for fn in "${FUNCTIONS[@]}"; do
  log "  → $fn"
  supabase functions deploy "$fn" --project-ref "${SUPABASE_PROJECT_REF:-}"
done

log "Edge Functions deployed."

# ---------------------------------------------------------------------------
# 3. Create Storage bucket
# ---------------------------------------------------------------------------

log "Creating Storage bucket '${FILES_BUCKET}' (idempotent)..."
supabase storage create "${FILES_BUCKET}" --public=false 2>/dev/null || log "  Bucket already exists, skipping."

log "Deployment complete."
