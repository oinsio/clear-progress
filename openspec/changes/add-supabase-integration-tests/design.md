## Context

Current Supabase contract tests depend on a live cloud instance configured via environment variables. This makes them unsuitable for CI and unreliable for local development. The integration test plan (`supabase-integration-test-plan.md`) proposes a Docker Compose-based full stack running locally.

## Goals / Non-Goals

**Goals:**
- Fully autonomous test environment using Docker containers
- Reuse existing migrations and Edge Functions without duplication
- Simple `pnpm --filter integration test` command to run everything

**Non-Goals:**
- CI pipeline integration (requires Docker-in-Docker, deferred)
- Testing auth flows beyond pre-created test user
- Performance testing of containers

## Decisions

### D1: New package `packages/integration`

Separate package keeps integration test infrastructure isolated from the main client and adapter packages. It has its own dependencies (testcontainers, playwright) that shouldn't pollute other packages.

### D2: Testcontainers `DockerComposeEnvironment` for lifecycle

Using testcontainers' `DockerComposeEnvironment` in Playwright's `globalSetup`/`globalTeardown` provides:
- Automatic port mapping (avoids conflicts)
- Wait strategies (health checks before tests start)
- Clean teardown on failure

Alternative considered: Manual `docker compose up/down` in scripts — rejected because it doesn't handle cleanup on test failure and requires manual port management.

### D3: Static JWT secrets in `.env.test`

Using known static values for `JWT_SECRET`, `ANON_KEY`, and `SERVICE_ROLE_KEY` (same as Supabase local development defaults). This avoids key generation and allows hardcoded anon key in test config.

### D4: Mount migrations from adapter-supabase

```yaml
db:
  volumes:
    - ../adapter-supabase/supabase/migrations:/docker-entrypoint-initdb.d
```

No duplication — always uses the latest migrations from the source package.

### D5: Mount Edge Functions from adapter-supabase

```yaml
edge-functions:
  volumes:
    - ../adapter-supabase/supabase/functions:/home/deno/functions
```

Same principle — no copies, always the current source.

### D6: Kong as API Gateway

Kong provides a single URL entry point (`http://localhost:<port>`) that routes to all services, matching the real Supabase architecture. Tests use this URL as `supabaseUrl`.

### D7: Test user via GoTrue admin API

In `globalSetup`, after containers are healthy:
1. Create user via GoTrue admin endpoint using `SERVICE_ROLE_KEY`
2. Sign in to get access token
3. Write credentials to `.supabase-test-config.json`

Playwright tests read this config file for connection parameters.

### D8: Playwright webServer starts the client

```typescript
webServer: {
  command: "pnpm --filter client dev",
  url: "http://localhost:5173",
  reuseExistingServer: true,
}
```

The client app runs on its normal dev server; integration tests interact with it via browser.

## Risks / Trade-offs

| Risk                                   | Mitigation                                                                          |
|----------------------------------------|-------------------------------------------------------------------------------------|
| Docker not installed on dev machine    | Document requirement, fail fast with clear error message                            |
| First run slow (image pulls)           | Document expected first-run time; `latest` tags cached after first pull             |
| Port conflicts with local Supabase CLI | Use testcontainers port mapping (random available ports)                            |
| `latest` images may break              | Intentional: detect upstream breaking changes early (same as production would face) |
| Flaky container startup                | Use `Wait.forHttp()` health checks with generous timeout (120s)                     |
