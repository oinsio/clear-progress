# Supabase Integration Tests

## ADDED

### Capability Description

Autonomous integration testing of the full Supabase stack using Docker Compose + Testcontainers + Playwright. Verifies that the client app can connect to, authenticate with, and sync data through a real (local) Supabase instance.

### Docker Compose Stack

The integration test environment runs the following services:

| Service        | Image                        | Internal Port | Purpose                          |
|----------------|------------------------------|---------------|----------------------------------|
| db             | supabase/postgres:15.8.1.060 | 5432          | PostgreSQL with extensions       |
| auth           | supabase/gotrue              | 9999          | GoTrue authentication            |
| rest           | postgrest/postgrest          | 3000          | PostgREST API                    |
| storage        | supabase/storage-api         | 5000          | Storage API                      |
| edge-functions | supabase/edge-runtime        | 54321         | Deno Edge Functions              |
| kong           | kong:latest                  | 8000          | API Gateway (single entry point) |

All ports are mapped dynamically via Testcontainers to avoid conflicts.

### Lifecycle Management

- **Start**: `DockerComposeEnvironment.up()` in Playwright `globalSetup`
- **Health check**: `Wait.forHttp("/", 8000)` on Kong (waits for gateway to be ready)
- **Test user**: Created via GoTrue admin API after stack is healthy
- **Config**: Written to `.supabase-test-config.json` (supabaseUrl, anonKey, testUserToken)
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
├── src/
│   ├── global-setup.ts
│   ├── global-teardown.ts
│   ├── supabase-environment.ts
│   ├── config.ts
│   └── tests/
│       └── supabase-full-flow.spec.ts
```

### Dependencies

- `@playwright/test` ^1.49.1
- `testcontainers` ^10.0.0
- `@supabase/supabase-js` ^2.49.0

### Prerequisites

- Docker daemon running
- Ports dynamically allocated (no fixed port requirements)
- `packages/client` buildable (used as webServer)
