## Context

Current Supabase contract tests depend on a live cloud instance configured via environment variables. This makes them unsuitable for CI and unreliable for local development. The integration test plan (`supabase-integration-test-plan.md`) proposes a Docker Compose-based full stack running locally.

## Goals / Non-Goals

**Goals:**
- Fully autonomous test environment using Docker containers
- Reuse existing migrations and Edge Functions without duplication
- Simple `pnpm --filter integration test` command to run everything

**Non-Goals:**
- CI pipeline integration (requires Docker-in-Docker, deferred)
- Testing with real third-party OAuth providers
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

### D7: Test user via mock OAuth flow

No pre-created users. The test authenticates via the real OAuth flow:
1. Playwright enters Supabase URL + anon key in Setup UI
2. Clicks "Sign in with Keycloak" → redirected to mock OAuth login form
3. Fills username → GoTrue callback → JWT issued → app navigates to /tasks
4. Access token extracted from localStorage for server-side verification

`globalSetup` only writes `supabaseUrl`, `anonKey`, `serviceRoleKey` to `.supabase-test-config.json`. No user creation or password auth.

### D8: navikt/mock-oauth2-server + nginx adapter

GoTrue's `keycloak` provider uses hardcoded paths (`/protocol/openid-connect/auth`, `/token`, `/userinfo`). navikt/mock-oauth2-server uses standard OIDC issuer paths (`/keycloak/authorize`, `/token`, `/userinfo`). An nginx reverse proxy maps between them.

The userinfo response format is standard OIDC (`sub`, `email`, `email_verified`, `name`) — matches both GoTrue keycloak provider expectations and navikt output. No response body transformation needed.

### D9: Docker networking via `hostname: host.docker.internal`

GoTrue needs a single URL for the OAuth provider that works both from the browser (redirect) and from inside Docker (token exchange). Setting `hostname: host.docker.internal` on the nginx adapter container makes:
- Docker DNS resolve `host.docker.internal` → adapter container IP (for server-to-server calls)
- macOS Docker Desktop resolve `host.docker.internal` → `127.0.0.1` (for browser redirects)

With matching port mapping (`8443:8443`), one URL works from both worlds.

### D10: Fixed ports for Kong and OAuth adapter

GoTrue's `API_EXTERNAL_URL` and `GOTRUE_EXTERNAL_KEYCLOAK_URL` must be known at container start time (browser-accessible URLs). Testcontainers' dynamic port mapping doesn't work here. Fixed ports: Kong on `54321`, adapter on `8443`.

### D11: Playwright webServer starts the client

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
| Fixed ports (54321, 8443) conflict     | Acceptable for integration tests; document in README                                |
| `latest` images may break              | Intentional: detect upstream breaking changes early (same as production would face) |
| Flaky container startup                | Use `Wait.forHttp()` health checks with generous timeout (120s)                     |
| `hostname: host.docker.internal`       | Overrides Docker Desktop default; no other service in stack uses it                 |
| Linux CI: host.docker.internal         | Needs `echo "127.0.0.1 host.docker.internal" >> /etc/hosts` in CI script            |
| navikt login form selectors            | Pin navikt image to `2.1.10` to prevent HTML changes breaking selectors             |
