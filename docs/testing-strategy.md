# Clear Progress — Testing Strategy

## 1. Overview

This document describes the tools, approaches, and testing practices for the Clear Progress application (React PWA + Google Apps Script + Google Sheets).

### Test Pyramid

```
        ╱ ‾ ‾ ‾ ‾ ‾ ╲
       ╱   E2E (10%)   ╲          Playwright
      ╱─────────────────╲
     ╱ Integration (30%) ╲      Vitest + Testing Library + MSW
    ╱───────────────────────╲
   ╱    Unit Tests (60%)     ╲    Vitest
  ╱ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾ ‾╲
```

| Level       | Tools                                | Coverage                                                        |
|-------------|--------------------------------------|-----------------------------------------------------------------|
| Unit        | Vitest                               | Utils, helpers, sync logic, data transformations                |
| Integration | Vitest + React Testing Library + MSW | Components with interactions, hooks, CRUD operations, IndexedDB |
| E2E         | Playwright                           | Full user scenarios, offline, swipes, PWA                       |

---

## 2. Tool Stack

### 2.1 Vitest

Primary test runner. Chosen because it's already in the project stack, works natively with Vite, supports TypeScript without additional configuration, and is compatible with Jest API.

**Responsibility:** unit tests, component integration tests.

### 2.2 React Testing Library

Testing components from the user's perspective — through visible text, roles, labels. Independent of implementation details.

**Responsibility:** component rendering, user interactions (click, input), checking displayed state.

### 2.3 MSW (Mock Service Worker)

HTTP request interception at the service worker level. Single mock layer for both Vitest and Playwright.

**Responsibility:** mocking GAS API (pull/push/ping/init), simulating sync conflicts, simulating network errors.

### 2.4 Playwright

Cross-browser E2E framework. Supports mobile device emulation, offline mode, touch events.

**Responsibility:** full user scenarios, offline/online transitions, swipe gestures, visual regression.

### 2.5 fake-indexeddb

In-memory IndexedDB implementation for Node.js. Allows testing Dexie.js in unit tests without a browser.

**Responsibility:** local cache operations, offline change queue.

---

## 3. Configuration

### 3.1 Vitest

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/test/**',
        'src/**/*.d.ts',
        'src/main.tsx',
      ],
      thresholds: {
        statements: 70,
        branches: 65,
        functions: 70,
        lines: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

### 3.2 Setup File

```ts
// src/test/setup.ts
import '@testing-library/jest-dom/vitest';
import 'fake-indexeddb/auto';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeAll, afterAll } from 'vitest';
import { server } from './mocks/server';

// MSW — start before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  cleanup();
  server.resetHandlers();
});
afterAll(() => server.close());

// Mock crypto.randomUUID for stable tests
let uuidCounter = 0;
vi.stubGlobal('crypto', {
  ...crypto,
  randomUUID: () => `test-uuid-${++uuidCounter}`,
});
```

### 3.3 MSW — Handlers

```ts
// src/test/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

const GAS_URL = 'https://script.google.com/macros/s/*/exec';

// Data factory
export function createTask(overrides = {}) {
  return {
    id: crypto.randomUUID(),
    name: 'Test Task',
    description: '',
    box: 'inbox',
    goal_id: '',
    context_id: '',
    category_id: '',
    is_completed: false,
    completed_at: '',
    sort_order: 0,
    is_deleted: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    version: 1,
    ...overrides,
  };
}

export const handlers = [
  // ping
  http.get(GAS_URL, ({ request }) => {
    const url = new URL(request.url);
    if (url.searchParams.get('action') === 'ping') {
      return HttpResponse.json({
        ok: true,
        initialized: true,
        timestamp: new Date().toISOString(),
      });
    }
  }),

  // pull
  http.post(GAS_URL, async ({ request }) => {
    const body = await request.json() as { action: string };
    if (body.action === 'pull') {
      return HttpResponse.json({
        ok: true,
        data: {
          tasks: [],
          goals: [],
          contexts: [],
          categories: [],
          checklist_items: [],
          settings: [],
        },
      });
    }

    // push
    if (body.action === 'push') {
      return HttpResponse.json({
        ok: true,
        results: [], // all accepted
      });
    }

    return HttpResponse.json({ ok: false, error: 'Unknown action' }, { status: 400 });
  }),
];
```

```ts
// src/test/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### 3.4 Playwright

```ts
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html'],
    ['list'],
  ],
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 14'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 4. Test Examples

### 4.1 Unit Test — Task Sorting Utility

```ts
// src/utils/sort.test.ts
import { describe, it, expect } from 'vitest';
import { sortTasks } from './sort';
import { createTask } from '@/test/mocks/handlers';

describe('sortTasks', () => {
  it('sorts by sort_order ascending', () => {
    const tasks = [
      createTask({ name: 'C', sort_order: 3 }),
      createTask({ name: 'A', sort_order: 1 }),
      createTask({ name: 'B', sort_order: 2 }),
    ];

    const sorted = sortTasks(tasks);
    expect(sorted.map(t => t.name)).toEqual(['A', 'B', 'C']);
  });

  it('excludes soft-deleted tasks', () => {
    const tasks = [
      createTask({ name: 'Active', is_deleted: false }),
      createTask({ name: 'Deleted', is_deleted: true }),
    ];

    const sorted = sortTasks(tasks);
    expect(sorted).toHaveLength(1);
    expect(sorted[0].name).toBe('Active');
  });
});
```

### 4.2 Integration Test — Task Creation

```tsx
// src/features/tasks/TaskCreateForm.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TaskCreateForm } from './TaskCreateForm';
import { TestProviders } from '@/test/TestProviders';

describe('TaskCreateForm', () => {
  it('creates task and clears form', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(
      <TestProviders>
        <TaskCreateForm onCreated={onCreated} />
      </TestProviders>
    );

    const input = screen.getByPlaceholderText(/task name/i);
    await user.type(input, 'Buy milk');
    await user.click(screen.getByRole('button', { name: /create/i }));

    expect(onCreated).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Buy milk',
        box: 'inbox',
      })
    );
    expect(input).toHaveValue('');
  });

  it('does not create task with empty name', async () => {
    const user = userEvent.setup();
    const onCreated = vi.fn();

    render(
      <TestProviders>
        <TaskCreateForm onCreated={onCreated} />
      </TestProviders>
    );

    await user.click(screen.getByRole('button', { name: /create/i }));
    expect(onCreated).not.toHaveBeenCalled();
  });
});
```

### 4.3 Integration Test — Sync with Conflict

```ts
// src/services/sync.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { SyncService } from './sync';
import { db } from '@/db';
import { createTask } from '@/test/mocks/handlers';

describe('SyncService.push', () => {
  beforeEach(async () => {
    await db.tasks.clear();
  });

  it('handles conflict — overwrites local version', async () => {
    const localTask = createTask({
      id: 'task-1',
      name: 'Local Version',
      version: 2,
    });
    await db.tasks.put(localTask);

    const serverTask = createTask({
      id: 'task-1',
      name: 'Server Version',
      version: 3,
      updated_at: new Date(Date.now() + 1000).toISOString(),
    });

    server.use(
      http.post('https://script.google.com/macros/s/*/exec', () => {
        return HttpResponse.json({
          ok: true,
          results: [
            { id: 'task-1', status: 'conflict', server_record: serverTask },
          ],
        });
      })
    );

    await SyncService.push([localTask]);
    const stored = await db.tasks.get('task-1');

    expect(stored?.name).toBe('Server Version');
    expect(stored?.version).toBe(3);
  });
});
```

### 4.4 IndexedDB / Dexie.js Test

```ts
// src/db/tasks.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './index';
import { createTask } from '@/test/mocks/handlers';

describe('TasksDB', () => {
  beforeEach(async () => {
    await db.tasks.clear();
  });

  it('saves and finds task by box', async () => {
    await db.tasks.bulkPut([
      createTask({ id: '1', box: 'today' }),
      createTask({ id: '2', box: 'inbox' }),
      createTask({ id: '3', box: 'today' }),
    ]);

    const todayTasks = await db.tasks
      .where('box')
      .equals('today')
      .toArray();

    expect(todayTasks).toHaveLength(2);
  });

  it('stores queue of unsent changes', async () => {
    const task = createTask({ id: '1', name: 'Offline Task' });
    await db.tasks.put(task);
    await db.pendingChanges.put({
      id: crypto.randomUUID(),
      entity: 'tasks',
      record_id: '1',
      timestamp: new Date().toISOString(),
    });

    const pending = await db.pendingChanges.toArray();
    expect(pending).toHaveLength(1);
    expect(pending[0].record_id).toBe('1');
  });
});
```

### 4.5 E2E — Full Task Scenario

```ts
// e2e/task-lifecycle.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Task Lifecycle', () => {
  test('create → move → complete', async ({ page }) => {
    await page.goto('/');

    // Create task in inbox
    await page.getByPlaceholder(/task name/i).fill('E2E task');
    await page.getByRole('button', { name: /create/i }).click();
    await expect(page.getByText('E2E task')).toBeVisible();

    // Move to today
    await page.getByText('E2E task').click();
    await page.getByRole('button', { name: /today/i }).click();

    // Navigate to today and verify
    await page.getByRole('link', { name: /today/i }).click();
    await expect(page.getByText('E2E task')).toBeVisible();

    // Complete task (swipe right)
    const task = page.getByText('E2E task');
    const box = await task.boundingBox();
    if (box) {
      await page.mouse.move(box.x + 10, box.y + box.height / 2);
      await page.mouse.down();
      await page.mouse.move(box.x + 200, box.y + box.height / 2, { steps: 10 });
      await page.mouse.up();
    }

    await expect(page.getByText('E2E task')).not.toBeVisible();
  });
});
```

### 4.6 E2E — Offline Mode

```ts
// e2e/offline-sync.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Offline Sync', () => {
  test('task created offline and syncs on reconnect', async ({ page, context }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Create task
    await page.getByPlaceholder(/task name/i).fill('Offline task');
    await page.getByRole('button', { name: /create/i }).click();

    // Task visible in UI
    await expect(page.getByText('Offline task')).toBeVisible();

    // Offline indicator
    await expect(page.getByTestId('offline-indicator')).toBeVisible();

    // Reconnect
    await context.setOffline(false);

    // Sync indicator → disappears
    await expect(page.getByTestId('sync-indicator')).toBeVisible();
    await expect(page.getByTestId('sync-indicator')).not.toBeVisible({
      timeout: 15000,
    });

    // Task still visible
    await expect(page.getByText('Offline task')).toBeVisible();
  });
});
```

---

## 5. File Structure

```
src/
├── test/
│   ├── setup.ts                    # Global setup (MSW, fake-indexeddb, mocks)
│   ├── TestProviders.tsx            # Wrapper with Router, Store, QueryClient
│   └── mocks/
│       ├── handlers.ts              # MSW handlers + data factories
│       └── server.ts                # MSW server for Node
├── db/
│   ├── index.ts
│   └── tasks.test.ts
├── services/
│   ├── sync.ts
│   └── sync.test.ts
├── utils/
│   ├── sort.ts
│   └── sort.test.ts
└── features/
    ├── tasks/
    │   ├── TaskCreateForm.tsx
    │   ├── TaskCreateForm.test.tsx
    │   ├── TaskList.tsx
    │   └── TaskList.test.tsx
    ├── goals/
    │   ├── GoalCard.tsx
    │   └── GoalCard.test.tsx
    └── ...

e2e/
├── task-lifecycle.spec.ts
├── offline-sync.spec.ts
├── navigation.spec.ts
├── goals.spec.ts
└── fixtures/
    └── test-data.ts                 # E2E fixtures
```

Principle: test files are co-located with tested code (`.test.ts` / `.test.tsx`). E2E in separate `e2e/` folder.

---

## 6. MSW — GAS API Mocks

### 6.1 Principle

MSW intercepts all requests to GAS URL and returns controlled responses. One set of handlers is used in both Vitest and Playwright (via `setupWorker` in browser).

### 6.2 Override for Specific Test

```ts
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';

it('shows error when backend unavailable', async () => {
  server.use(
    http.get('https://script.google.com/macros/s/*/exec', () => {
      return HttpResponse.error(); // Simulate network error
    })
  );

  // ... render and verify
});
```

### 6.3 Mock Scenarios

| Scenario                        | What to Mock                                        |
|---------------------------------|-----------------------------------------------------|
| First run (not initialized)     | `ping` → `{ initialized: false }`                   |
| Normal operation                | `pull` → data, `push` → `accepted`                  |
| Sync conflict                   | `push` → `conflict` + `server_record`               |
| Network error                   | `HttpResponse.error()`                              |
| Slow response                   | `delay('real')` or `delay(5000)`                    |
| Server error                    | `HttpResponse.json({ ok: false }, { status: 500 })` |

---

## 7. Testing IndexedDB / Dexie.js

### 7.1 Approach

In unit/integration tests: `fake-indexeddb/auto` (imported in setup.ts) replaces global `indexedDB` with in-memory implementation. Dexie works with it transparently.

In E2E: Playwright uses real browser IndexedDB. Cleanup between tests via `page.evaluate(() => indexedDB.deleteDatabase('ClearProgressDB'))`.

### 7.2 What to Test

- CRUD operations for each entity
- Indexes and queries by `box`, `goal_id`, `context_id`, `is_deleted`
- `pendingChanges` queue — add, retrieve, clear after push
- Schema migrations (when updating Dexie version)
- Edge cases: empty strings instead of null, ISO date correctness

---

## 8. Testing GAS Backend

### 8.1 Approach

GAS has no built-in test framework. Options:

**Option A — HTTP tests against test deployment.** Separate GAS deployment linked to test Google Sheet. Tests (Vitest or any HTTP client) send requests and verify responses.

```ts
// backend-tests/api.test.ts
const GAS_TEST_URL = process.env.GAS_TEST_DEPLOY_URL;

describe('GAS API', () => {
  it('init creates sheet structure', async () => {
    const res = await fetch(GAS_TEST_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'init' }),
    });
    const data = await res.json();

    expect(data.ok).toBe(true);
  });

  it('push + pull — round-trip', async () => {
    const task = { /* ... */ };

    await fetch(GAS_TEST_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'push', changes: { tasks: [task] } }),
    });

    const pullRes = await fetch(GAS_TEST_URL, {
      method: 'POST',
      body: JSON.stringify({ action: 'pull', versions: { tasks: 0 } }),
    });
    const pullData = await pullRes.json();

    expect(pullData.data.tasks).toContainEqual(
      expect.objectContaining({ id: task.id })
    );
  });
});
```

**Option B — clasp + GAS unit tests.** Extract GAS business logic into pure functions, test them locally via `gas-local` or similar libraries.

---

## 9. Key Scenarios to Cover

### 9.1 Critical (Must Have)

- Create/edit/delete task (soft delete)
- Move between boxes (inbox → today → week → later)
- Complete task (swipe)
- Sync: pull → push → conflict handling
- Offline mode: create tasks → reconnect → sync
- Navigation: side menu, screen transitions
- Goals: create, statuses, task linking, covers

### 9.2 Important (MVP)

- Task search
- Filter by context/category
- Default box in settings
- Accent color — switching
- Swipe actions (left — delete, right — complete)

### 9.3 Regression (v1.1+)

- Checklists inside task
- Recurring tasks
- Focus mode
- Quick properties panel
- Inbox processing

---

## 10. CI Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-integration:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: pnpm ci
      - run: pnpm vitest run --coverage
      - uses: actions/upload-artifact@v4
        with:
          name: coverage
          path: coverage/

  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - run: pnpm ci
      - run: pnpm playwright install --with-deps chromium
      - run: pnpm playwright test --project=chromium
      - uses: actions/upload-artifact@v4
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### CI Recommendations

- Unit/integration tests — on every push and PR
- E2E — on every PR to main, can limit to Chromium only for speed
- Full cross-browser run (Chromium + Mobile Chrome + Mobile Safari) — before release
- Coverage threshold: 70% statements/lines/functions, 65% branches
- Cache `node_modules` and Playwright browsers for speed

---

## 11. Dependencies to Install

```bash
# Unit and integration tests
pnpm add -D vitest @testing-library/react @testing-library/jest-dom \
  @testing-library/user-event jsdom fake-indexeddb msw

# E2E
pnpm add -D @playwright/test
pnpm playwright install
```

---

## 12. Best Practices

- **Data factories** (`createTask`, `createGoal`, ...) — single source of test data, reused at all levels.
- **TestProviders** — wrapper with Router, Store, QueryClient for integration tests. Allows rendering components in realistic environment.
- **Tests co-located with code** — `.test.ts` files in same folder as tested module. Easier to find and maintain.
- **One assertion per scenario** — where possible, one test checks one behavior. Exception: E2E, where longer flows are acceptable.
- **Deterministic UUIDs** — mock `crypto.randomUUID()` in setup for predictable IDs.
- **Cleanup between tests** — `afterEach(cleanup)` for DOM, `db.table.clear()` for IndexedDB, `server.resetHandlers()` for MSW.
