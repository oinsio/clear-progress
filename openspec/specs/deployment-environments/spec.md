### Requirement: Vite environment mode support
The client SHALL support three Vite modes: `dev`, `qa`, and `prod`. Each mode SHALL load its corresponding `.env.[mode]` file with `VITE_BASE_PATH`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` variables. Mode is always passed explicitly via `--mode` flag (no reliance on Vite defaults).

#### Scenario: Dev mode loads local Supabase
- **WHEN** developer runs `pnpm dev` (which executes `vite --mode dev`)
- **THEN** Vite loads `.env.dev` with local Supabase URL

#### Scenario: QA mode loads QA Supabase
- **WHEN** CI builds client with `vite build --mode qa`
- **THEN** Vite loads `.env.qa` with QA Supabase project URL

#### Scenario: Prod mode loads PROD Supabase
- **WHEN** CI builds client with `pnpm build` (which executes `vite build --mode prod`)
- **THEN** Vite loads `.env.prod` with PROD Supabase project URL and `VITE_BASE_PATH=/clear-progress/`

### Requirement: Environment files contain no real secrets
All `.env.[mode]` files committed to the repository SHALL contain only template placeholders or publicly safe values (e.g., Supabase local dev demo key). Real environment-specific values SHALL be stored in `.env.[mode].local` files (excluded from git via `.env.*.local` pattern in `.gitignore`) for local use, or in GitHub Secrets for CI.

#### Scenario: Committed env files have no secrets
- **WHEN** `.env.dev`, `.env.qa`, `.env.prod` are checked into git
- **THEN** none of them contain real Supabase URLs, anon keys, service role keys, or access tokens (except the standard local dev demo key in `.env.dev`)

#### Scenario: Local overrides via .local files
- **WHEN** developer creates `.env.prod.local` or `.env.qa.local` with real values
- **THEN** Vite merges them over the committed `.env.[mode]` files (local takes precedence)
- **AND** `.local` files are excluded from git by `.gitignore`

### Requirement: QA preview deploy on pull request
A GitHub Actions workflow SHALL automatically build the client in `qa` mode and deploy to Netlify when a pull request targets the `main` branch. The workflow SHALL run preflight checks (lint, typecheck, tests) before building.

#### Scenario: PR triggers QA deploy
- **WHEN** developer opens or updates a pull request targeting `main`
- **THEN** GitHub Actions runs preflight, builds with `--mode qa`, and deploys to Netlify

#### Scenario: Preflight failure blocks deploy
- **WHEN** preflight checks fail (lint, typecheck, or tests)
- **THEN** the workflow fails and Netlify deploy does NOT happen

### Requirement: Netlify SPA routing
The Netlify configuration SHALL redirect all paths to `/index.html` with status 200 to support client-side routing.

#### Scenario: Deep link loads SPA
- **WHEN** user navigates directly to a deep URL (e.g., `/inbox`) on QA Netlify
- **THEN** the server returns `/index.html` and the client router handles the path

### Requirement: Multi-environment Supabase deploy
The `deploy.sh` and `reset-db.sh` scripts SHALL require an explicit environment argument (`dev`, `qa`, or `prod`) with no default. They SHALL load environment-specific variables from `.env.{env}` (e.g., `.env.dev`, `.env.qa`, `.env.prod`), then merge `.env.{env}.local` overrides if present, and operate on the selected Supabase project. Per-environment base files (`.env.dev`, `.env.qa`, `.env.prod`) with placeholders SHALL be committed to git. Real values SHALL be stored in `.env.{env}.local` files (excluded from git via `.env.*.local` pattern).

#### Scenario: Deploy to QA
- **WHEN** operator runs `deploy.sh qa`
- **THEN** script loads `.env.qa` and deploys migrations, functions, and storage bucket to the QA Supabase project

#### Scenario: Deploy to PROD
- **WHEN** operator runs `deploy.sh prod`
- **THEN** script loads `.env.prod` and deploys to the PROD Supabase project

#### Scenario: Missing environment argument
- **WHEN** operator runs `deploy.sh` without arguments
- **THEN** script exits with an error message requiring an explicit environment argument

#### Scenario: Deploy to DEV
- **WHEN** operator runs `deploy.sh dev`
- **THEN** script loads `.env.dev` and deploys to the DEV Supabase project

#### Scenario: Reset QA database
- **WHEN** operator runs `reset-db.sh qa`
- **THEN** script loads `.env.qa` and resets the QA database

#### Scenario: Missing env file
- **WHEN** operator runs `deploy.sh qa` but `.env.qa` does not exist
- **THEN** script exits with an error message indicating the missing `.env.qa` file

### Requirement: GAS multi-environment deployments
The GAS `deploy.sh` SHALL support three environments (`dev`, `qa`, `prod`) via `DEPLOY_ID_{DEV,QA,PROD}` variables in a single `.env` file. GAS uses one Apps Script project with multiple deployment IDs (unlike Supabase which uses separate projects per environment).

#### Scenario: Deploy GAS to QA
- **WHEN** operator runs `./deploy.sh deploy qa`
- **THEN** script uses `DEPLOY_ID_QA` from `.env` to update the QA deployment

#### Scenario: GAS status shows all environments
- **WHEN** operator runs `./deploy.sh status`
- **THEN** output lists deployment IDs for dev, qa, and prod

### Requirement: QA CI pipeline performance
The QA GitHub Actions workflow SHALL complete (preflight + build + deploy) within 5 minutes for typical runs.

#### Scenario: Pipeline completes within time budget
- **WHEN** QA workflow runs on a standard PR (no new dependencies)
- **THEN** total wall time is under 5 minutes
