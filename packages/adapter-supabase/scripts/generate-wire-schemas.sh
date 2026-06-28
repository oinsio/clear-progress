#!/bin/bash
# Generates wireSchemas.ts for Deno Edge Functions from the contract package.
# Single source of truth: packages/contract/src/schemas/primitives.ts + entities.ts
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PACKAGE_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${PACKAGE_DIR}/../.." && pwd)"

PRIMITIVES="${REPO_ROOT}/packages/contract/src/schemas/primitives.ts"
ENTITIES="${REPO_ROOT}/packages/contract/src/schemas/entities.ts"
OUTPUT="${PACKAGE_DIR}/supabase/functions/_shared/wireSchemas.ts"

[[ -f "${PRIMITIVES}" ]] || { echo "ERROR: ${PRIMITIVES} not found" >&2; exit 1; }
[[ -f "${ENTITIES}" ]] || { echo "ERROR: ${ENTITIES} not found" >&2; exit 1; }

# strip_imports: removes import blocks (single-line and multi-line) and "export type" lines
strip_imports() {
  awk '
    /^import / { in_import = 1 }
    in_import  { if (/;/) in_import = 0; next }
    /^export type / { next }
    { print }
  '
}

{
  cat <<'HEADER'
// GENERATED — DO NOT EDIT
// Source: packages/contract/src/schemas/primitives.ts + entities.ts
// Run: bash scripts/generate-wire-schemas.sh

import { z } from "npm:zod@3";
HEADER

  strip_imports < "${PRIMITIVES}"
  strip_imports < "${ENTITIES}"

} > "${OUTPUT}"

echo "[generate-wire-schemas] Written ${OUTPUT}"
