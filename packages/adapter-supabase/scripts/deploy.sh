#!/usr/bin/env bash
# implements FR17, M4 of add-supabase-adapter
# Automates: migrations apply, Edge Functions deploy, Storage bucket creation
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"

COVERS_BUCKET="covers"

log() { echo "[deploy] $*"; }
error() { echo "[deploy] ERROR: $*" >&2; exit 1; }

# ---------------------------------------------------------------------------
# Prerequisites
# ---------------------------------------------------------------------------

command -v supabase >/dev/null 2>&1 || error "supabase CLI not found. Install: https://supabase.com/docs/guides/cli"

# ---------------------------------------------------------------------------
# 1. Apply migrations
# ---------------------------------------------------------------------------

log "Applying database migrations..."
cd "${PACKAGE_DIR}"
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
  upload-cover
  upload-covers
  get-cover
  delete-cover
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

log "Creating Storage bucket '${COVERS_BUCKET}' (idempotent)..."
supabase storage create "${COVERS_BUCKET}" --public=false 2>/dev/null || log "  Bucket already exists, skipping."

log "Deployment complete."
