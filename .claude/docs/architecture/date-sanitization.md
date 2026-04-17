# Санитизация дат: Google Sheets → Temporal API

## Проблема

Google Sheets `getValues()` возвращает `Date` объекты для ячеек с датами. При наивном преобразовании:

- `String(date)` → `"Sun Apr 19 2026 19:00:00 GMT+0000 (...)"` — **не парсится** Temporal API
- `date.toISOString()` → `"2026-04-19T19:00:00.000Z"` — это **timestamp**, а не date-only

Для полей `next_date` и `appear_date` требуется формат **`YYYY-MM-DD`** (date-only), а не ISO timestamp.

## Решение: два уровня защиты

### 1. Бэкенд: `toISODateValue()` (первичная конвертация)

Файл: `backend/src/helpers/constants.ts`

Для date-only полей (`next_date`, `appear_date`) используется `toISODateValue()` вместо `toISOStringValue()`:

```ts
// toISOStringValue — для timestamp-полей (created_at, updated_at, completed_at)
// toISODateValue  — для date-only полей (next_date, appear_date)
```

`toISODateValue` обрабатывает:
- `Date` объект → `date.toISOString().substring(0, 10)` → `"2026-04-19"`
- ISO date строка → as-is
- ISO timestamp строка → извлекает `YYYY-MM-DD`
- `Date.toString()` формат → парсит через `new Date()`, извлекает дату

### 2. Фронтенд: `sanitizeDateOnly()` (защитный слой)

Файл: `frontend/src/utils/dateHelpers.ts`

Санитизация на фронтенде — это защита от испорченных данных, которые могли попасть в IndexedDB до деплоя бэкенд-фикса. Применяется в:

| Место | Файл | Зачем |
|-------|------|-------|
| `applyServerRecords()` | `TaskRepository.ts` | Санитизация при записи pull-данных в IndexedDB |
| `getTasksToReveal()` | `TaskRepository.ts` | Защита при чтении `appear_date` из IndexedDB |
| `formatAppearDate()` | `shared/lib/utils.ts` | Защита при рендере даты появления |
| `calculateNextDate()` | `utils/repeatRule.ts` | Защита при расчёте следующей даты повторения |
| `calculateAppearDate()` | `utils/repeatRule.ts` | Защита при расчёте даты появления |

## Правило

- **Timestamp-поля** (`created_at`, `updated_at`, `completed_at`): бэкенд использует `toISOStringValue()`, формат `YYYY-MM-DDTHH:mm:ss.sssZ`
- **Date-only поля** (`next_date`, `appear_date`): бэкенд использует `toISODateValue()`, формат `YYYY-MM-DD`
- **Фронтенд**: любое чтение date-only поля из IndexedDB для передачи в `Temporal.PlainDate.from()` должно проходить через `sanitizeDateOnly()`
