# @clear-progress/adapter-supabase

Supabase backend adapter for Clear Progress. Implements the `SyncAdapter` interface via Supabase Edge Functions, PostgreSQL, Row Level Security, and Supabase Storage.

> **Target**: Fresh deployment in under 10 minutes (M4 of add-supabase-adapter).

---

## Prerequisites

- [Node.js](https://nodejs.org/) ≥ 18 and [pnpm](https://pnpm.io/)
- [Supabase CLI](https://supabase.com/docs/guides/cli) ≥ 1.x — `npm install -g supabase`
- A Supabase project (free tier is sufficient for personal use)

---

## Supabase Project Setup

### 1. Create a Supabase project

Go to [supabase.com/dashboard](https://supabase.com/dashboard), create a new project, and note:
- **Project URL** (e.g. `https://xyzcompany.supabase.co`)
- **Anon/public key**
- **Service role key** (Settings → API → Secret)
- **Project ref** (short ID from the URL, e.g. `xyzcompany`)

### 2. Log in with the Supabase CLI

```bash
supabase login
```

### 3. Link the CLI to your project

```bash
cd packages/adapter-supabase
supabase link --project-ref your-project-ref
```

---

## Environment Variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable                    | Required for   | Description                                   |
|-----------------------------|----------------|-----------------------------------------------|
| `SUPABASE_URL`              | Edge Functions | Project URL                                   |
| `SUPABASE_ANON_KEY`         | Edge Functions | Anon/public key (enforces RLS)                |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions | Service role key (bypasses RLS — keep secret) |
| `SUPABASE_PROJECT_REF`      | `deploy.sh`    | Project ref short ID                          |
| `TEST_SUPABASE_URL`         | Contract tests | Edge Functions base URL                       |
| `TEST_SUPABASE_TOKEN`       | Contract tests | JWT for the test user                         |
| `TEST_SUPABASE_PROJECT_URL` | Contract tests | Project REST URL                              |
| `TEST_SUPABASE_SERVICE_KEY` | Contract tests | Service role key (test teardown)              |

> `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` are automatically available inside Edge Functions when deployed to Supabase — you do not need to set them manually in the Supabase dashboard.

---

## Deploy

Run the deployment script from the package root:

```bash
cd packages/adapter-supabase
SUPABASE_PROJECT_REF=your-project-ref bash scripts/deploy.sh
```

The script performs three steps:
1. **Apply migrations** — runs `supabase db push` to create tables, RLS policies, and the `push_records` RPC function.
2. **Deploy Edge Functions** — deploys `ping`, `init`, `pull`, `push`, `purge`, `upload-cover`, `upload-covers`, `get-cover`, `delete-cover`.
3. **Create Storage bucket** — creates the `covers` bucket (private, with RLS).

---

## Client Configuration

In Clear Progress settings, select **Supabase** as the backend type and provide:

| Field            | Value                                               |
|------------------|-----------------------------------------------------|
| **URL**          | `https://your-project-ref.supabase.co/functions/v1` |
| **Access token** | Supabase JWT (obtained after login)                 |

The `SupabaseSyncAdapter` is registered in `adapter-loader` under the key `"supabase"` and constructed automatically when the backend type is set to `"supabase"`.

---

## Running Contract Tests

Contract tests require a live Supabase instance. Set the test environment variables in `.env`, then:

```bash
pnpm test
```

If `TEST_SUPABASE_URL`, `TEST_SUPABASE_TOKEN`, `TEST_SUPABASE_PROJECT_URL`, and `TEST_SUPABASE_SERVICE_KEY` are not set, the contract tests are skipped automatically.

---

## Architecture

| Component      | Technology                        | Purpose                                           |
|----------------|-----------------------------------|---------------------------------------------------|
| HTTP client    | `@supabase/supabase-js` + `fetch` | Client-side adapter                               |
| Edge Functions | Deno (TypeScript)                 | Server-side sync logic                            |
| `push_records` | PostgreSQL RPC                    | Atomic revision assignment with `FOR UPDATE` lock |
| Data isolation | Row Level Security                | Each user sees only their own rows                |
| Cover storage  | Supabase Storage                  | Binary files with CDN and user-scoped access      |

See [`design.md`](../../openspec/changes/add-supabase-adapter/design.md) for architectural decisions.

---

## Troubleshooting

### Edge Function cold start latency
The first request after an idle period may take 200–500ms. This is normal — the `ping()` call on app open pre-warms all functions.

### `SYNC_LOCK_TIMEOUT` error
Concurrent pushes from the same user (e.g. multiple browser tabs) may hit the 10-second `FOR UPDATE` lock timeout. The client should retry with exponential backoff.

### Free tier limits
Supabase free tier includes 500 MB database, 1 GB Storage, and 500,000 Edge Function invocations per month. For personal use this is more than sufficient.

### Migrations fail with permission errors
Ensure you have run `supabase link --project-ref your-project-ref` and that your Supabase CLI session is authenticated (`supabase login`).
