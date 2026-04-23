# Internationalization (i18n) Guide

## Setup

- Library: `i18next` + `react-i18next`; initialized in `src/i18n.ts`, imported in `main.tsx`
- Languages: `ru` (default), `en`; files in `src/locales/ru.json` and `src/locales/en.json`
- Language state: `LanguageProvider` (Context) in `src/app/providers/LanguageProvider.tsx`
- Language switch: `useLanguage()` hook from `src/hooks/useLanguage.ts`
- Persistence: localStorage key `STORAGE_KEYS.LANGUAGE`

## Usage in components

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

## Key naming convention

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

## Adding new strings

1. Add the key to **both** `src/locales/ru.json` and `src/locales/en.json`
2. Use existing namespace if the string belongs to that domain; create a new namespace only if it's clearly a new domain
3. Never add a key to one file only — missing keys fall back to key name, not gracefully

## Testing with i18n

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
