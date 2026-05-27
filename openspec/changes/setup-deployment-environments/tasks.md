## 1. Client env files (FR1, FR2, FR3, FR8)

- [x] 1.1 Create `packages/client/.env.dev` with VITE_BASE_PATH, VITE_SUPABASE_URL (placeholder), VITE_SUPABASE_ANON_KEY (placeholder)
- [x] 1.2 Create `packages/client/.env.qa` with VITE_BASE_PATH=/, VITE_SUPABASE_URL (placeholder), VITE_SUPABASE_ANON_KEY (placeholder)
- [x] 1.3 Create `packages/client/.env.prod` with VITE_BASE_PATH=/clear-progress/, VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY (placeholder)
- [x] 1.4 Update `package.json` scripts: `--mode dev` for dev, `--mode prod` for build/preview
- [x] 1.5 Verify client code reads VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from `import.meta.env`

## 2. Netlify configuration (FR5, D1)

- [x] 2.1 Create `netlify.toml` at project root: build command, publish dir, SPA redirects
- [x] 2.2 Add `_redirects` to `packages/client/public/` as fallback for SPA routing

## 3. GitHub Actions QA workflow (FR4, FR7, NFR-P1)

- [x] 3.1 Create `.github/workflows/deploy-qa.yml`: trigger on pull_request to main
- [x] 3.2 Add steps: checkout, setup pnpm/node, install, preflight
- [x] 3.3 Add build step: `pnpm --filter @clear-progress/client... build` with `--mode qa` and env from GitHub Secrets
- [x] 3.4 Add Netlify deploy step via `nwtgck/actions-netlify@v3` with preview comment in PR
- [x] 3.5 Document required GitHub Secrets: QA_SUPABASE_URL, QA_SUPABASE_ANON_KEY, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID

## 4. Multi-environment deploy.sh (FR6, D5)

- [x] 4.1 Update Supabase `deploy.sh` and `reset-db.sh`: require explicit argument `dev`/`qa`/`prod` (no default)
- [x] 4.2 Implement env file selection: `.env.{env}` pattern (`.env.dev`, `.env.qa`, `.env.prod`)
- [x] 4.3 Add validation: error if the specified env file does not exist
- [x] 4.4 Create per-environment base files with placeholders: `.env.dev`, `.env.qa`, `.env.prod` (committed to git); real values go into `.env.{env}.local` (gitignored)
- [x] 4.5 Remove old `.env.example` (replaced by per-environment examples)

## 5. GAS multi-environment (FR9, D6)

- [x] 5.1 Add `DEPLOY_ID_QA` to `.env.example` and `.env`
- [x] 5.2 Update `deploy.sh`: add `qa` to `get_deploy_id`, usage, status, ping commands

## 6. Verification

- [ ] 6.1 Verify `pnpm dev` — client starts with variables from `.env.dev`
- [ ] 6.2 Verify `pnpm --filter @clear-progress/client... build --mode qa` — build succeeds
- [ ] 6.3 Verify `pnpm run build` — PROD build is not broken
- [ ] 6.4 Verify Supabase `deploy.sh qa` — script loads `.env.qa`
- [ ] 6.5 Verify Supabase `deploy.sh` without arguments — exits with error
- [ ] 6.6 Verify Supabase `reset-db.sh qa` — script loads `.env.qa`
- [ ] 6.7 Verify GAS `deploy.sh status` — shows dev/qa/prod deployment IDs
