# Реализация Auto-Discovery локализаций

## Что изменилось

Реализован механизм автоматического обнаружения локализаций. Теперь для добавления нового языка достаточно создать один JSON-файл с блоком `_meta` — всё остальное подхватывается автоматически.

## Изменённые файлы

### 1. Файлы локалей (`frontend/src/locales/*.json`)

Добавлен блок `_meta` в начало каждого файла:

```json
{
  "_meta": {
    "code": "ru",
    "name": "Russian",
    "nativeName": "Русский",
    "baseLanguage": "ru",
    "emoji": "🇷🇺"
  },
  "nav": { ... }
}
```

**Удалены** ключи `lang.*` из всех файлов — названия языков теперь берутся из `_meta.nativeName`.

### 2. Новый сервис `frontend/src/services/localeRegistry.ts`

Единственный источник правды о доступных языках:

- Автоматически собирает все `*.json` файлы из `src/locales/` через `import.meta.glob`
- Валидирует наличие и корректность `_meta` блока
- Экспортирует:
  - `locales: LocaleMeta[]` — отсортированный список всех локалей
  - `localeResources` — ресурсы для i18next (без `_meta`)
  - `getLocaleByCode()`, `isValidLocaleCode()`, `getBaseLanguageCodes()` — утилиты

### 3. Обновлён `frontend/src/i18n.ts`

- Заменены статические импорты на `localeResources` из реестра
- `fallbackLng` стал функцией, использующей `baseLanguage` из метаданных

### 4. Обновлён `frontend/src/constants/index.ts`

- **Удалены**: `SUPPORTED_LANGUAGES`, тип `Language`
- **Оставлен**: `DEFAULT_LANGUAGE = "en"`
- **Добавлен**: `LANGUAGE_SEARCH_THRESHOLD = 10` (для будущего UI с поиском)

### 5. Обновлён `frontend/src/app/providers/LanguageProvider.tsx`

- Заменён `SUPPORTED_LANGUAGES` на `isValidLocaleCode()` из реестра
- `detectBrowserLanguage()` теперь использует `getBaseLanguageCodes()` для матчинга
- Тип `Language` заменён на `string`

### 6. Обновлён `frontend/src/pages/SettingsPage.tsx`

- Секция выбора языка теперь использует `locales` из реестра
- Отображаются эмодзи и `nativeName` для каждого языка
- Удалена зависимость от `SUPPORTED_LANGUAGES` и `t("lang.*")`

### 7. Обновлены тесты

- `frontend/src/test/setup.ts` — убирает `_meta` из тестовых ресурсов
- `frontend/src/app/providers/LanguageProvider.test.tsx` — мокает реестр
- `frontend/src/pages/SettingsPage.test.tsx` — обновлён под новый тип

## Как добавить новый язык

1. Создайте файл `frontend/src/locales/xx.json` (где `xx` — код языка)
2. Добавьте блок `_meta` в начало:

```json
{
  "_meta": {
    "code": "xx",
    "name": "Language Name (English)",
    "nativeName": "Название на родном языке",
    "baseLanguage": "xx",
    "emoji": "🏳️"
  },
  "nav": { ... },
  "box": { ... }
}
```

3. Скопируйте структуру ключей из `ru.json` или `en.json`
4. Переведите все строки

**Всё!** Язык автоматически появится в настройках приложения.

## Валидация

При сборке `localeRegistry.ts` проверяет:
- Наличие блока `_meta`
- Наличие всех обязательных полей: `code`, `name`, `nativeName`, `baseLanguage`, `emoji`
- Совпадение `_meta.code` с именем файла

Если валидация не проходит — в консоль выводится ошибка, файл пропускается, приложение продолжает работать.

## Пасхалки

Пасхалочные локализации (например, `house.json`) работают наравне с обычными:
- `baseLanguage` указывает на язык, на котором написан перевод (для fallback)
- Отображаются в общем списке языков с эмодзи

## Будущие улучшения

План предусматривал drill-down UI с поиском при ≥10 языках. Сейчас реализован простой список с эмодзи. Drill-down можно добавить позже при необходимости.
