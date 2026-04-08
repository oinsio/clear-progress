# Настройка SonarQube для локальной проверки кода

Это руководство описывает, как поднять SonarQube локально через Docker, настроить анализ JS/TS-проекта и интегрировать проверку с Claude Code.

## Требования

- Docker
- Node.js и npm
- macOS (инструкция учитывает особенности платформы)

## 1. Запуск SonarQube

```bash
docker run -d --name sonarqube -p 9000:9000 sonarqube:lts-community
```

Первый запуск занимает 1–2 минуты. Проверить готовность:

```bash
curl -s http://localhost:9000/api/system/status | python3 -c "import sys,json; print(json.load(sys.stdin)['status'])"
```

Когда вернёт `UP` — сервер готов.

## 2. Первоначальная настройка в веб-интерфейсе

1. Открой `http://localhost:9000`
2. Войди с логином `admin` / паролем `admin`
3. Смени пароль при первом входе
4. Создай проект: **Projects → Create Project → Manually**
   - Project key: `my-project` (или свой, тогда обнови `sonar-project.properties`)
   - Display name: любое
5. Сгенерируй токен: **My Account → Security → Generate Token**
   - Тип: Project Analysis Token
   - Скопируй токен — он понадобится дальше

## 3. Установка сканера

```bash
npm install --save-dev sonarqube-scanner
```

## 4. Файлы конфигурации

### sonar-project.properties

Этот файл уже подготовлен и лежит в корне проекта. Проверь, что пути `sonar.sources` соответствуют структуре твоего проекта. Текущая настройка:

```properties
sonar.sources=backend/src,frontend/src
```

Если структура проекта отличается — поправь пути.

### Настройка покрытия (Vitest)

В `vitest.config.ts` добавь секцию coverage:

```ts
export default defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['lcov', 'text'],
      reportsDirectory: './coverage',
    },
  },
});
```

Если у тебя отдельные конфиги для backend и frontend — добавь в оба и убедись, что пути к `lcov.info` указаны в `sonar-project.properties`.

## 5. Настройка токена

Скрипт автоматически загружает `.env` из корня проекта. Скопируй шаблон и впиши свой токен:

```bash
cp .env.example .env
```

Открой `.env` и заполни `SONAR_TOKEN`:

```
SONAR_HOST_URL=http://localhost:9000
SONAR_PROJECT_KEY=my-project
SONAR_TOKEN=твой_токен_здесь
```

Убедись, что `.env` добавлен в `.gitignore` (а `.env.example` — закоммичен в репозиторий).

## 6. Скрипт проверки

Файл `scripts/sonar-check.sh` уже готов. Сделай его исполняемым:

```bash
chmod +x scripts/sonar-check.sh
```

### Запуск

Полный цикл (тесты → сканирование → результат):

```bash
./scripts/sonar-check.sh
```

Только получить текущие проблемы (без повторного сканирования):

```bash
./scripts/sonar-check.sh --fix-only
```

### Что делает скрипт

1. Проверяет, что SonarQube запущен
2. Запускает `vitest` с покрытием
3. Запускает `sonar-scanner`
4. Ждёт завершения анализа (опрашивает API каждые 3 секунды, таймаут — 2 минуты)
5. Получает список проблем через API и выводит их, сгруппированные по severity
6. Возвращает exit code 1, если есть BLOCKER или CRITICAL проблемы

## 7. Интеграция с Claude Code

В файл `CLAUDE.md` в корне проекта добавлена секция с инструкциями. Claude Code будет:

1. После написания/редактирования кода запускать `./scripts/sonar-check.sh`
2. Анализировать найденные проблемы
3. Исправлять BLOCKER и CRITICAL проблемы
4. Повторять проверку до чистого результата

## 8. Добавь npm-скрипты (опционально)

В `package.json`:

```json
{
  "scripts": {
    "sonar": "./scripts/sonar-check.sh",
    "sonar:fix-only": "./scripts/sonar-check.sh --fix-only"
  }
}
```

Тогда можно запускать через `npm run sonar`.

## 9. Управление контейнером

```bash
# Остановить
docker stop sonarqube

# Запустить снова
docker start sonarqube

# Удалить (данные потеряются)
docker rm -f sonarqube

# Запустить с сохранением данных между перезапусками
docker run -d --name sonarqube \
  -p 9000:9000 \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_logs:/opt/sonarqube/logs \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  sonarqube:lts-community
```

## Возможные проблемы

**SonarQube не запускается / падает:**
На macOS может не хватать памяти для Elasticsearch внутри контейнера. Убедись, что Docker Desktop выделено минимум 4 ГБ RAM (Settings → Resources).

**Сканер не находит `sonar-project.properties`:**
Запускай сканер из корня проекта, где лежит этот файл.

**Покрытие не отображается в дашборде:**
Проверь, что `coverage/lcov.info` существует и путь в `sonar.javascript.lcov.reportPaths` корректный. Запусти тесты с `--coverage` перед сканированием.
