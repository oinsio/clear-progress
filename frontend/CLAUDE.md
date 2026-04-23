# Clear Progress — Frontend

React PWA for GTD task and goal management. See root `CLAUDE.md` for data model, API protocol, and shared conventions.

## Quick Commands

```bash
npm run dev          # Vite dev server
npm run build        # Production build
npm run preview      # Preview production build
npm run test         # Vitest (unit + integration)
npm run test:e2e     # Playwright E2E tests
npm run lint         # ESLint + Prettier check
npm run lint:fix     # Auto-fix lint issues
npm run typecheck    # tsc --noEmit
```

## Tech Stack

- **UI**: React 18+ / TypeScript 5+ / Vite 6+ / Tailwind CSS 3.4+ / shadcn/ui / React Router 6+
- **i18n**: i18next 25+ / react-i18next / i18next-browser-languagedetector; languages: `ru`, `en`
- **Date/Time**: Temporal API via `temporal-polyfill` (single import point: `src/lib/temporal.ts`)
- **Offline DB**: Dexie.js 4+ (IndexedDB wrapper)
- **PWA**: vite-plugin-pwa (Workbox)
- **Auth**: @react-oauth/google
- **DnD**: @dnd-kit/core + @dnd-kit/sortable
- **Hosting**: Cloudflare Pages
- **Testing**: Vitest + React Testing Library + MSW + fake-indexeddb / Playwright (E2E) / Stryker (mutation)

## Project Structure

```
src/
├── app/              # App-level providers and config
├── components/       # Reusable React components
│   ├── ui/           # shadcn/ui primitives + custom UI components
│   ├── tasks/        # Task-related components
│   ├── goals/        # Goal-related components
│   ├── ideas/        # Idea-related components
│   ├── settings/     # Settings components
│   ├── pwa/          # PWA components (UpdateNotification)
│   └── layout/       # Shell, sidebar, navigation
├── pages/            # Route-level page components
├── features/         # Feature-specific modules (categories, contexts, checklist, etc.)
├── hooks/            # Custom React hooks (useXxx.ts)
├── services/         # Business logic & data layer
│   ├── ApiClient.ts  # GAS API client
│   ├── SyncService.ts # Sync engine (pull/push)
│   ├── connectionService.ts  # connect/disconnect/getConnectionConfig
│   └── *Service.ts   # Entity services (TaskService, GoalService, etc.)
├── db/               # Database layer (Dexie schema, instance, repositories incl. SyncMetaRepository)
├── types/            # TypeScript types & interfaces (incl. SyncMeta)
├── utils/            # Pure utility functions
├── constants/        # App-wide constants & enums (incl. SYNC_META_KEYS)
├── shared/           # Shared utilities, components, hooks
├── lib/              # Library wrappers (temporal.ts)
├── locales/          # Translation files (ru.json, en.json, house.json)
├── i18n.ts           # i18next initialization (import in main.tsx)
├── styles/           # Global styles
├── assets/           # Static assets
└── test/             # Test utilities and setup
```

## React Patterns

- Functional components only, no classes
- State management: React Context + useReducer for global state, useState for local
- Side effects: custom hooks, not raw useEffect in components
- UI: Tailwind + shadcn/ui, do not write custom CSS without strong reason
- Memoize with `useMemo`/`useCallback` only when there's a measured perf issue
- Imports: absolute paths via `@/` alias → `src/`
- CSS classes: Tailwind utilities only

### Description fields with clickable links

Use `EditableDescription` for all description fields (tasks, goals, ideas):
- View mode: displays text with clickable shortened URLs via `LinkedText`
- Edit mode: full textarea with complete URLs
- Click on text (not link) switches to edit mode
- Blur saves and returns to view mode

```tsx
<EditableDescription
  value={description}
  onChange={setDescription}
  onBlur={handleSave}
  placeholder={t("task.descriptionPlaceholder")}
  data-test-id="task-description"
/>
```

### URL handling in descriptions

- URL detection: `/(https?:\/\/[^\s<>"'\]]+)/g`
- Trailing punctuation (`,`, `.`, `)`, etc.) is stripped from URLs
- Links open in new tab with `target="_blank"` and `rel="noopener noreferrer"`
- Shortened display format: `domain/first/…/last` (query params hidden)
- Full URL shown in tooltip on hover

### Error Handling

- API calls: always try/catch, surface errors to user via toast/notification
- Sync errors: queue for retry, never lose local data
- Dexie operations: wrap in try/catch, log errors

## Backend Connection Architecture

Connection state is managed via a single `ConnectionConfig` object in localStorage (`STORAGE_KEYS.CONNECTION_CONFIG`), not separate keys.

- **Types**: `src/types/connection.ts` — `ConnectionConfig` discriminated union (currently only `GasConnectionConfig`)
- **Service**: `src/services/connectionService.ts` — `connect()`, `disconnect()`, `getConnectionConfig()`, `getBackendType()`
- **Hook**: `src/hooks/useConnectionConfig.ts` — reactive hook returning `ConnectionConfig | null`
- **Status**: `src/hooks/useConnectionStatus.ts` — derives connection status from config + auth + sync state

See `.claude/docs/architecture/connection-config.md` for full architecture details.

## Temporal API Usage

All date and time operations use Temporal API via `temporal-polyfill`. See `.claude/docs/temporal-guide.md` for detailed patterns.

**Critical rules:**
- NEVER use `new Date()` in production code
- NEVER use `Date.now()` — use `Temporal.Now.instant().epochMilliseconds` instead
- Always import `Temporal` from `@/lib/temporal`, never from `temporal-polyfill` directly
- Timestamps: `Temporal.Now.instant().toString()` → ISO 8601 with Z suffix
- Date-only: `Temporal.PlainDate` and `.toString()` → `"2025-01-15"`

## Internationalization (i18n)

### Setup
- Library: `i18next` + `react-i18next`; initialized in `src/i18n.ts`, imported in `main.tsx`
- Languages: `ru` (default), `en`; files in `src/locales/ru.json` and `src/locales/en.json`
- Language state: `LanguageProvider` (Context) in `src/app/providers/LanguageProvider.tsx`
- Language switch: `useLanguage()` hook from `src/hooks/useLanguage.ts`
- Persistence: localStorage key `STORAGE_KEYS.LANGUAGE`

### Usage in components

```tsx
// ✅ Always: use the t() function
import { useTranslation } from "react-i18next";

function MyComponent() {
  const { t } = useTranslation();
  return <button>{t("goal.create")}</button>;
}

// ✅ With interpolation
t("task.addPlaceholder", { box: t("box.today") })

// ❌ Never: hardcoded strings in JSX or logic
return <button>Create</button>;
```

### Key naming convention

Structure: `domain.specificKey` — flat two-level namespacing.

| Namespace      | Content                                                |
|----------------|--------------------------------------------------------|
| `nav.*`        | Bottom navigation labels                               |
| `box.*`        | Box names (inbox, today, week, later)                  |
| `task.*`       | Task strings (placeholders, aria-labels, empty states) |
| `section.*`    | Section headers in task lists                          |
| `goal.*`       | Goal form and status labels                            |
| `idea.*`       | Idea-related strings                                   |
| `context.*`    | Context management strings                             |
| `category.*`   | Category management strings                            |
| `search.*`     | Search page                                            |
| `filter.*`     | Filter panel                                           |
| `settings.*`   | Settings page                                          |
| `setup.*`      | Backend connection setup flow                          |
| `selector.*`   | Goal/Context/Category dropdowns                        |
| `taskEdit.*`   | Task edit modal                                        |
| `taskDetail.*` | Task detail panel                                      |
| `repeat.*`     | Recurring task strings                                 |
| `sync.*`       | Sync-related strings                                   |
| `auth.*`       | Authentication and sign-in                             |
| `deleted.*`    | Deleted records page                                   |
| `error.*`      | Global error page                                      |
| `pwa.*`        | PWA update notifications                               |
| `theme.*`      | Theme selection (system/light/dark)                    |
| `color.*`      | Color name translations                                |

### Adding new strings

1. Add the key to **both** `src/locales/ru.json` and `src/locales/en.json`
2. Use existing namespace if the string belongs to that domain; create a new namespace only if it's clearly a new domain
3. Never add a key to one file only — missing keys fall back to key name, not gracefully

### Testing with i18n

**Pattern A: Real translations** (test the actual rendered text)
```tsx
it("should render inbox link", () => {
  render(<BottomNav />);
  expect(screen.getByRole("link", { name: /inbox/i })).toBeInTheDocument();
});
```

**Pattern B: Mock translations** (test component logic, not translation content)
```tsx
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
```

Use Pattern A for navigation/layout. Use Pattern B for logic-heavy components.

## Testing

- Use `fake-indexeddb` for Dexie operations
- Use MSW for API mocking — do not mock fetch directly
- Test business logic in services independently of components
- **Integration tests**: mock only network layer (MSW), use real Dexie with fake-indexeddb
- **E2E (Playwright)**: Chromium + Mobile Chrome + Mobile Safari; use `data-test-id` selectors
- **Mutation testing**: `npm run test:mutation` — target ≥95% score

## Important Reminders

- Mobile-first PWA — always consider touch interactions and small screens
- Performance: keep bundle small, lazy-load routes, avoid unnecessary re-renders
- Native feel: smooth animations, instant feedback, no loading spinners for local data
- Accessibility: semantic HTML, ARIA labels, keyboard navigation support
- NEVER hardcode user-facing strings — always use `t("namespace.key")`

## Post-Edit Workflow

After creating or editing any source file (.ts, .tsx, .json, .js):
1. Call `getDiagnostics` via the webstorm MCP tool for the changed file
2. If there are errors or warnings — fix them immediately before moving on
3. Do NOT ask for confirmation to fix IDE diagnostics — just fix them
4. After all changes and diagnostics are resolved, run `npm run build` to verify the build is not broken