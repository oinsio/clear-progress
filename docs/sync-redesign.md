# Sync Redesign: Server-side Revision

## Проблема

Текущая схема синхронизации сломана при нескольких устройствах. `version` назначается клиентом независимо, `pull` использует `getMaxVersion()` из локальной IndexedDB. Устройство с высоким локальным max version не получает записи с низким version, созданные на другом устройстве.

## Решение: разделение `version` и `revision`

Два независимых поля:

- **`version`** (клиентский) — инкрементируется клиентом при каждом локальном изменении. Используется для определения "менялась ли запись" и для conflict detection (сравнение `updated_at` при push). Не участвует в pull-фильтрации.
- **`revision`** (серверный) — глобальный монотонный счётчик. Назначается **только сервером**: один revision на весь push-запрос (все принятые записи в одном push получают одинаковый revision). Клиент при pull отправляет `since_revision` — одно число. Сервер возвращает все записи с `revision > since_revision`. Revision должен быть монотонным между push-запросами, но не обязан быть уникальным между записями внутри одного запроса.
- **`needsSync`** (клиентский, только IndexedDB) — boolean-флаг, отмечающий записи, изменённые локально и ещё не подтверждённые сервером. Не передаётся на сервер.

---

## Изменения в структуре данных

### Google Sheets

#### Новый столбец `revision` (integer) во всех листах сущностей

Добавить столбец `revision` в: Tasks, Goals, Contexts, Categories, Checklist_Items, Settings.

Значение по умолчанию для существующих записей: `0`.

#### Новый лист `Meta`

Структура — две колонки:

| key | value |
|-----|-------|
| next_revision | 1 |

Один глобальный счётчик на все сущности. Простота и гарантия монотонности.

Лист создаётся в action `init` (идемпотентно — если существует, не пересоздавать).

### IndexedDB (Dexie)

#### Новые поля в каждой таблице сущностей

- `revision` (number) — серверный revision. `0` означает "запись ещё не была на сервере".
- `needsSync` (boolean) — `true` = запись изменена локально и ожидает push.

#### Новая таблица `sync_meta`

```typescript
interface SyncMeta {
  key: string;
  value: number;
}
```

Ключ `last_known_revision` хранит максимальный revision, полученный от сервера. Значение по умолчанию: `0` (= "дай всё" при первом pull).

#### Dexie schema migration

Bump `DB_VERSION`. В upgrade-функции:

1. Добавить `revision` и `needsSync` в индексы всех таблиц сущностей.
2. Пройти по всем существующим записям: проставить `needsSync = true`, `revision = 0`.
3. Создать таблицу `sync_meta`.

Это критически важно: без миграции существующие записи не будут ни пушиться (нет `needsSync`), ни корректно обрабатываться при pull (нет `revision`).

---

## Изменения Backend API

### Action `init`

Добавить создание листа `Meta` с начальным значением `next_revision = 1`. Идемпотентно — если лист уже существует, не трогать.

Добавить столбец `revision` в структуру всех листов сущностей (в заголовки).

### Action `push`

Ключевые изменения:

1. **Захватить `LockService.getScriptLock()`** в начале обработки push. Это гарантирует атомарность чтения/записи `next_revision` при одновременных запросах с разных устройств. Использовать `tryLock(30000)` (30 секунд таймаут). Если lock не получен — вернуть ошибку, клиент повторит.

2. **Прочитать `next_revision`** из листа Meta.

3. **Назначить `pushRevision = next_revision`** — одно значение для всего запроса.

4. **Обработать все записи.** Для каждой принятой (status = `created` или `accepted`):
    - Назначить `revision = pushRevision` (одинаковый для всех записей в этом push).
    - Записать в Sheets с этим revision.
    - Клиентское поле `version` сохраняется as-is (без изменений).

5. **Если хотя бы одна запись принята** → сохранить `next_revision = pushRevision + 1` в Meta. Если все записи отклонены (conflict) — не инкрементировать.

6. **Освободить lock.**

7. **В ответе** вернуть `revision` (единый для всего push) для записей с status `created`/`accepted`.

#### Push Response формат

```typescript
interface PushResponseItem {
  id: string;
  status: 'created' | 'accepted' | 'conflict';
  server_record?: EntityRecord; // присутствует только для conflict
}

interface PushResponse {
  revision: number; // единый revision, назначенный этому push (отсутствует, если все записи conflict)
  results: {
    tasks?: PushResponseItem[];
    goals?: PushResponseItem[];
    contexts?: PushResponseItem[];
    categories?: PushResponseItem[];
    checklist_items?: PushResponseItem[];
    settings?: PushResponseItem[];
  };
  server_time: string; // ISO 8601 UTC
}
```

`revision` — одно число на уровне ответа, а не в каждом PushResponseItem. Все принятые записи получают этот revision. Conflict-записи revision не получают.

#### Conflict resolution

Без изменений: last-write-wins по `updated_at`. Если `record.updated_at > serverRecord.updated_at` — accepted, иначе — conflict с возвратом `server_record`.

### Action `pull`

#### Новый формат запроса

```typescript
interface PullRequest {
  action: 'pull';
  since_revision: number; // одно число вместо объекта versions
}
```

Заменяет текущий формат `versions: { tasks: N, goals: M, ... }`.

#### Логика фильтрации

Для каждого листа сущностей: вернуть все записи, где `revision > since_revision`.

#### Формат ответа

```typescript
interface PullResponse {
  tasks: TaskRecord[];
  goals: GoalRecord[];
  contexts: ContextRecord[];
  categories: CategoryRecord[];
  checklist_items: ChecklistItemRecord[];
  settings: SettingRecord[];
  current_revision: number; // = next_revision - 1 из Meta
  server_time: string;      // ISO 8601 UTC
}
```

### Action `ping`

Без изменений.

### Actions `upload_cover`, `delete_cover`

Без изменений.

---

## Изменения Frontend

### SyncService

#### Pull

```
1. Прочитать last_known_revision из sync_meta (default: 0)
2. Прочитать settings_updated_at из localStorage (optional)
3. Отправить pull({ action: 'pull', since_revision, settings_updated_at })
4. Применить результаты (applyPullResults — описано ниже)
5. Если получены settings: обновить settings_updated_at = max(setting.updated_at)
6. Сохранить response.current_revision в sync_meta.last_known_revision
```

**Settings оптимизация**: Settings не участвуют в revision-механизме. Вместо этого используется фильтрация по `updated_at`. Клиент отправляет `settings_updated_at` (максимальный `updated_at` среди полученных ранее settings), сервер возвращает только settings с `updated_at > settings_updated_at`. Это экономит трафик, т.к. settings меняются редко.

#### Push

```
1. Собрать все записи с needsSync === true из всех таблиц
2. Если пусто — выход
3. Запомнить version каждой отправляемой записи (sentVersions map: id → version)
4. Отправить push({ action: 'push', changes })
5. Применить результаты (applyPushResults — описано ниже)
6. Обновить last_known_revision: если response.revision > текущего — записать response.revision
```

#### Мьютекс sync-операций

Pull и push не должны выполняться параллельно. Реализовать простой мьютекс (promise-based lock) в SyncService. Если pull уже идёт — push ждёт окончания, и наоборот. Это предотвращает гонки при записи в IndexedDB.

```typescript
class SyncService {
  private syncMutex: Promise<void> = Promise.resolve();

  private async withLock<T>(fn: () => Promise<T>): Promise<T> {
    let release: () => void;
    const prev = this.syncMutex;
    this.syncMutex = new Promise(resolve => { release = resolve; });
    await prev;
    try {
      return await fn();
    } finally {
      release!();
    }
  }

  async pull(): Promise<void> {
    return this.withLock(() => this._pull());
  }

  async push(): Promise<void> {
    return this.withLock(() => this._push());
  }
}
```

#### applyPullResults

Для каждой записи из ответа pull:

```
1. Найти локальную запись по id
2. Если нет локальной записи → put с needsSync = false
3. Если есть и needsSync === false → перезаписать серверной версией, needsSync = false
4. Если есть и needsSync === true → ПРОПУСТИТЬ (локальная версия уйдёт при push)
```

#### applyPushResults

Для каждого элемента из ответа push:

```
pushRevision = response.revision (единый для всего push)

status === 'created' или 'accepted':
  1. Прочитать текущую запись из IndexedDB
  2. Сравнить текущий version с sentVersion (version на момент отправки push)
  3. Если version === sentVersion:
     → Запись не менялась пока шёл push
     → Обновить: needsSync = false, revision = pushRevision
  4. Если version > sentVersion:
     → Запись менялась во время push
     → Обновить: revision = pushRevision (но needsSync ОСТАВИТЬ true)
     → Запись уйдёт на сервер повторно при следующем push

status === 'conflict':
  1. Перезаписать локальную запись серверной (server_record)
  2. Установить needsSync = false
  3. Логировать конфликт для отладки
```

Сохранение `sentVersions` — map id → version, создаётся перед отправкой push, используется в applyPushResults. Это критически важно: без этого изменение записи во время push приведёт к потере данных (сценарий 10 из анализа уязвимостей).

#### Локальные операции (create/update/delete)

При любом изменении записи в IndexedDB:

```typescript
// Создание
await db.tasks.add({
  ...task,
  needsSync: true,
  revision: 0,
});

// Обновление
const existing = await db.tasks.get(id);
await db.tasks.update(id, {
  ...updates,
  version: existing.version + 1,
  updated_at: new Date().toISOString(),
  needsSync: true,
});

// Soft delete
const existing = await db.tasks.get(id);
await db.tasks.update(id, {
  is_deleted: true,
  version: existing.version + 1,
  updated_at: new Date().toISOString(),
  needsSync: true,
});
```

#### Full Sync

Остаётся как аварийный механизм. Реализация:

```
1. Установить sync_meta.last_known_revision = 0
2. Пометить все локальные записи needsSync = true
3. Выполнить обычный pull → push цикл
```

### Удалить устаревший код

- Удалить `getMaxVersion()` из всех репозиториев (TaskRepository, GoalRepository, и т.д.)
- Удалить `getLocalVersions()` из SyncService
- Удалить формирование объекта `versions: { tasks: N, ... }` при pull
- Удалить константу `FULL_SYNC_ZERO_VERSIONS` (заменена на `since_revision: 0`)

---

## Sync Flow (полный цикл)

### Первое подключение бэкенда

```
1. sync_meta не содержит last_known_revision → default 0
2. pull({ since_revision: 0 }) → сервер возвращает ВСЁ
3. Применяются записи с сервера
4. Все ранее созданные офлайн-записи имеют needsSync = true (из миграции)
5. push отправляет их → сервер назначает revision
6. Обновляем last_known_revision
```

### Нормальная работа (online)

```
1. Открытие приложения → pull
2. Пользователь работает → изменения в IndexedDB (needsSync = true)
3. Debounce 5–10с → push needsSync записей
4. Каждые 5 минут → pull
5. Закрытие/сворачивание → push оставшихся needsSync (если есть)
```

### Offline → Online

```
1. Offline: все изменения в IndexedDB, needsSync = true
2. navigator.onLine = true / fetch success
3. push всех needsSync записей
4. pull с last_known_revision
5. needsSync записи не перезаписываются pull (ждут свой push)
```

---

## Обязательные защиты (из анализа уязвимостей)

### 1. LockService в push (бэкенд)

**Угроза:** два одновременных push-запроса читают один и тот же `next_revision`, назначают одинаковый revision разным batch-ам записей. При pull клиент может пропустить один из batch-ей.

**Решение:** оборачивать всю логику push в `LockService.getScriptLock().tryLock(30000)`. GAS однопоточен, но Google не гарантирует строгую сериализацию. Lock это гарантирует.

```javascript
function processPush(payload) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(30000)) {
    return { ok: false, error: 'SYNC_LOCK_TIMEOUT' };
  }
  try {
    // ... вся логика push ...
  } finally {
    lock.releaseLock();
  }
}
```

### 2. Мьютекс pull/push в SyncService (фронтенд)

**Угроза:** параллельный pull и push пишут в IndexedDB одновременно, вызывая гонку при обновлении одной и той же записи.

**Решение:** promise-based lock в SyncService (код выше). Pull и push никогда не выполняются одновременно.

### 3. sentVersions при push (фронтенд)

**Угроза:** пользователь редактирует запись, пока push в полёте. applyPushResults ставит `needsSync = false`, изменение теряется.

**Решение:** перед отправкой push сохранять `Map<id, version>` для каждой записи. В applyPushResults сравнивать текущий version в IndexedDB с sentVersion. Если version вырос — не снимать needsSync.

### 4. Dexie schema migration (фронтенд)

**Угроза:** после обновления кода существующие записи не имеют `needsSync` и `revision`. Они не пушатся и некорректно обрабатываются при pull.

**Решение:** в Dexie upgrade-функции пройти по всем записям, проставить `needsSync = true`, `revision = 0`. Создать таблицу `sync_meta`.

---

## Допустимые для MVP ограничения

### Потеря ответа push (сценарий 2)

Если ответ push потерялся — записи остаются `needsSync = true`, повторно пушатся. Сервер назначит новые revision, старые "осиротеют". Данные не теряются. Лишние revision безвредны.

### Soft-delete + edit на разных устройствах (сценарий 5)

Устройство A удаляет, устройство B редактирует. Last-write-wins: если B позже — запись "воскреснет". Для персонального приложения это приемлемо. Не нужно усложнять логику правилом "delete всегда побеждает".

### Большой первый push (сценарий 7)

При первом подключении бэкенда после долгой офлайн-работы — push может содержать тысячи записей. GAS имеет лимит 6 минут на execution. Рекомендация: если количество needsSync записей > 200, разбивать push на chunk-и по 200 записей. Реализация: SyncService отправляет несколько последовательных push-запросов.

---

## Что НЕ меняется

- Conflict resolution: last-write-wins по `updated_at`
- Soft delete: `is_deleted = true`
- UUID генерация: `crypto.randomUUID()` на клиенте
- API endpoint URL: тот же
- Offline-first: всё через IndexedDB, бэкенд опционален
- Debounce push: 5–10 секунд после изменений
- Periodic pull: каждые 5 минут
- Поле `version`: продолжает инкрементироваться клиентом, используется для conflict detection

---

## Чеклист реализации

### Backend (GAS)

- [ ] Добавить столбец `revision` в структуру всех листов (init action)
- [ ] Создать лист `Meta` с `next_revision = 1` (init action, идемпотентно)
- [ ] Push: добавить `LockService.getScriptLock().tryLock(30000)`
- [ ] Push: читать `next_revision` из Meta, назначить его как единый revision для всего push-запроса
- [ ] Push: записывать этот revision в Sheets для всех created/accepted записей
- [ ] Push: инкрементировать `next_revision` на 1 (не на количество записей) и сохранить в Meta, только если хотя бы одна запись принята
- [ ] Push: возвращать единый `revision` на уровне ответа (не per-record)
- [ ] Pull: принимать `since_revision` (число) вместо `versions` (объект)
- [ ] Pull: фильтровать `record.revision > since_revision` для всех листов
- [ ] Pull: возвращать `current_revision` в ответе

### Frontend

- [ ] Dexie: bump DB_VERSION, добавить `revision` и `needsSync` в схемы таблиц
- [ ] Dexie: добавить таблицу `sync_meta`
- [ ] Dexie: написать upgrade-функцию (проставить needsSync=true, revision=0 всем записям)
- [ ] Repositories: убрать `getMaxVersion()` из всех репозиториев
- [ ] SyncService: убрать `getLocalVersions()` и `FULL_SYNC_ZERO_VERSIONS`
- [ ] SyncService: добавить мьютекс (withLock)
- [ ] SyncService: pull → читать `last_known_revision` из sync_meta, отправлять `since_revision`
- [ ] SyncService: pull → applyPullResults с проверкой `needsSync`
- [ ] SyncService: pull → сохранять `current_revision` в sync_meta
- [ ] SyncService: push → собирать записи с `needsSync === true`
- [ ] SyncService: push → сохранять sentVersions (Map<id, version>) перед отправкой
- [ ] SyncService: push → applyPushResults с проверкой sentVersion vs текущий version
- [ ] SyncService: Full Sync → `last_known_revision = 0` + все записи `needsSync = true`
- [ ] Все create/update/delete операции → ставить `needsSync = true`
- [ ] При chunked push (>200 записей): разбивать на последовательные запросы

### Типы (shared)

- [ ] Обновить интерфейсы entity: добавить `revision: number`
- [ ] Обновить PullRequest: `since_revision: number` вместо `versions`
- [ ] Обновить PullResponse: добавить `current_revision: number`
- [ ] Обновить PushResponse: единый `revision: number` на уровне ответа, убрать revision из PushResponseItem
- [ ] Создать/обновить интерфейс SyncMeta

### Тесты

- [ ] Unit: push назначает один revision всем принятым записям в одном запросе
- [ ] Unit: push не инкрементирует next_revision, если все записи conflict
- [ ] Unit: pull фильтрует по revision > since_revision
- [ ] Unit: applyPullResults пропускает needsSync записи
- [ ] Unit: applyPushResults не снимает needsSync, если version вырос
- [ ] Unit: Dexie migration проставляет needsSync=true, revision=0
- [ ] Integration: два клиента — запись созданная на A появляется на B после pull
- [ ] Integration: offline→online — needsSync записи пушатся и получают revision
- [ ] Integration: concurrent edit — last-write-wins, conflict логируется
- [ ] Integration: full sync — since_revision=0 возвращает все записи