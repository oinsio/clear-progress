# План: Auto-discovery локализаций

## Проблема

Сейчас добавление нового языка требует изменений в **5 местах**:

1. `src/locales/xx.json` — сам файл перевода
2. `src/i18n.ts` — статический import + resources
3. `src/constants/index.ts` — `SUPPORTED_LANGUAGES` массив
4. `src/locales/ru.json` и `en.json` — ключ `lang.xx` с названием языка
5. `src/test/setup.ts` — import локали

**Цель:** только шаг 1 — создал файл, всё заработало.

## Решения

### 1. Самоописывающий формат файла локали

Каждый JSON-файл в `src/locales/` получает блок `_meta` с метаданными:

```json
{
  "_meta": {
    "code": "de",
    "name": "Deutsch",
    "nativeName": "Deutsch",
    "baseLanguage": "de",
    "emoji": "🇩🇪"
  },
  "nav": { "..." : "..." },
  "box": { "..." : "..." }
}
```

**Поля `_meta`:**

| Поле | Обязательное | Назначение |
|------|:---:|-----------|
| `code` | да | Уникальный идентификатор локали (ключ i18next). Должен совпадать с именем файла |
| `name` | да | Название языка на английском (для сортировки и поиска) |
| `nativeName` | да | Название на родном языке (отображается в UI) |
| `baseLanguage` | да | ISO 639-1 код базового языка. Используется для i18next fallback и pluralization rules. Для пасхалок — язык, на котором написан перевод |
| `emoji` | да | Эмодзи-флаг страны или тематический символ |

**Примеры:**

```json
// ru.json
"_meta": { "code": "ru", "name": "Russian", "nativeName": "Русский", "baseLanguage": "ru", "emoji": "🇷🇺" }

// en.json
"_meta": { "code": "en", "name": "English", "nativeName": "English", "baseLanguage": "en", "emoji": "🇬🇧" }

// house.json (пасхалка)
"_meta": { "code": "house", "name": "Dr. House", "nativeName": "Доктор Хаус", "baseLanguage": "ru", "emoji": "🏥" }
```

Ключи `lang.*` удаляются из всех файлов — название берётся из `_meta.nativeName`.

---

### 2. Сервис `src/services/localeRegistry.ts`

Единственный источник правды о доступных языках.

Использует `import.meta.glob("@/locales/*.json", { eager: true })` для автоматического сбора всех файлов при сборке.

**Экспортирует:**

```ts
interface LocaleMeta {
  code: string;
  name: string;
  nativeName: string;
  baseLanguage: string;
  emoji: string;
}

// Данные
locales: LocaleMeta[]        // отсортированный список всех локалей
localeResources: Record<string, { translation: object }>  // resources для i18next (без _meta)

// Утилиты
getLocaleByCode(code: string): LocaleMeta | undefined
isValidLocaleCode(code: string): boolean
getBaseLanguageCodes(): string[]   // уникальные baseLanguage коды (для browser detection)
```

**Валидация:** если у файла нет `_meta` или нет обязательных полей — `console.error` с чётким сообщением и пропуск файла.

---

### 3. Переписать `src/i18n.ts`

Заменить 3 статических импорта на использование `localeRegistry`:

- `resources` берутся из `localeResources`
- `fallbackLng` становится функцией: для каждого кода берёт `baseLanguage` из мета + `DEFAULT_LANGUAGE`

```ts
fallbackLng: (code) => {
  const locale = getLocaleByCode(code);
  if (locale?.baseLanguage && locale.baseLanguage !== code) {
    return [locale.baseLanguage, DEFAULT_LANGUAGE];
  }
  return [DEFAULT_LANGUAGE];
}
```

---

### 4. Обновить `src/constants/index.ts`

- **Удалить** `SUPPORTED_LANGUAGES`
- **Изменить** `Language` → `string` (коды динамические, не фиксируемы `as const`)
- **Оставить** `DEFAULT_LANGUAGE = "en"`
- **Добавить** `LANGUAGE_SEARCH_THRESHOLD = 10` — порог количества языков для показа строки поиска

---

### 5. Обновить `LanguageProvider.tsx`

- Заменить `SUPPORTED_LANGUAGES.includes()` на `isValidLocaleCode()` из реестра
- `detectBrowserLanguage()` — матчить по `baseLanguage` из реестра (браузер знает `"ru"`, но не `"house"`)
- Тип `Language` → `string`

---

### 6. UI: языковой селектор в SettingsPage

Drill-down паттерн (как GoalSelector в TaskDetailPanel): при нажатии на текущий язык — SettingsPage заменяет свой контент на экран выбора языка.

**SettingsPage — секция языка:**

Текущие 3 кнопки заменяются на DrillDownRow:
- Показывает `emoji + nativeName` текущего языка
- Стрелка вправо (ChevronRight)
- По нажатию — переключает `useState<"language" | null>` для показа селектора

**Экран выбора языка (внутри SettingsPage):**

```
┌─────────────────────────────────────┐
│  ← Язык                            │  ← Шапка с кнопкой "назад"
│                                      │
│  ┌─────────────────────────────────┐│
│  │ 🔍 Поиск...                    ││  ← Появляется при ≥10 языков
│  └─────────────────────────────────┘│
│                                      │
│  ┌─────────────────────────────────┐│
│  │ 🇷🇺  Русский                  ✓││  ← Выбранный (accent color)
│  │ 🇬🇧  English                   ││
│  │ 🇩🇪  Deutsch                   ││
│  │ 🇫🇷  Français                  ││
│  │ 🏥  Доктор Хаус                ││  ← Пасхалки наравне с обычными
│  │ 🖖  Star Trek                   ││
│  │ ...                              ││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Поиск:** фильтрация по `name`, `nativeName`, `code`. Появляется только при ≥ `LANGUAGE_SEARCH_THRESHOLD` языков.

**Сортировка:** все языки в одном списке по `name` (английское название, алфавит).

**Выбор:** по нажатию на язык — применяется сразу + возврат на основной экран настроек.

---

### 7. Обновить тесты

- `src/test/setup.ts` — загружать локали через glob или явно ru/en
- Тесты `LanguageProvider` — мокать реестр вместо `SUPPORTED_LANGUAGES`
- Тесты `SettingsPage` — обновить под новый UI (DrillDownRow + селектор)

---

### 8. Валидация `_meta` при сборке

В `localeRegistry.ts`: если у файла нет `_meta` или нет обязательных полей — `console.error` с понятным сообщением и пропуск файла. Приложение не падает, но разработчик видит ошибку в консоли.

---

## Порядок реализации

| Шаг | Что делать | Файлы |
|:---:|-----------|-------|
| 1 | Добавить `_meta` в файлы локалей, удалить `lang.*` ключи | `src/locales/*.json` |
| 2 | Создать `localeRegistry.ts` | `src/services/localeRegistry.ts` |
| 3 | Переписать `i18n.ts` на динамические импорты | `src/i18n.ts` |
| 4 | Почистить константы | `src/constants/index.ts` |
| 5 | Адаптировать `LanguageProvider` | `src/app/providers/LanguageProvider.tsx` |
| 6 | Новый UI выбора языка (DrillDown + селектор) | `src/pages/SettingsPage.tsx`, новый компонент |
| 7 | Обновить тесты | `src/test/setup.ts`, тесты |
| 8 | Валидация `_meta` | `src/services/localeRegistry.ts` |
