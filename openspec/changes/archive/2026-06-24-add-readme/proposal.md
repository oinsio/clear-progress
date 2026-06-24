# Add README with Supabase Setup Guide

## Problem

The project has no root README.md. Users who want to self-host the Supabase backend have no guide on how to create a free Supabase account, configure OAuth, deploy the backend, and connect the app. Developers exploring the repo have no entry point to understand what the project is, how to run it, or how it's structured.

## Solution

Create two README files:
- `README.md` (English) — primary, displayed by GitHub
- `README.ru.md` (Russian) — linked from the English version

Both files mirror the same structure and cover: project description, features, live app link, Supabase self-hosting guide (step-by-step for free tier), tech stack, development setup, and links to detailed documentation.

## Goals

- G1: Users can set up their own free Supabase backend by following the README
- G2: Developers can understand, clone, and run the project within minutes
- G3: Both Russian and English speakers are served equally

## Non-Goals

- NG1: License section (separate change)
- NG2: Contributing guide (separate change)
- NG3: Screenshots or demo GIF (not available yet)
- NG4: Alternative backend setup without CLI (manual SQL in Dashboard)

## Functional Requirements

- FR1: README.md in English at project root, displayed by GitHub
- FR2: README.ru.md in Russian at project root, linked from README.md
- FR3: Cross-links between language versions at the top of each file
- FR4: "What is Clear Progress?" section — personal task/goal/idea manager for GTD and Jedi Empty Inbox techniques, client-first PWA with offline support
- FR5: Features list — boxes (inbox/today/week/later), goals, ideas, contexts, categories, recurring tasks, checklists, offline-first (IndexedDB), sync via personal Supabase, i18n (ru/en), PWA installable
- FR6: Live app link — https://oinsio.github.io/clear-progress/
- FR7: "Setting Up Your Server (Supabase)" section with sub-steps:
  - FR7.1: Why Supabase — free tier, your data on your server
  - FR7.2: Free tier limits table — 500 MB DB, 1 GB Storage, 50K MAU, 500K Edge Function invocations, 2 free projects, auto-pause after 1 week inactivity
  - FR7.3: Step 1 — Create Supabase account and project (link to supabase.com/dashboard)
  - FR7.4: Step 2 — Enable OAuth provider (recommend OAuth over email OTP due to 2 emails/hour limit on free tier; link to Supabase Social Login docs: https://supabase.com/docs/guides/auth/social-login)
  - FR7.5: Step 3 — Deploy backend via CLI (install Supabase CLI, supabase login, clone repo, run deploy.sh)
  - FR7.6: Step 4 — Connect in the app (Settings → Server → Supabase, enter Project URL + Anon Key, sign in with OAuth)
- FR8: Tech stack section — React, TypeScript, Vite, Tailwind CSS, Dexie (IndexedDB), Supabase (Edge Functions, PostgreSQL, RLS, Storage), i18next, pnpm monorepo
- FR9: Development section — prerequisites (Node.js >=20, pnpm >=9), install (`pnpm install`), run (`pnpm dev`), build (`pnpm build`)
- FR10: Project structure overview — monorepo packages (client, contract, adapter-supabase, adapter-inmemory, integration)
- FR11: Testing section — unit (Vitest), BDD unit (vitest-cucumber), BDD E2E (playwright-bdd), mutation (Stryker)
- FR12: Links to detailed docs — packages/adapter-supabase/README.md, docs/contributing/how-to-add-adapter.md, docs/architecture/

## UX Requirements

- UX1: README renders correctly on GitHub (standard Markdown, no HTML hacks)
- UX2: Supabase setup instructions are sequential and numbered — user follows steps 1-4 in order
- UX3: Each step clearly states what to do and where (Dashboard vs CLI vs App)
- UX4: Important warnings (free tier limits, email OTP restriction, auto-pause) are visually distinct

## Success Metrics

- M1: A user with no prior Supabase experience can create an account, deploy the backend, and connect the app by following the README alone
- M2: A developer can clone the repo, install dependencies, and run the app locally by following the Development section
