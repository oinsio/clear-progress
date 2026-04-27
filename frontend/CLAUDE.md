# Clear Progress — Frontend

React PWA for GTD. See root `CLAUDE.md` for data model, API protocol, and shared conventions.
**@docs/frontend-project-structure.md**

## Gotchas

- **Temporal API only** — NEVER use `new Date()` or `Date.now()` in production code. Always import `Temporal` from `@/lib/temporal`, never from `temporal-polyfill` directly. See @.claude/docs/temporal-guide.md
- **Tailwind only** — do not write custom CSS without strong reason
- **Mobile-first PWA** — always consider touch interactions and small screens
- **`@/` import alias** maps to `src/`

## i18n

- All user-facing strings via `t("namespace.key")` — NEVER hardcode strings in JSX
- Add keys to **both** `src/locales/ru.json` and `src/locales/en.json` — missing keys fall back to key name, not gracefully
- Languages: `ru` (default), `en`
- Full guide: @.claude/docs/i18n-guide.md

## Testing

- Use `fake-indexeddb` for Dexie operations — do not mock IndexedDB manually
- Use MSW for API mocking — do not mock fetch directly
- E2E (Playwright): use `data-test-id` selectors
- UI components: @.claude/docs/ui-components.md

## Post-Edit Workflow

After editing source files:
1. Call `getDiagnostics` via JetBrains MCP for changed files — fix errors immediately without asking
2. Run `pnpm run build` to verify the build is not broken
