# Clear Progress — Frontend

Root `CLAUDE.md` has data model, API protocol, shared conventions.

## Gotchas

- **Temporal API only** — NEVER use `new Date()` or `Date.now()` in production code. Always import from `@/lib/temporal`, never `temporal-polyfill` directly. See @.claude/docs/temporal-guide.md
- **Tailwind only** — no custom CSS without strong reason
- **Mobile-first PWA** — always consider touch interactions and small screens
- **`@/` import alias** maps to `src/`

## i18n

- All user-facing strings via `t("namespace.key")` — NEVER hardcode in JSX. Add keys to **both** `src/locales/ru.json` and `src/locales/en.json`. See @.claude/docs/i18n-guide.md

## Testing

- Use `fake-indexeddb` for Dexie — do not mock IndexedDB manually
- Use MSW for API mocking — do not mock fetch directly
