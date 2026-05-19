# Supabase Integration Tests

## ADDED

### Capability Description

Autonomous integration testing of the full Supabase stack using Docker Compose + Testcontainers + Playwright. Verifies that the client app can connect to, authenticate with, and sync data through a real (local) Supabase instance.

### Docker Compose Stack

The integration test environment runs the following services:

| Service            | Image                                    | Internal Port | Purpose                          |
|--------------------|------------------------------------------|---------------|----------------------------------|
| db                 | supabase/postgres:15.14.1.122            | 5432          | PostgreSQL with extensions       |
| auth               | supabase/auth:v2.189.0                   | 9999          | GoTrue authentication            |
| rest               | postgrest/postgrest:latest               | 3000          | PostgREST API                    |
| storage            | supabase/storage-api:latest              | 5000          | Storage API                      |
| edge-functions     | supabase/edge-runtime:v1.74.0            | 54321         | Deno Edge Functions              |
| kong               | kong:2.8.1                               | 8000          | API Gateway (single entry point) |
| mock-oauth         | ghcr.io/navikt/mock-oauth2-server:2.1.10 | 8080          | Mock OAuth2/OIDC server          |
| mock-oauth-adapter | nginx:alpine                             | 8443          | Path adapter (keycloak → navikt) |

Kong: fixed port 54321. OAuth adapter: fixed port 8443. Other ports mapped dynamically.

### Lifecycle Management

- **Start**: `DockerComposeEnvironment.up()` in Playwright `globalSetup`
- **Health check**: `Wait.forHttp("/", 8000)` on Kong (waits for gateway to be ready)
- **Edge Functions**: Verified via ping with `serviceRoleKey` (bypasses JWT verification)
- **Config**: Written to `.supabase-test-config.json` (supabaseUrl, anonKey, serviceRoleKey)
- **Auth**: Test authenticates via mock OAuth flow in Playwright (no pre-created users)
- **Stop**: `environment.down()` in Playwright `globalTeardown`

### Test Flow Requirements

The integration test verifies the following sequence:

1. **Connect**: Enter Supabase URL and anon key in the UI → click connect
2. **Verify connection**: Connected status indicator becomes visible
3. **Push**: Create a task locally → trigger sync push → verify server received it
4. **Pull**: Trigger pull → verify task data matches what was pushed

### Volume Mounts

- DB migrations: `../adapter-supabase/supabase/migrations/` → `/docker-entrypoint-initdb.d/`
- Edge Functions: `../adapter-supabase/supabase/functions/` → `/home/deno/functions/`

### Environment Configuration

Static JWT secrets (`.env.test`):
- `JWT_SECRET`: Known test value (matches Supabase local dev defaults)
- `ANON_KEY`: Pre-generated JWT with `role: anon`
- `SERVICE_ROLE_KEY`: Pre-generated JWT with `role: service_role`

### Package Structure

```
packages/integration/
├── package.json
├── tsconfig.json
├── playwright.config.ts
├── docker-compose.yml
├── .env.test
├── kong.yml
├── mock-oauth/
│   └── nginx.conf
├── db/
│   ├── roles.sql
│   ├── jwt.sql
│   └── init-storage.sql
├── functions/
│   └── main/
│       └── index.ts
├── src/
│   ├── global-setup.ts
│   ├── global-teardown.ts
│   ├── supabase-environment.ts
│   ├── environment-store.ts
│   ├── config.ts
│   └── tests/
│       ├── connection.spec.ts
│       └── tasks-sync.spec.ts
```

### Dependencies

- `@playwright/test` ^1.49.1
- `testcontainers` ^10.22.0

### Prerequisites

- Docker daemon running
- Kong: fixed port 54321, OAuth adapter: fixed port 8443; other ports dynamic
- `packages/client` buildable (used as webServer)
