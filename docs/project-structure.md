# Clear Progress — Файловая структура проекта

```
clear-progress/
├── README.md
├── .gitignore
│
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.ts
│   ├── postcss.config.js
│   ├── components.json                  # shadcn/ui config
│   ├── .env.example                     # VITE_GAS_URL=...
│   │
│   ├── public/
│   │   ├── manifest.webmanifest
│   │   ├── favicon.svg
│   │   ├── icons/
│   │   │   ├── icon-192.png
│   │   │   └── icon-512.png
│   │   └── robots.txt
│   │
│   └── src/
│       ├── main.tsx                     # точка входа, роутер
│       ├── App.tsx                      # корневой layout
│       ├── vite-env.d.ts
│       │
│       ├── app/
│       │   ├── router.tsx               # React Router config
│       │   └── providers.tsx            # провайдеры (QueryClient, Theme и т.д.)
│       │
│       ├── config/
│       │   └── constants.ts             # boxes, statuses, accent colors, лимиты
│       │
│       ├── types/
│       │   ├── task.ts
│       │   ├── goal.ts
│       │   ├── context.ts
│       │   ├── category.ts
│       │   ├── checklist.ts
│       │   ├── settings.ts
│       │   ├── sync.ts                  # PullRequest, PushRequest, PushResult и т.д.
│       │   └── connection.ts            # ConnectionConfig, BackendType, GasConnectionConfig
│       │
│       ├── db/
│       │   ├── index.ts                 # Dexie инстанс, схема таблиц
│       │   ├── repositories/
│       │   │   ├── task.repository.ts
│       │   │   ├── goal.repository.ts
│       │   │   ├── context.repository.ts
│       │   │   ├── category.repository.ts
│       │   │   ├── checklist.repository.ts
│       │   │   └── settings.repository.ts
│       │   └── migrations.ts            # Dexie version upgrades
│       │
│       ├── services/
│       │   ├── api.service.ts           # fetch-обёртка для GAS endpoint
│       │   ├── sync.service.ts          # pull/push логика, debounce, очередь
│       │   ├── connectionService.ts     # connect/disconnect/getConnectionConfig — единая точка управления подключением
│       │   ├── task.service.ts          # бизнес-логика задач (CRUD + box moves)
│       │   ├── goal.service.ts
│       │   ├── context.service.ts
│       │   ├── category.service.ts
│       │   ├── checklist.service.ts
│       │   └── cover.service.ts         # upload/delete обложек
│       │
│       ├── hooks/
│       │   ├── useTasks.ts
│       │   ├── useGoals.ts
│       │   ├── useContexts.ts
│       │   ├── useCategories.ts
│       │   ├── useChecklists.ts
│       │   ├── useSettings.ts
│       │   ├── useSync.ts              # статус синхронизации, online/offline
│       │   ├── useConnectionConfig.ts  # реактивный хук ConnectionConfig | null
│       │   ├── useConnectionStatus.ts  # статус подключения (not_configured, no_auth, synced...)
│       │   ├── useSwipeAction.ts       # жест свайпа
│       │   └── useHasTouchPointer.ts  # определение тач-устройства (pointer: coarse)
│       │
│       ├── components/
│       │   ├── ui/                      # shadcn/ui компоненты (button, input, sheet...)
│       │   │   └── ...
│       │   │
│       │   ├── layout/
│       │   │   ├── Sidebar.tsx
│       │   │   ├── SidebarMenuItem.tsx
│       │   │   ├── Header.tsx
│       │   │   ├── BottomNav.tsx        # мобильная навигация (если нужна)
│       │   │   └── PageShell.tsx        # обёртка страницы (заголовок + контент)
│       │   │
│       │   ├── tasks/
│       │   │   ├── TaskList.tsx
│       │   │   ├── TaskItem.tsx         # с поддержкой свайпов
│       │   │   ├── TaskForm.tsx         # создание / редактирование
│       │   │   ├── TaskDetails.tsx      # полный просмотр задачи
│       │   │   └── BoxTabs.tsx          # переключение today/week/later
│       │   │
│       │   ├── goals/
│       │   │   ├── GoalList.tsx
│       │   │   ├── GoalCard.tsx
│       │   │   ├── GoalForm.tsx
│       │   │   ├── GoalDetails.tsx      # экран цели + связанные задачи
│       │   │   └── CoverUploader.tsx
│       │   │
│       │   ├── contexts/
│       │   │   ├── ContextList.tsx
│       │   │   └── ContextForm.tsx
│       │   │
│       │   ├── categories/
│       │   │   ├── CategoryList.tsx
│       │   │   └── CategoryForm.tsx
│       │   │
│       │   ├── checklists/              # v1.1
│       │   │   ├── ChecklistPanel.tsx
│       │   │   └── ChecklistItem.tsx
│       │   │
│       │   ├── search/
│       │   │   └── SearchDialog.tsx
│       │   │
│       │   └── shared/
│       │       ├── SwipeableRow.tsx
│       │       ├── EmptyState.tsx
│       │       ├── SyncIndicator.tsx
│       │       ├── ColorPicker.tsx      # выбор акцентного цвета
│       │       └── ConfirmDialog.tsx
│       │
│       ├── pages/
│       │   ├── InboxPage.tsx
│       │   ├── BoxPage.tsx              # today / week / later (параметризован)
│       │   ├── GoalsPage.tsx
│       │   ├── GoalDetailPage.tsx
│       │   ├── ContextsPage.tsx
│       │   ├── CategoriesPage.tsx
│       │   ├── SettingsPage.tsx
│       │   ├── SetupPage.tsx            # подключение бэкенда (ввод GAS URL)
│       │   └── NotFoundPage.tsx
│       │
│       ├── lib/
│       │   ├── utils.ts                 # cn(), форматирование дат и т.д.
│       │   ├── uuid.ts                  # обёртка crypto.randomUUID()
│       │   ├── temporal.ts              # Temporal API: единая точка импорта + Clock abstraction
│       │   └── date.ts                  # ISO helpers (deprecated, мигрировать на temporal.ts)
│       │
│       ├── styles/
│       │   ├── globals.css              # Tailwind directives + CSS variables (accent)
│       │   └── themes.ts               # маппинг accent color → CSS custom properties
│       │
│       └── __tests__/
│           ├── services/
│           │   ├── task.service.test.ts
│           │   └── sync.service.test.ts
│           └── components/
│               └── TaskItem.test.tsx
│
└── backend/
    ├── .clasp.json                      # clasp project config
    ├── appsscript.json                  # GAS manifest (scopes, webapp)
    ├── tsconfig.json
    │
    └── src/
        ├── main.ts                      # doGet / doPost — роутер по action
        ├── actions/
        │   ├── ping.ts
        │   ├── init.ts                  # создание папки + Sheets + листов
        │   ├── pull.ts
        │   ├── push.ts
        │   ├── upload-cover.ts
        │   └── delete-cover.ts
        ├── sheets/
        │   ├── client.ts               # получение SpreadsheetApp, листов
        │   ├── tasks.sheet.ts           # CRUD для листа Tasks
        │   ├── goals.sheet.ts
        │   ├── contexts.sheet.ts
        │   ├── categories.sheet.ts
        │   ├── checklists.sheet.ts
        │   └── settings.sheet.ts
        ├── helpers/
        │   ├── response.ts             # jsonOk / jsonError обёртки
        │   ├── validation.ts           # проверка входных данных
        │   └── conflict.ts             # last-write-wins логика
        └── types/
            └── index.ts                # общие типы для бэкенда
```

## Ключевые решения в структуре

### Слой `db/repositories`

Изолирует все операции с IndexedDB (Dexie). Сервисы не знают про Dexie напрямую, работают через репозитории. Это упрощает тестирование и возможную замену хранилища.

### Слой `services`

Бизнес-логика: валидация, генерация UUID, проставление version/timestamps, вызов репозиториев. `sync.service` оркестрирует pull/push и взаимодействие с `api.service`.

### Страницы (`pages/`) vs компоненты (`components/`)

Страницы только собирают композицию из компонентов и подключают хуки. Вся переиспользуемая логика отображения — в `components/`.

### `BoxPage`

Один компонент для today/week/later, параметризуется через React Router. Inbox отдельный, т.к. у него своя логика обработки.

### `lib/temporal.ts`

Единая точка импорта Temporal API и Clock abstraction для тестируемости. Все модули импортируют `Temporal` отсюда, а не из `temporal-polyfill` напрямую. Содержит:
- Реэкспорт `Temporal` из `temporal-polyfill`
- `Clock` interface и `systemClock` для production
- `fakeClock` для тестов

### Backend `actions/`

По файлу на каждый action, `main.ts` только роутит. Слой `sheets/` абстрагирует работу с листами Google Sheets.
