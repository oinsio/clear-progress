# Оптимизация синхронизации — проверка изменений перед установкой needsSync

## Что изменилось

Добавлена проверка реальных изменений данных перед пометкой записи как `needsSync`. Теперь запись помечается для синхронизации только если её поля действительно изменились.

## Реализованные изменения

### 1. Новая утилита `hasEntityChanged`

**Файл:** `frontend/src/utils/deepEqual.ts`

Функция сравнивает два объекта и определяет, изменились ли значимые поля:
- Игнорирует служебные поля: `id`, `version`, `updated_at`, `created_at`, `needsSync`, `revision`
- Нормализует пустые значения: `""`, `undefined` и `null` считаются одинаковыми
- Возвращает `true`, если хотя бы одно поле изменилось

### 2. Обновлённые сервисы

Все методы `update()` и `reorder*()` в следующих сервисах:

- **TaskService** — `update()`, `reorderTasks()`
- **GoalService** — `update()`, `reorderGoals()`
- **IdeaService** — `update()`, `reorderIdeas()`
- **ChecklistService** — `applyChanges()`, `reorderItems()`
- **ContextService** — `applyChanges()`, `reorderContexts()`
- **CategoryService** — `applyChanges()`, `reorderCategories()`

**Логика:**
- Если данные не изменились: `needsSync = false`, `version` и `updated_at` остаются прежними
- Если данные изменились: `needsSync = true`, `version` инкрементируется, `updated_at` обновляется

### 3. Оптимизация reorder методов

Методы `reorder*()` теперь:
1. Проверяют, изменился ли хотя бы один `sort_order`
2. Если все `sort_order` остались прежними — выходят без изменений
3. Помечают как `needsSync` только те записи, у которых `sort_order` действительно изменился

### 4. SettingsRepository

**Файл:** `frontend/src/db/repositories/SettingsRepository.ts`

Метод `set()` теперь:
- Проверяет существующее значение
- Если значение не изменилось — не вызывает `put()`, просто возвращается

## Особые случаи

### Complete/Noncomplete
Методы `TaskService.complete()` и `TaskService.noncomplete()` всегда помечают запись как `needsSync`, т.к. это явное изменение состояния задачи.

### Нормализация пустых значений
Переход `"" ↔ undefined ↔ null` не считается изменением, т.к. в проекте используются пустые строки для необязательных полей.

## Тесты

Добавлены unit-тесты для `hasEntityChanged`:
- **Файл:** `frontend/src/utils/deepEqual.test.ts`
- **Покрытие:** 14 тестов
- Проверяют обнаружение изменений, нормализацию пустых значений, работу с разными типами данных

Все существующие тесты (1279 тестов) проходят успешно.

## Ожидаемый эффект

- Уменьшение количества запросов на бэкенд на 30-50%
- Более быстрая работа при частом открытии/закрытии форм редактирования без изменений
- Меньшая нагрузка на Google Apps Script backend
- Экономия квоты API Google Sheets

## Примеры использования

### До изменений
```typescript
// Пользователь открыл задачу, ничего не изменил, закрыл
await taskService.update(taskId, {});
// ❌ Запись помечается needsSync, отправляется на сервер
```

### После изменений
```typescript
// Пользователь открыл задачу, ничего не изменил, закрыл
await taskService.update(taskId, {});
// ✅ Запись НЕ помечается needsSync, запрос на сервер не отправляется
```

### Reorder без изменений
```typescript
// Пользователь перетащил элемент, но он остался на том же месте
await taskService.reorderTasks([task1, task2, task3]);
// ✅ Если sort_order не изменился — выход без изменений
```

---

## Оптимизация синхронизации Settings

### Проблема

При каждом `pull` сервер возвращал **все** настройки (`getAllSettings()`), даже если ничего не изменилось. Остальные сущности (tasks, goals и т.д.) фильтруются по `since_revision`, а settings — нет.

### Решение

Клиент отправляет в pull-запросе параметр `settings_updated_at` — максимальный `updated_at` среди настроек, полученных ранее с сервера. Сервер возвращает только те settings, у которых `updated_at > settings_updated_at`.

### Реализация

#### Бэкенд

**Файл:** `backend/src/sheets/settings.sheet.ts`

Добавлена функция `getSettingsChangedSince(since: string)`, которая фильтрует настройки по дате обновления.

**Файл:** `backend/src/actions/pull.ts`

Pull action теперь принимает опциональный параметр `settings_updated_at` и использует его для фильтрации:
```typescript
settings: settings_updated_at
  ? getSettingsChangedSince(settings_updated_at)
  : getAllSettings()
```

#### Фронтенд

**Файл:** `frontend/src/services/SyncService.ts`

Метод `_pull()`:
1. Читает `settings_updated_at` из localStorage перед pull
2. Передаёт параметр в `apiClient.pull()`
3. После получения settings обновляет `settings_updated_at` до максимального `updated_at`

Метод `resetAndPull()`:
- Сбрасывает `settings_updated_at` из localStorage для полного pull settings

**Место хранения:** `localStorage` с ключом `STORAGE_KEYS.SETTINGS_UPDATED_AT`

### Обратная совместимость

- Если клиент **не отправляет** `settings_updated_at` → сервер возвращает все settings (текущее поведение)
- Старые клиенты продолжают работать без изменений
- Новые клиенты начинают экономить трафик сразу после первого pull

### Ожидаемый эффект

- Уменьшение размера pull-ответа на 1-2 KB при отсутствии изменений в settings
- Экономия трафика при частых pull-запросах (каждые 5 минут)
- Меньшая нагрузка на Google Sheets API
