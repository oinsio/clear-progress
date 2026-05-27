# Setup Deployment Environments

## Why

The project currently has only one environment — PROD (GitHub Pages + Supabase Cloud), while development runs locally without formalized env files. There is no intermediate QA environment for testing before release. This creates a risk of shipping bugs to production and complicates PR review. Formalized DEV, QA, and PROD environments are needed, using free hosting services.

## What Changes

- **ADDED**: Per-environment client env files (`.env.dev`, `.env.qa`, `.env.prod`) with VITE variables for Supabase URL/key
- **ADDED**: GitHub Actions workflow `deploy-qa.yml` — preflight + build + deploy to Netlify on PR to main
- **ADDED**: Netlify config (`netlify.toml`) for QA preview deploys
- **ADDED**: Multi-environment support in Supabase `deploy.sh`/`reset-db.sh` (argument `dev`/`qa`/`prod`)
- **MODIFIED**: GAS `deploy.sh` — added `qa` environment (`DEPLOY_ID_QA`)
- **MODIFIED**: Documentation for environment setup (env vars, GitHub secrets)

## Goals

- **G1**: Three isolated environments (DEV, QA, PROD) at zero cost
- **G2**: Automatic QA deploy on pull request creation
- **G3**: Uniform env variable management across all environments

## Non-Goals

- **NG1**: Staging environment with full load testing
- **NG2**: Automatic Supabase migration deploy from CI (manual via deploy.sh for now)
- **NG3**: Monitoring and alerting for environments
- **NG4**: Migrating PROD away from GitHub Pages to another host

## Users & Scenarios

- **U1**: Developer — works locally with Docker Compose Supabase, env variables loaded from `.env.dev`
- **U2**: Reviewer — opens preview URL from PR on Netlify, connected to QA Supabase
- **U3**: End user — uses PROD on GitHub Pages with the primary Supabase project

## Requirements

### Functional

- **FR1**: Client supports Vite `--mode` for switching between environments (`dev`, `qa`, `prod`)
- **FR2**: `.env.dev` contains local Docker Compose Supabase URL (`localhost:54321`)
- **FR3**: `.env.qa` contains the URL of a second free Supabase project
- **FR4**: `deploy-qa.yml` triggers on `pull_request` to main, runs preflight and deploys to Netlify
- **FR5**: `netlify.toml` is configured for SPA (redirect `/*` → `/index.html`) with the correct build command
- **FR6**: `deploy.sh` and `reset-db.sh` require an explicit environment argument (`dev`/`qa`/`prod`, no default) and load `.env.{env}` for the corresponding project variables
- **FR7**: QA secrets (Supabase URL/key, Netlify token) are stored in GitHub Secrets
- **FR8**: `.env.qa` and `.env.dev` contain no real secrets — only templates or publicly safe values
- **FR9**: GAS `deploy.sh` supports `dev`/`qa`/`prod` environments via `DEPLOY_ID_{DEV,QA,PROD}` in `.env`

### Non-Functional

#### Performance

- **NFR-P1**: QA CI pipeline completes in < 5 minutes (preflight + build + deploy)

#### Accessibility

_(not applicable — infrastructure change)_

#### Responsive

_(not applicable — infrastructure change)_

## UX Acceptance Criteria

- **UX1**: Developer can run `pnpm dev` with no additional env setup (defaults from `.env.dev`)
- **UX2**: PR in GitHub automatically receives a comment with a preview URL from Netlify
- **UX3**: `deploy.sh dev` / `deploy.sh qa` / `deploy.sh prod` — single command to deploy Supabase to the target environment

## Behavior

No Gherkin scenarios — infrastructure change with no user-facing UI.

## Visual Reference

Not applicable.

## Affected IA

No changes to Information Architecture.

## Success Metrics

- **M1**: PRs automatically receive a Netlify preview deploy with a working PWA
- **M2**: `pnpm dev` works out-of-the-box with local Supabase
- **M3**: `deploy.sh qa` successfully deploys migrations and functions to the QA Supabase project
- **M4**: All three environments are isolated — QA data does not leak into PROD and vice versa

## Open Questions

- **Q1**: ~~Should Supabase migrations be auto-deployed from CI or is manual `deploy.sh` sufficient?~~ **Resolved**: manual deploy via `deploy.sh`; will automate when needed.
- **Q2**: ~~Should we use Cloudflare Pages instead of Netlify (more bandwidth, different DX)?~~ **Resolved**: Netlify for now; will switch to Cloudflare Pages if needed.
