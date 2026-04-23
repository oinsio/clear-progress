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

## Pluralization

i18next selects the key suffix based on the `count` value according to language rules ([CLDR plural rules](https://www.unicode.org/cldr/charts/45/supplemental/language_plural_rules.html)).

**Suffixes by language:**

| Suffix   | Russian (count examples) | English (count examples) |
|----------|--------------------------|--------------------------|
| `_one`   | 1, 21, 31, 101…          | 1                        |
| `_few`   | 2–4, 22–24, 32–34…       | —                        |
| `_many`  | 5–20, 25–30, 100…        | —                        |
| `_other` | fractional (1.5, 2.3…)   | 0, 2, 3, 4, 5…           |

**Keys in JSON:**

```jsonc
// ru.json
"afterCompletion_one": "Через {{count}} день после завершения",
"afterCompletion_few": "Через {{count}} дня после завершения",
"afterCompletion_many": "Через {{count}} дней после завершения"

// en.json — only _one and _other are needed
"afterCompletion_one": "{{count}} day after completion",
"afterCompletion_other": "{{count}} days after completion"
```

**Usage:**

```tsx
t("repeat.afterCompletion", { count: 3 })
// ru → "Через 3 дня после завершения"
// en → "3 days after completion"
```

## Ordinal (ordinal numbers)

For ordinal numbers (1st, 2nd / 1-е, 2-е) pass `ordinal: true` along with `count`. i18next uses `_ordinal_*` suffixes.

**Suffixes by language:**

| Suffix           | Russian            | English             |
|------------------|--------------------|---------------------|
| `_ordinal_one`   | —                  | 1, 21, 31… → "st"   |
| `_ordinal_two`   | —                  | 2, 22, 32… → "nd"   |
| `_ordinal_few`   | —                  | 3, 23, 33… → "rd"   |
| `_ordinal_other` | all numbers → "-е" | 4–20, 24–30… → "th" |

**Keys in JSON:**

```jsonc
// ru.json — single form for all numbers
"dayOfMonthLabel_ordinal_other": "Каждое {{count}}-е число месяца"

// en.json — four forms
"dayOfMonthLabel_ordinal_one": "Day {{count}}st of every month",
"dayOfMonthLabel_ordinal_two": "Day {{count}}nd of every month",
"dayOfMonthLabel_ordinal_few": "Day {{count}}rd of every month",
"dayOfMonthLabel_ordinal_other": "Day {{count}}th of every month"
```

**Usage:**

```tsx
t("repeat.dayOfMonthLabel", { count: 3, ordinal: true })
// ru → "Каждое 3-е число месяца"
// en → "Day 3rd of every month"

t("repeat.dayOfMonthLabel", { count: 15, ordinal: true })
// ru → "Каждое 15-е число месяца"
// en → "Day 15th of every month"
```

**Where it's used:**
- `RepeatRuleSelector.tsx` — monthly/yearly selector labels
- `utils/repeatRule.ts` → `formatRepeatRuleLabel()` — yearly rule text description
- `shared/lib/utils.ts` → `formatAppearDate()` — appear date formatting

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
