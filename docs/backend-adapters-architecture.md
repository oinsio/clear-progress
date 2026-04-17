# Backend Adapters — план рефакторинга

## Принцип

Offline-first: IndexedDB (Dexie) — единственный источник данных для UI. Бэкенд — удалённое хранилище, с которым приложение синхронизируется при наличии сети. UI никогда не ждёт ответа сервера для отображения данных.

## Текущее состояние

Синхронизация уже работает по схеме pull/push, но без явной абстракции:

| Что нужно | Что сейчас в коде |
|-----------|-------------------|
| `BackendAdapter.ping/init` | `ApiClient.ping()` / `ApiClient.init()` |
| `BackendAdapter.pull/push` | `ApiClient.pull()` / `ApiClient.push()` |
| `BackendAdapter.uploadCover/deleteCover` | `ApiClient.uploadCover()` / `ApiClient.deleteCover()` |
| Sync Engine | `SyncService` + флаг `needsSync` в репозиториях |
| Конфликты (last-write-wins по `updated_at`) | `push.ts` на бэкенде |

Всё работает, но `SyncService` напрямую зависит от `ApiClient` — нельзя подставить другой бэкенд без переписывания.

## BackendAdapter Interface

Единый интерфейс, через который Sync Engine взаимодействует с любым бэкендом. Адаптер сам решает, как эффективнее выполнить операцию.

```typescript
interface BackendAdapter {
  ping(): Promise<PingResult>;
  init(): Promise<void>;
  pull(versions: EntityVersionMap): Promise<PullResult>;
  push(changes: ChangeSet): Promise<PushResult>;
  uploadCover(data: CoverUploadData): Promise<CoverResult>;
  deleteCover(id: string): Promise<void>;
}
```

## Адаптеры

| Адаптер | Бэкенд | Примечание |
|---------|--------|------------|
| `GASAdapter` | Google Apps Script + Sheets | Текущий `ApiClient`, переименованный |
| `LocalOnlyAdapter` | Только IndexedDB | Демо-режим, разработка, E2E-тесты |
| `SupabaseAdapter` | Supabase (PostgreSQL) | На будущее, по потребности |

## Что даёт рефакторинг

1. **Демо-режим** — `LocalOnlyAdapter` позволяет пользоваться приложением без Google-аккаунта (no-op для pull/push).
2. **Тестируемость** — `SyncService` получает адаптер через аргумент/DI, мокать через `vi.mock()` больше не нужно.
3. **Изоляция миграции** — если GAS перестанет устраивать (лимиты, скорость), переход на Supabase затронет только один модуль.

## План реализации

### Этап 1 — извлечение интерфейса

Механический рефакторинг без изменения поведения:

1. Создать `BackendAdapter` интерфейс в `frontend/src/types/`
2. Переименовать `ApiClient` → `GASAdapter`, имплементировать интерфейс
3. `SyncService` принимает `BackendAdapter` вместо прямого импорта `ApiClient`

### Этап 2 — LocalOnlyAdapter

1. Написать `LocalOnlyAdapter` — no-op реализация (ping → ok, push/pull → пустые результаты)
2. Добавить выбор адаптера в настройках (или автоматически при отсутствии GAS URL)
3. Использовать в E2E-тестах вместо MSW-моков

### Этап 3 — SupabaseAdapter (по потребности)

Реализуется когда появится реальная необходимость в смене бэкенда.
