## Context

Clear Progress has a PROD environment (GitHub Pages + Supabase Cloud) and a local DEV environment (Docker Compose from `packages/integration`). There are no formalized env files for the client and no QA environment for verifying PRs before merge. The current `deploy.sh` works with only one Supabase project via `.env`.

Driven by G1, G2, G3 from proposal.

## Goals / Non-Goals

**Goals:**
- Formalize env variables for three environments (FR1-FR3)
- Automatic QA deploy on PR (FR4, FR5, G2)
- Multi-environment support in deploy.sh (FR6)

**Non-Goals:**
- Auto-deploy Supabase migrations from CI (NG2)
- CD pipeline for PROD — stays as current push-to-main → GitHub Pages (NG4)

## Decisions

### D1: Netlify for QA PWA hosting

**Decision**: Netlify Free tier for QA preview deploys.

**Alternatives**:
- Cloudflare Pages — more bandwidth (unlimited), but less convenient preview comment integration in GitHub PRs
- Vercel — commercial use restrictions on free tier
- Another GitHub Pages — not possible, one site per repository

**Rationale**: Netlify provides automatic preview deploys with PR comments, 100 GB bandwidth/mo, 300 build min/mo — sufficient for QA. Native GitHub integration.

### D2: Second Supabase Free project for QA

**Decision**: Create a separate Supabase project for the QA environment.

**Rationale**: Supabase Free tier allows 2 projects. Full isolation of data, Auth, Edge Functions, and RLS between environments. Migrations are deployed manually via `deploy.sh qa` (FR6).

### D3: Vite mode for environment switching

**Decision**: Use Vite's `.env.[mode]` mechanism with short mode names (`dev`/`qa`/`prod`) and `.local` overrides for real secrets. Scripts pass `--mode dev`/`--mode qa`/`--mode prod` explicitly.

**Files committed to git** (placeholders only):
- `.env.dev` — localhost Docker Compose Supabase (demo anon key — safe)
- `.env.qa` — placeholder URLs/keys
- `.env.prod` — placeholder URLs/keys + `VITE_BASE_PATH=/clear-progress/`

**Files excluded from git** (`.env.*.local` pattern in `.gitignore`):
- `.env.dev.local` — real dev Supabase URL and anon key
- `.env.qa.local` — real QA Supabase URL and anon key
- `.env.prod.local` — real PROD Supabase URL and anon key

Vite automatically merges `.env.[mode].local` over `.env.[mode]` — local files take precedence.

For CI, real values come from GitHub Secrets (injected as env vars in the workflow), so `.local` files are not needed on CI.

**Variables** (prefixed with `VITE_`):
- `VITE_BASE_PATH` — base path for the router
- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_ANON_KEY` — public anon key

### D4: GitHub Actions workflow for QA

**Decision**: Separate `deploy-qa.yml` workflow, triggered on `pull_request` to main.

**Steps**: checkout → setup pnpm → install → preflight (lint+typecheck+test) → build `--mode qa` → deploy to Netlify via `nwtgck/actions-netlify`.

**GitHub Secrets**: `QA_SUPABASE_URL`, `QA_SUPABASE_ANON_KEY`, `NETLIFY_AUTH_TOKEN`, `NETLIFY_SITE_ID`.

### D5: Multi-environment deploy.sh

**Decision**: `deploy.sh` and `reset-db.sh` require an explicit positional argument `dev`, `qa`, or `prod` (no default — prevents accidental deploy to wrong environment).

**Mechanism**: Loads `.env.{env}` (`.env.dev`, `.env.qa`, or `.env.prod`) from `packages/adapter-supabase/`, then merges `.env.{env}.local` overrides if present. Each env file contains deploy variables (`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_PROJECT_REF`, `SUPABASE_ACCESS_TOKEN`). Base files `.env.{env}` with placeholders are committed to git; real values go into `.env.{env}.local` files (gitignored via `.env.*.local` pattern).

**Naming**: Short names (`dev`/`qa`/`prod`) are used consistently across the entire project — both `adapter-supabase` and `client`. Vite scripts pass `--mode dev`/`--mode qa`/`--mode prod` explicitly instead of relying on Vite defaults (`development`/`production`).

### D6: GAS multi-environment deployments

**Decision**: GAS `deploy.sh` supports three environments (`dev`/`qa`/`prod`) via `DEPLOY_ID_{DEV,QA,PROD}` in a single `.env` file.

**Rationale**: Unlike Supabase (separate projects per environment), GAS uses one Apps Script project with multiple deployment IDs. A single `.env` with all deployment IDs is the natural fit — splitting into per-environment files would be artificial since `SCRIPT_ID` and `.clasp.json` are shared.

## Risks / Trade-offs

- **[Supabase Free tier pausing]** — inactive projects on free tier are paused after 1 week without activity → **Mitigation**: QA project is used on every PR, sufficient to maintain activity. If paused — reactivation via dashboard takes ~1 min.
- **[Netlify build minutes]** — 300 min/mo may not suffice with frequent PRs → **Mitigation**: Build takes ~1-2 min, enough for ~150-300 PRs/mo — sufficient for a solo developer.
- **[Env secrets in .env.qa]** — anon key is technically public (RLS protects data), but best not to commit → **Mitigation**: `.env.[mode]` files contain only placeholders, real values go into `.env.[mode].local` (gitignored) for local use or GitHub Secrets for CI (FR7, FR8).
- **[Migration drift between environments]** — QA and PROD can diverge → **Mitigation**: `deploy.sh qa` runs before PR testing, `deploy.sh prod` runs after merge.
