# Capability: house-locale

Content rules for the Dr. House dialect locale (`packages/client/src/locales/house.json`, base `ru`).

## ADDED Requirements

### Requirement: Locale contains only differing overrides (FR1)

`house.json` SHALL contain only keys whose values differ from the corresponding `ru.json` values. Keys with values identical to base SHALL be absent (covered by fallback). Every non-`_meta` key SHALL exist in `ru.json` (no orphans).

#### Scenario: No redundant overrides
- **WHEN** every non-`_meta` key of `house.json` is compared with `ru.json`
- **THEN** no key has a value identical to its base value

#### Scenario: No orphan keys
- **WHEN** `i18n-check` runs
- **THEN** no `override-orphans` errors are reported for `house.json`

### Requirement: Themed strings follow the entity glossary (FR2, FR3)

All themed strings SHALL use the glossary of design.md D1 (task = «пациент», goal = «диагноз», idea = «озарение», category = «отделение», checklist item = «назначение», attachment = «снимок», deleted = «морг», box = «палата») and the verb system of D2 (delete living = «в морг», delete structural = «закрыть», restore = «реанимировать», complete = «выписать», hide = «карантин», purge = «кремация»).

#### Scenario: Entity page names match glossary
- **WHEN** reading `goal.pageName`, `idea.pageName`, `memo.pageName`, `deleted.pageName`
- **THEN** the values are «Диагнозы», «Озарения», «Советы Уилсона», «Морг»

#### Scenario: Deletion verbs are consistent
- **WHEN** reading `common.delete`, `taskDetail.delete`, `category.deleteLabel`
- **THEN** the values are «В морг», «В морг», «Закрыть отделение»

### Requirement: Accessibility strings are not themed (FR4)

`house.json` SHALL NOT override accessibility-only keys: `alert.*`, `attachment.list.*`, `attachment.lightbox.dialogLabel`, `attachment.lightbox.close`, `taskEdit.checkItemMark`, `taskEdit.checkItemUnmark`, `taskEdit.checkItemDelete`, `taskEdit.dragChecklist`, `taskEdit.checklistBadgeAriaLabel`, `taskEdit.attachmentsBadgeAriaLabel`, `settings.menuOrderDragHandle`, `settings.menuOrderToggle`, `settings.settingsAriaLabel`, `settings.loginAriaLabel`, `settings.avatarAlt`, `sync.ariaLabel`, `filter.closeSidebar`. Exception: `deleted.restoreAriaLabel` MAY be themed because the glossary verb is the clearest action name.

#### Scenario: Aria keys absent from locale
- **WHEN** `house.json` is flattened
- **THEN** none of the listed accessibility keys are present

### Requirement: Data-repair and configuration strings are not themed (FR5)

`house.json` SHALL NOT override: `sync.alert.*`, `settings.server.*`, `projectPausedDialog.*`, `repeat.ruleNotRecognized`, `repeat.invalidRuleAlertTitle`, `repeat.invalidRuleAlertMessage`, `repeat.invalidRuleAlertFix`, `auth.*`, `sidebar.*`.

#### Scenario: Repair-instruction keys absent from locale
- **WHEN** `house.json` is flattened
- **THEN** no key from the listed namespaces is present

### Requirement: Placeholder and plural parity with base (FR6)

Every overridden key SHALL contain exactly the same set of `{{placeholder}}` names as its base key, and plural/ordinal suffix variants SHALL only exist where the base key has them.

#### Scenario: Placeholders preserved
- **WHEN** an overridden key's base value contains placeholders (e.g. `deleted.purgeConfirmCount`)
- **THEN** the override contains the identical placeholder set

### Requirement: Locale metadata preserved (FR7)

`_meta` SHALL remain `{ code: "house", name: "Dr. House", nativeName: "Доктор Хаус", baseLanguage: "ru", emoji: "🏥" }`.

#### Scenario: Metadata intact
- **WHEN** `house.json` is loaded
- **THEN** `_meta.code` is `house` and `_meta.baseLanguage` is `ru`

### Requirement: Formal capitalized address (FR8)

Strings addressing the user directly SHALL use capitalized «Вы»/«Ваш» forms (e.g. «Что Вас осенило?..», «останутся у Вас на устройстве»).

#### Scenario: Capitalized address in user-facing phrases
- **WHEN** any override contains a direct address pronoun
- **THEN** it is written as «Вы»/«Вас»/«Ваш» with a capital letter

### Requirement: Normative phrase inventory (FR1–FR3)

`house.json` SHALL consist of exactly the `_meta` object and the following overrides:

| Key                                     | Value                                                                                                                                                              |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| common.delete                           | В морг                                                                                                                                                             |
| common.loading                          | Ждём анализы...                                                                                                                                                    |
| common.taskCount                        | Пациентов:                                                                                                                                                         |
| common.attachments                      | Снимки                                                                                                                                                             |
| box.inbox                               | Приёмный покой                                                                                                                                                     |
| box.today                               | Критические                                                                                                                                                        |
| box.week                                | Под наблюдением                                                                                                                                                    |
| box.later                               | Лист ожидания                                                                                                                                                      |
| box.all                                 | Обход                                                                                                                                                              |
| task.empty                              | Пациентов нет. Скука.                                                                                                                                              |
| task.emptyCompleted                     | Ни одной выписки. Плохая статистика.                                                                                                                               |
| task.emptyInbox                         | В приёмном пусто. Все лгут, что здоровы.                                                                                                                           |
| task.emptyToday                         | Критических нет. Либо все здоровы, либо уже в морге.                                                                                                               |
| task.noTasksPrompt                      | Пациентов нет. Примите кого-нибудь.                                                                                                                                |
| task.editDescription                    | Дополнить анамнез                                                                                                                                                  |
| task.hide                               | В карантин                                                                                                                                                         |
| task.hideTask                           | Пациента в карантин                                                                                                                                                |
| task.hideUntil                          | В карантине до                                                                                                                                                     |
| task.unhide                             | Выпустить                                                                                                                                                          |
| task.unhideTask                         | Выпустить из карантина                                                                                                                                             |
| task.selectGoal                         | Поставить диагноз                                                                                                                                                  |
| task.moveToBox                          | Перевести в другую палату                                                                                                                                          |
| task.selectCategory                     | Направить в отделение                                                                                                                                              |
| task.fullEdit                           | Полный осмотр                                                                                                                                                      |
| task.complete                           | Выписать                                                                                                                                                           |
| task.noncomplete                        | Рецидив                                                                                                                                                            |
| task.restore                            | Реанимировать                                                                                                                                                      |
| task.restoreConfirm                     | Реанимировать пациента?                                                                                                                                            |
| task.selectDate                         | Назначить дату                                                                                                                                                     |
| task.drag                               | Перевести пациента                                                                                                                                                 |
| task.appearDate                         | Вернётся {{date}}                                                                                                                                                  |
| task.namePlaceholder                    | Симптомы пациента...                                                                                                                                               |
| task.completedToday                     | Выписан: сегодня {{time}}                                                                                                                                          |
| task.completedYesterday                 | Выписан: вчера {{time}}                                                                                                                                            |
| task.completedDate                      | Выписан: {{date}} {{time}}                                                                                                                                         |
| section.inbox                           | Приёмный покой                                                                                                                                                     |
| section.today                           | Критические                                                                                                                                                        |
| section.week                            | Под наблюдением                                                                                                                                                    |
| section.later                           | Лист ожидания                                                                                                                                                      |
| section.completedToday                  | Выписаны сегодня                                                                                                                                                   |
| section.completedYesterday              | Выписаны вчера                                                                                                                                                     |
| section.completedWeek                   | Выписки за 7 дней                                                                                                                                                  |
| section.completedMonth                  | Выписки за месяц                                                                                                                                                   |
| section.completedEarlier                | Давно выписаны                                                                                                                                                     |
| goal.pageName                           | Диагнозы                                                                                                                                                           |
| goal.empty                              | Диагнозов нет. Все здоровы? Все лгут.                                                                                                                              |
| goal.namePlaceholder                    | Ваш диагноз?..                                                                                                                                                     |
| goal.descriptionPlaceholder             | Клиническая картина...                                                                                                                                             |
| goal.descriptionLabel                   | Клиническая картина                                                                                                                                                |
| goal.statusLabel                        | Стадия                                                                                                                                                             |
| goal.drag                               | Перетащить диагноз                                                                                                                                                 |
| goal.completedSection                   | Закрытые ({{count}})                                                                                                                                               |
| goal.showCompleted                      | Показать закрытые                                                                                                                                                  |
| goal.hideCompleted                      | Скрыть закрытые                                                                                                                                                    |
| goal.status.planning                    | Дифференциальный диагноз                                                                                                                                           |
| goal.status.in_progress                 | Лечим — увидим                                                                                                                                                     |
| goal.status.paused                      | Ждём анализы                                                                                                                                                       |
| goal.status.completed                   | Подтверждён. Я был прав.                                                                                                                                           |
| goal.status.cancelled                   | Опровергнут                                                                                                                                                        |
| goal.cover.choose                       | Снимок на обложку                                                                                                                                                  |
| goal.cover.remove                       | Убрать снимок                                                                                                                                                      |
| goal.cover.uploading                    | Проявляю снимок...                                                                                                                                                 |
| goal.cover.errorSize                    | Снимок слишком тяжёлый (макс. 2 МБ)                                                                                                                                |
| goal.cover.errorType                    | Это не снимок                                                                                                                                                      |
| goal.cover.errorUnrecognized            | Не могу разобрать, что на снимке                                                                                                                                   |
| goal.cover.errorNetwork                 | Связь оборвалась. Снимок запомнил, отправлю, когда наладится.                                                                                                      |
| goal.cover.viewFull                     | Рассмотреть снимок                                                                                                                                                 |
| goal.editName                           | Уточнить диагноз                                                                                                                                                   |
| goal.notFound                           | Диагноз не найден. Мы что-то упускаем.                                                                                                                             |
| goal.deleteConfirmName                  | Снять диагноз?                                                                                                                                                     |
| goal.addToFocus                         | Взять в работу                                                                                                                                                     |
| goal.removeFromFocus                    | Сбросить Форману                                                                                                                                                   |
| goal.emptyActive                        | Активных диагнозов нет. Скука.                                                                                                                                     |
| goal.emptyPaused                        | Никто не ждёт анализов.                                                                                                                                            |
| goal.emptyFinished                      | Ни одного закрытого диагноза.                                                                                                                                      |
| goalFilter.active                       | В работе                                                                                                                                                           |
| goalFilter.paused                       | Ждут анализов                                                                                                                                                      |
| goalFilter.finished                     | Закрытые                                                                                                                                                           |
| focusGoalReplacementDialog.title        | Заменить диагноз в работе                                                                                                                                          |
| focusGoalReplacementDialog.message      | Вы уже ведёте два диагноза. Какой сбросить Форману?                                                                                                                |
| idea.pageName                           | Озарения                                                                                                                                                           |
| idea.namePlaceholder                    | Что Вас осенило?..                                                                                                                                                 |
| idea.descriptionPlaceholder             | Записывайте, пока не забыли...                                                                                                                                     |
| idea.empty                              | Озарений нет. Сходите поболтать с Уилсоном.                                                                                                                        |
| idea.drag                               | Перетащить озарение                                                                                                                                                |
| idea.deleteLabel                        | Забыть озарение                                                                                                                                                    |
| idea.deleteConfirmName                  | Забыть озарение?                                                                                                                                                   |
| category.empty                          | Отделений нет. В больнице полный Хаос.                                                                                                                             |
| category.drag                           | Перенести отделение                                                                                                                                                |
| category.notFound                       | Отделение не найдено. Кадди закрыла?                                                                                                                               |
| category.editName                       | Переименовать отделение                                                                                                                                            |
| category.deleteLabel                    | Закрыть отделение                                                                                                                                                  |
| search.placeholder                      | Введите симптомы...                                                                                                                                                |
| search.tasks                            | Пациенты                                                                                                                                                           |
| search.goals                            | Диагнозы                                                                                                                                                           |
| search.ideas                            | Озарения                                                                                                                                                           |
| search.noResults                        | Ничего. Это не волчанка. Это никогда не волчанка.                                                                                                                  |
| search.emptyQuery                       | Назовите хотя бы один симптом.                                                                                                                                     |
| filter.inbox                            | Приёмный покой                                                                                                                                                     |
| filter.categories                       | Отделения                                                                                                                                                          |
| filter.goals                            | Диагнозы                                                                                                                                                           |
| filter.focused_goals                    | В работе                                                                                                                                                           |
| filter.ideas                            | Озарения                                                                                                                                                           |
| filter.tasks                            | Пациенты                                                                                                                                                           |
| filter.completed                        | Выписанные                                                                                                                                                         |
| filter.search                           | Диагностика                                                                                                                                                        |
| filter.memos                            | Советы Уилсона                                                                                                                                                     |
| filter.deleted                          | Морг                                                                                                                                                               |
| settings.name                           | Администрация                                                                                                                                                      |
| settings.defaultBox                     | Палата по умолчанию                                                                                                                                                |
| settings.fullSyncConfirmName            | Созвать консилиум?                                                                                                                                                 |
| settings.fullSyncConfirmDescription     | Устройство и сервер сверят все карты пациентов. При расхождении прав тот, кто говорил последним. Обычно это я.                                                     |
| settings.fullSyncStepReuploadFiles      | Заново отправляю снимки на сервер                                                                                                                                  |
| settings.fullSyncStepUploadFiles        | Отправляю новые снимки                                                                                                                                             |
| settings.fullSyncStepPush               | Докладываю серверу о пациентах                                                                                                                                     |
| settings.fullSyncStepPull               | Слушаю, что скажет сервер                                                                                                                                          |
| settings.fullSyncStepDownloadFiles      | Получаю снимки с сервера                                                                                                                                           |
| settings.fullSyncSuccess                | Консилиум окончен. Все со мной согласны.                                                                                                                           |
| settings.fullSyncError                  | Консилиум сорвался. Ничего нового.                                                                                                                                 |
| settings.fullSyncStart                  | Созвать консилиум                                                                                                                                                  |
| settings.disconnectConfirmName          | Распустить консилиум?                                                                                                                                              |
| settings.disconnectConfirmDescription   | Приложение перестанет сверяться с сервером. Карты пациентов останутся у Вас на устройстве.                                                                         |
| settings.menuOrderHint                  | Тащите, чтобы изменить порядок. Выключенное исчезает из панели. Кадди не узнает.                                                                                   |
| settings.dayBoundary                    | Начало смены                                                                                                                                                       |
| settings.dayBoundaryDescription         | Время начала Вашей смены. Отложенные на завтра пациенты поступают в этот час.                                                                                      |
| settings.sections.tasks                 | Пациенты                                                                                                                                                           |
| settings.sections.accountSync           | Контракт с больницей                                                                                                                                               |
| selector.goal                           | Диагноз                                                                                                                                                            |
| selector.category                       | Отделение                                                                                                                                                          |
| selector.hide                           | Карантин                                                                                                                                                           |
| selector.noGoal                         | Без диагноза                                                                                                                                                       |
| selector.noCategory                     | Вне отделений                                                                                                                                                      |
| repeat.none                             | Без рецидивов                                                                                                                                                      |
| taskEdit.tabChecklist                   | Назначения                                                                                                                                                         |
| taskEdit.tabChecklistProgress           | Назначения ({{completed}}/{{total}})                                                                                                                               |
| taskEdit.fieldDescription               | Анамнез                                                                                                                                                            |
| taskEdit.fieldBox                       | Палата                                                                                                                                                             |
| taskEdit.fieldRepeat                    | Хроническое                                                                                                                                                        |
| taskEdit.descriptionPlaceholder         | Дописать анамнез...                                                                                                                                                |
| taskEdit.newChecklistItemPlaceholder    | МРТ, пункция, посев...                                                                                                                                             |
| taskEdit.activeSection                  | Назначено ({{count}})                                                                                                                                              |
| taskEdit.doneSection                    | Выполнено ({{count}})                                                                                                                                              |
| taskEdit.deleteConfirmName              | Пациента в морг?                                                                                                                                                   |
| taskEdit.duplicateButton                | Клонировать пациента                                                                                                                                               |
| theme.system                            | Как решит Кадди                                                                                                                                                    |
| theme.light                             | Плацебо                                                                                                                                                            |
| theme.dark                              | Ночная смена                                                                                                                                                       |
| taskDetail.emptyState                   | Выберите пациента для осмотра                                                                                                                                      |
| taskDetail.delete                       | В морг                                                                                                                                                             |
| memo.pageName                           | Советы Уилсона                                                                                                                                                     |
| memo.empty                              | Уилсон молчит. Плохой знак.                                                                                                                                        |
| memo.notFound                           | Уилсон такого не говорил.                                                                                                                                          |
| deleted.pageName                        | Морг                                                                                                                                                               |
| deleted.empty                           | Морг пуст. Все выжили. Подозрительно.                                                                                                                              |
| deleted.sectionEmpty                    | Пусто. Даже странно.                                                                                                                                               |
| deleted.tasks                           | Пациенты                                                                                                                                                           |
| deleted.goals                           | Диагнозы                                                                                                                                                           |
| deleted.categories                      | Отделения                                                                                                                                                          |
| deleted.checklists                      | Назначения                                                                                                                                                         |
| deleted.ideas                           | Озарения                                                                                                                                                           |
| deleted.checklistParent                 | Пациент: {{task}}                                                                                                                                                  |
| deleted.restoreAriaLabel                | Реанимировать {{name}}                                                                                                                                             |
| deleted.purgeButton                     | Кремация                                                                                                                                                           |
| deleted.purgeConfirmName                | Кремировать всё?                                                                                                                                                   |
| deleted.purgeConfirmMessage             | Обратной дороги нет даже у Хауса. Записи исчезнут с сервера и со всех Ваших устройств.                                                                             |
| deleted.purgeConfirmCount               | Будет кремировано: {{tasks}} пациентов, {{goals}} диагнозов, {{contexts}} контекстов, {{categories}} отделений, {{checklist_items}} назначений, {{ideas}} озарений |
| deleted.purgeConfirm                    | Кремировать                                                                                                                                                        |
| deleted.purgeError                      | Даже кремация не сработала. Впечатляет.                                                                                                                            |
| deleted.purgingInProgress               | Кремация...                                                                                                                                                        |
| sync.syncing                            | Сверяю карты...                                                                                                                                                    |
| sync.synced                             | Сходится. Я прав. Как обычно.                                                                                                                                      |
| sync.noConnection                       | Сервер молчит. Все лгут — этот хотя бы молчит.                                                                                                                     |
| sync.serverError                        | Сервер ошибся. С кем не бывает. Со мной — не бывает.                                                                                                               |
| sync.projectPaused                      | Проект в коме                                                                                                                                                      |
| sync.alertTitle                         | Осложнения                                                                                                                                                         |
| error.title                             | Мы что-то упускаем                                                                                                                                                 |
| error.description                       | Непредвиденная ошибка. Дифференциальный диагноз короткий: перезагрузка.                                                                                            |
| error.reload                            | Разряд!                                                                                                                                                            |
| commandBar.placeholder.inbox            | Кто поступил?..                                                                                                                                                    |
| commandBar.placeholder.today            | Что у нас критичного?..                                                                                                                                            |
| commandBar.placeholder.week             | Под наблюдение...                                                                                                                                                  |
| commandBar.placeholder.later            | В лист ожидания...                                                                                                                                                 |
| commandBar.placeholder.goal             | Новый диагноз...                                                                                                                                                   |
| commandBar.placeholder.idea             | Меня осенило...                                                                                                                                                    |
| commandBar.placeholder.category         | Новое отделение...                                                                                                                                                 |
| commandBar.filterByBox                  | Фильтр по палате                                                                                                                                                   |
| commandBar.toggleHiddenItems            | Показать/скрыть карантин                                                                                                                                           |
| attachment.empty                        | Снимков нет. Даже рентгена пожалели.                                                                                                                               |
| attachment.confirmDelete                | Выбросить снимок?                                                                                                                                                  |
| attachment.confirmDeleteMessage         | Снимки не реанимируют.                                                                                                                                             |
| attachment.lightbox.previewNotAvailable | На экран такое не выведешь. Скачивайте.                                                                                                                            |
| attachment.lightbox.loadError           | Снимок не загрузился. Томограф барахлит.                                                                                                                           |
| attachment.attach.button                | Прикрепить снимок                                                                                                                                                  |
| attachment.attach.errorSize             | Снимок слишком тяжёлый (макс. 5 МБ)                                                                                                                                |
| attachment.attach.errorType             | Такое наш томограф не выдаёт                                                                                                                                       |
| attachment.attach.errorUnrecognized     | Не могу разобрать, что на снимке                                                                                                                                   |
| attachment.dropZone.hint                | Бросайте снимки сюда                                                                                                                                               |
| share.inviteMessage                     | Все лгут. Задачи — нет. Попробуй Clear Progress!                                                                                                                   |
| pwa.newVersionAvailable                 | Новая версия. Люди не меняются. Приложения — да.                                                                                                                   |
| onboarding.goalName                     | Пройти интернатуру                                                                                                                                                 |
| onboarding.goalDescription              | Разберитесь с пациентами ниже. Когда освоитесь — снимите этот диагноз.                                                                                             |
| onboarding.task1Name                    | Проведите по пациенту вправо или отметьте галочкой, чтобы выписать                                                                                                 |
| onboarding.task2Name                    | Нажмите на пациента для быстрого осмотра                                                                                                                           |
| onboarding.task3Name                    | Нажмите на пациента и держите — откроется полный осмотр                                                                                                            |
| onboarding.task4Name                    | Загляните в администрацию в боковой панели                                                                                                                         |
| onboarding.task5Name                    | Включите нужные пункты меню в администрации                                                                                                                        |
| onboarding.dialogTitle                  | Добро пожаловать в Принстон-Плейнсборо                                                                                                                             |
| onboarding.dialogBody                   | Начнём с учебного случая? Создадим диагноз с пациентами, на которых можно освоить основные приёмы.                                                                 |
| onboarding.dialogAccept                 | Взять случай                                                                                                                                                       |
| onboarding.dialogDecline                | Скучно                                                                                                                                                             |

#### Scenario: Inventory matches file exactly
- **WHEN** `house.json` is flattened (excluding `_meta.*`)
- **THEN** its key-value set equals this table exactly (no extra, no missing keys)
