# Архитектура подключения: ConnectionConfig

## Проблема

Раньше подключение к бэкенду хранилось в нескольких разрозненных ключах localStorage (`GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED`). Это приводило к:

- Рассинхронизации ключей (ghost config после отключения)
- Двум кнопкам "Отключить" с разным поведением (SetupPage vs SettingsPage)
- Тупику `not_initialized` без Client ID (нет кнопки "Назад")
- SetupPage показывает "connected" после отключения (проверка `GAS_URL` вместо `BACKEND_CONNECTED`)

## Решение: единый объект `ConnectionConfig`

Один сериализованный объект в localStorage вместо россыпи ключей:

```ts
// src/types/connection.ts
type GasConnectionConfig = {
  type: "gas";
  url: string;
  clientId?: string;
  isActive: boolean;  // true = подключено, false = отключено (но сохранено)
};

type ConnectionConfig = GasConnectionConfig;
// В будущем: | SupabaseConnectionConfig | CustomConnectionConfig
```

**Единый ключ:** `STORAGE_KEYS.CONNECTION_CONFIG` → `JSON.stringify(ConnectionConfig)` или отсутствует.

### Поле `isActive`

Добавлено обязательное поле `isActive: boolean`:
- `true` — активное подключение (пользователь подключён)
- `false` — неактивное подключение (пользователь отключился, но URL и clientId сохранены для повторного подключения)

При отключении (`disconnect()`) конфиг не удаляется, а обновляется с `isActive: false`. Это позволяет предзаполнять поля на SetupPage при повторном подключении к тому же серверу.

### Преимущества

- Одно место → невозможно рассинхронизировать ключи
- `type` дискриминант → SetupPage/SyncProvider/ApiClient знают, какой бэкенд
- Добавление нового бэкенда = новый тип в union + новая секция на SetupPage
- `disconnect()` = один `removeItem` вместо пяти

## Ключевые компоненты

### `connectionService.ts` — единая точка управления

- `connect(config)` — сохраняет config с `isActive: true`, диспатчит события
- `disconnect()` — обновляет config с `isActive: false` (не удаляет), удаляет auth/sync ключи, диспатчит события
- `getConnectionConfig()` — читает и парсит из localStorage, возвращает `null` для неактивных конфигов (`isActive: false`)
- `getSavedConnectionConfig()` — читает конфиг независимо от `isActive` (для предзаполнения полей на SetupPage)
- `getBackendType()` — шорткат для `config?.type`

### `useConnectionConfig` хук

- Реактивный хук, слушает `BACKEND_CONNECTION_EVENT` и storage events
- Возвращает `ConnectionConfig | null`
- Заменяет `useBackendConnected` (который становится обёрткой: `useConnectionConfig() !== null`)

### `useConnectionStatus` — адаптирован

Использует `useConnectionConfig()` вместо отдельных проверок:
- `!config` → `"not_configured"`
- GAS + clientId + no token → `"no_auth"`
- Далее маппинг на sync-статусы

## Миграция localStorage

Одноразовая миграция при старте приложения (`migrateLegacyConnection.ts`):
- Читает старые ключи (`gas_url`, `google_client_id`, `backend_connected`)
- Формирует `ConnectionConfig` с `isActive: true` и сохраняет в новый ключ
- Удаляет старые ключи
- Если конфиг уже в новом формате, но без `isActive` — добавляет `isActive: true` (миграция для пользователей, обновившихся до промежуточной версии)

## Удалённые ключи localStorage

| Старый ключ | Замена |
|---|---|
| `GAS_URL` | `CONNECTION_CONFIG.url` |
| `GOOGLE_CLIENT_ID` | `CONNECTION_CONFIG.clientId` |
| `BACKEND_CONNECTED` | наличие `CONNECTION_CONFIG` |

## Добавление нового бэкенда

1. Добавить новый тип в union `ConnectionConfig` (например `SupabaseConnectionConfig`)
2. Добавить форму подключения на SetupPage
3. Добавить sync-стратегию в SyncProvider (`switch` по `config.type`)
4. Добавить API-клиент или адаптер

Никаких изменений в `connectionService`, `useConnectionConfig`, `useConnectionStatus`, disconnect-флоу.

---

*Полный план реализации: [connection-flow-plan.md](../../../connection-flow-plan.md)*
