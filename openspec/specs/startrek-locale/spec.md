# Capability: startrek-locale

## Purpose

Content rules for the Star Trek dialect locale (`packages/client/src/locales/startrek.json`, base `ru`).

## Requirements

### Requirement: Locale contains only differing overrides (FR1)

`startrek.json` SHALL contain only keys whose values differ from the corresponding `ru.json` values. Keys with values identical to base SHALL be absent (covered by fallback). Every non-`_meta` key SHALL exist in `ru.json` (no orphans).

#### Scenario: No redundant overrides
- **WHEN** every non-`_meta` key of `startrek.json` is compared with `ru.json`
- **THEN** no key has a value identical to its base value

#### Scenario: No orphan keys
- **WHEN** `i18n-check` runs
- **THEN** no `override-orphans` errors are reported for `startrek.json`

### Requirement: Themed strings follow the entity glossary (FR2, FR3)

All themed strings SHALL use the glossary of design.md D1 (idea = «новый мир», goal = «миссия», task = «задание», checklist item = «директива», category = «отсек», box = «курс», attachment = «голозапись», memo = «Журнал капитана», deleted = «За бортом») and the verb system of D2 (delete = «за борт», delete idea = «покинуть орбиту», delete structural = «задраить», restore = «поднять на борт», purge = «отпустить в дрейф», hide = «маскировка», move = «проложить другой курс»).

#### Scenario: Entity page names match glossary
- **WHEN** reading `goal.pageName`, `idea.pageName`, `memo.pageName`, `deleted.pageName`
- **THEN** the values are «Миссии», «Новые миры», «Журнал капитана», «За бортом»

#### Scenario: Deletion verbs are consistent
- **WHEN** reading `common.delete`, `taskDetail.delete`, `category.deleteLabel`, `idea.deleteLabel`
- **THEN** the values are «За борт», «За борт», «Задраить отсек», «Покинуть орбиту»

### Requirement: Accessibility strings are not themed (FR4)

`startrek.json` SHALL NOT override accessibility-only keys: `alert.*`, `attachment.list.*`, `attachment.lightbox.dialogLabel`, `attachment.lightbox.close`, `taskEdit.checkItemMark`, `taskEdit.checkItemUnmark`, `taskEdit.checkItemDelete`, `taskEdit.dragChecklist`, `taskEdit.checklistBadgeAriaLabel`, `taskEdit.attachmentsBadgeAriaLabel`, `settings.menuOrderDragHandle`, `settings.menuOrderToggle`, `settings.settingsAriaLabel`, `settings.loginAriaLabel`, `settings.avatarAlt`, `sync.ariaLabel`, `filter.closeSidebar`. Exception: `deleted.restoreAriaLabel` MAY be themed because the glossary verb is the clearest action name.

#### Scenario: Aria keys absent from locale
- **WHEN** `startrek.json` is flattened
- **THEN** none of the listed accessibility keys are present

### Requirement: Data-repair and configuration strings are not themed (FR5)

`startrek.json` SHALL NOT override: `sync.alert.*`, `settings.server.*`, `projectPausedDialog.*`, `repeat.ruleNotRecognized`, `repeat.invalidRuleAlertTitle`, `repeat.invalidRuleAlertMessage`, `repeat.invalidRuleAlertFix`, `auth.*`, `sidebar.*`.

#### Scenario: Repair-instruction keys absent from locale
- **WHEN** `startrek.json` is flattened
- **THEN** no key from the listed namespaces is present

### Requirement: Placeholder and plural parity with base (FR6)

Every overridden key SHALL contain exactly the same set of `{{placeholder}}` names as its base key, and plural/ordinal suffix variants SHALL only exist where the base key has them.

#### Scenario: Placeholders preserved
- **WHEN** an overridden key's base value contains placeholders (e.g. `deleted.purgeConfirmCount`)
- **THEN** the override contains the identical placeholder set

### Requirement: Locale metadata (FR7)

`_meta` SHALL be `{ code: "startrek", name: "Star Trek", nativeName: "Звёздный путь", baseLanguage: "ru", emoji: "🖖" }`.

#### Scenario: Metadata exact
- **WHEN** `startrek.json` is loaded
- **THEN** `_meta.code` is `startrek`, `_meta.baseLanguage` is `ru`, and `_meta.emoji` is «🖖»

### Requirement: Crew-to-captain voice and address register (FR8)

The locale voice SHALL be the crew addressing the user as «капитан» (lowercase mid-sentence). Where overrides address the user directly, they SHALL use either the «капитан» address or capitalized «Вы»/«Ваш» forms. Character cameo lines appear only in empty states, statuses, and error texts — never on action buttons.

#### Scenario: Capitalized address in user-facing phrases
- **WHEN** any override contains a direct address pronoun
- **THEN** it is written as «Вы»/«Вас»/«Ваш» with a capital letter

#### Scenario: Captain address is lowercase
- **WHEN** any override contains the word «капитан» as an address mid-sentence
- **THEN** it is written in lowercase

### Requirement: Sync status strings stay short (FR9)

No themed `sync.*` string SHALL exceed its `ru.json` counterpart by more than 10 characters.

#### Scenario: Length budget respected
- **WHEN** each themed `sync.*` value is compared with its base value
- **THEN** `themed.length <= base.length + 10`

### Requirement: Normative phrase inventory (FR1–FR3)

`startrek.json` SHALL consist of exactly the `_meta` object and the following overrides:

| Key                                     | Value                                                                                                  |
|-----------------------------------------|--------------------------------------------------------------------------------------------------------|
| common.delete                           | За борт                                                                                                |
| common.loading                          | Выходим на варп...                                                                                     |
| common.taskCount                        | Заданий:                                                                                               |
| common.attachments                      | Голозаписи                                                                                             |
| box.inbox                               | Первый контакт                                                                                         |
| box.today                               | Прямо по курсу                                                                                         |
| box.week                                | Ближний космос                                                                                         |
| box.later                               | Глубокий космос                                                                                        |
| box.all                                 | Вся галактика                                                                                          |
| task.empty                              | Заданий нет. Сенсоры чисты, капитан.                                                                   |
| task.emptyCompleted                     | Ни одного выполненного задания. Занятно.                                                               |
| task.emptyInbox                         | Новых контактов нет. Эфир чист.                                                                        |
| task.emptyToday                         | По курсу чисто. Идём на крейсерской.                                                                   |
| task.noTasksPrompt                      | Заданий нет. Экипаж ждёт приказов.                                                                     |
| task.editDescription                    | Дополнить журнал                                                                                       |
| task.hide                               | Включить маскировку                                                                                    |
| task.hideTask                           | Замаскировать задание                                                                                  |
| task.hideUntil                          | Под маскировкой до                                                                                     |
| task.unhide                             | Снять маскировку                                                                                       |
| task.unhideTask                         | Снять маскировку с задания                                                                             |
| task.selectGoal                         | Приписать к миссии                                                                                     |
| task.moveToBox                          | Проложить другой курс                                                                                  |
| task.selectCategory                     | Направить в отсек                                                                                      |
| task.fullEdit                           | Полная диагностика                                                                                     |
| task.complete                           | Задание выполнено                                                                                      |
| task.noncomplete                        | Возобновить задание                                                                                    |
| task.restore                            | Поднять на борт                                                                                        |
| task.restoreConfirm                     | Поднять задание на борт?                                                                               |
| task.selectDate                         | Назначить звёздную дату                                                                                |
| task.drag                               | Сменить курс задания                                                                                   |
| task.appearDate                         | Снимет маскировку {{date}}                                                                             |
| task.namePlaceholder                    | Суть задания, капитан?..                                                                               |
| task.completedToday                     | Выполнено: сегодня {{time}}                                                                            |
| task.completedYesterday                 | Выполнено: вчера {{time}}                                                                              |
| task.completedDate                      | Выполнено: {{date}} {{time}}                                                                           |
| section.inbox                           | Первый контакт                                                                                         |
| section.today                           | Прямо по курсу                                                                                         |
| section.week                            | Ближний космос                                                                                         |
| section.later                           | Глубокий космос                                                                                        |
| section.completedToday                  | В журнале сегодня                                                                                      |
| section.completedYesterday              | В журнале вчера                                                                                        |
| section.completedWeek                   | Записи за 7 дней                                                                                       |
| section.completedMonth                  | Записи за месяц                                                                                        |
| section.completedEarlier                | Давние записи                                                                                          |
| goal.pageName                           | Миссии                                                                                                 |
| goal.empty                              | Миссий нет. Флот ждёт Ваших приказов, капитан.                                                         |
| goal.namePlaceholder                    | Цель миссии?..                                                                                         |
| goal.descriptionPlaceholder             | План полёта...                                                                                         |
| goal.descriptionLabel                   | План полёта                                                                                            |
| goal.statusLabel                        | Фаза                                                                                                   |
| goal.drag                               | Перетащить миссию                                                                                      |
| goal.completedSection                   | В журнале ({{count}})                                                                                  |
| goal.showCompleted                      | Открыть журнал миссий                                                                                  |
| goal.hideCompleted                      | Закрыть журнал миссий                                                                                  |
| goal.status.planning                    | Прокладываем курс                                                                                      |
| goal.status.in_progress                 | В пути                                                                                                 |
| goal.status.paused                      | Стандартная орбита                                                                                     |
| goal.status.completed                   | Миссия выполнена                                                                                       |
| goal.status.cancelled                   | Отозвана Флотом                                                                                        |
| goal.cover.choose                       | Голозапись на обложку                                                                                  |
| goal.cover.remove                       | Убрать голозапись                                                                                      |
| goal.cover.uploading                    | Проецирую голограмму...                                                                                |
| goal.cover.errorSize                    | Голозапись слишком тяжёлая (макс. 2 МБ)                                                                |
| goal.cover.errorType                    | Это не голозапись                                                                                      |
| goal.cover.errorUnrecognized            | Голопроектор не распознал формат                                                                       |
| goal.cover.errorNetwork                 | Канал потерян. Голозапись сохранена, передам, когда восстановится связь.                               |
| goal.cover.viewFull                     | Развернуть голограмму                                                                                  |
| goal.editName                           | Уточнить миссию                                                                                        |
| goal.notFound                           | Миссия не найдена. Сенсоры молчат.                                                                     |
| goal.deleteConfirmName                  | Миссию за борт?                                                                                        |
| goal.addToFocus                         | На экран!                                                                                              |
| goal.removeFromFocus                    | Убрать с экрана                                                                                        |
| goal.emptyActive                        | Активных миссий нет. Двигатели остывают.                                                               |
| goal.emptyPaused                        | Ни одной миссии на орбите.                                                                             |
| goal.emptyFinished                      | Журнал миссий пуст.                                                                                    |
| goalFilter.active                       | В пути                                                                                                 |
| goalFilter.paused                       | На орбите                                                                                              |
| goalFilter.finished                     | Выполненные                                                                                            |
| focusGoalReplacementDialog.title        | Заменить миссию на экране                                                                              |
| focusGoalReplacementDialog.message      | На экране уже две миссии. Какую убрать?                                                                |
| idea.pageName                           | Новые миры                                                                                             |
| idea.namePlaceholder                    | Какой мир открылся?..                                                                                  |
| idea.descriptionPlaceholder             | Что показали сенсоры?..                                                                                |
| idea.empty                              | Неизведанных миров нет. Пока.                                                                          |
| idea.drag                               | Перетащить мир                                                                                         |
| idea.deleteLabel                        | Покинуть орбиту                                                                                        |
| idea.deleteConfirmName                  | Покинуть орбиту этого мира?                                                                            |
| category.empty                          | Отсеков нет. Гуляем по пустому кораблю.                                                                |
| category.drag                           | Перенести отсек                                                                                        |
| category.notFound                       | Отсек не найден. На схеме корабля его нет.                                                             |
| category.editName                       | Переименовать отсек                                                                                    |
| category.deleteLabel                    | Задраить отсек                                                                                         |
| search.placeholder                      | Сканировать...                                                                                         |
| search.tasks                            | Задания                                                                                                |
| search.goals                            | Миссии                                                                                                 |
| search.ideas                            | Новые миры                                                                                             |
| search.noResults                        | Сенсоры ничего не обнаружили. Крайне нелогично.                                                        |
| search.emptyQuery                       | Задайте параметры сканирования                                                                         |
| filter.inbox                            | Первый контакт                                                                                         |
| filter.categories                       | Отсеки                                                                                                 |
| filter.goals                            | Миссии                                                                                                 |
| filter.focused_goals                    | На экране                                                                                              |
| filter.ideas                            | Новые миры                                                                                             |
| filter.tasks                            | Задания                                                                                                |
| filter.completed                        | Журнал миссий                                                                                          |
| filter.search                           | Сканирование                                                                                           |
| filter.memos                            | Журнал капитана                                                                                        |
| filter.deleted                          | За бортом                                                                                              |
| settings.name                           | Машинное отделение                                                                                     |
| settings.defaultBox                     | Курс по умолчанию                                                                                      |
| settings.fullSyncConfirmName            | Начать полную сверку данных?                                                                           |
| settings.fullSyncConfirmDescription     | Корабль и звёздная база сверят все записи. При расхождении верим тому, кто говорил последним.          |
| settings.fullSyncStepReuploadFiles      | Заново передаю голозаписи на базу                                                                      |
| settings.fullSyncStepUploadFiles        | Передаю новые голозаписи                                                                               |
| settings.fullSyncStepPush               | Отправляю телеметрию на базу                                                                           |
| settings.fullSyncStepPull               | Принимаю данные с базы                                                                                 |
| settings.fullSyncStepDownloadFiles      | Принимаю голозаписи с базы                                                                             |
| settings.fullSyncSuccess                | Сверка завершена. Все системы в норме.                                                                 |
| settings.fullSyncError                  | Сверка не удалась. Инженерный разбирается.                                                             |
| settings.fullSyncStart                  | Полная сверка данных                                                                                   |
| settings.disconnectConfirmName          | Отключить телеметрию?                                                                                  |
| settings.disconnectConfirmDescription   | Корабль перестанет выходить на связь с базой. Все записи останутся у Вас на борту.                     |
| settings.menuOrderHint                  | Тащите, чтобы изменить порядок. Выключенное исчезает с панели. Компьютер не возражает.                 |
| settings.dayBoundary                    | Начало вахты                                                                                           |
| settings.dayBoundaryDescription         | Время начала Вашей вахты. Отложенные на завтра задания поступают в этот час.                           |
| settings.sections.tasks                 | Задания                                                                                                |
| settings.sections.accountSync           | Связь со звёздной базой                                                                                |
| selector.goal                           | Миссия                                                                                                 |
| selector.category                       | Отсек                                                                                                  |
| selector.hide                           | Маскировка                                                                                             |
| selector.noGoal                         | Вне миссий                                                                                             |
| selector.noCategory                     | Вне отсеков                                                                                            |
| repeat.none                             | Разовое задание                                                                                        |
| taskEdit.tabChecklist                   | Директивы                                                                                              |
| taskEdit.tabChecklistProgress           | Директивы ({{completed}}/{{total}})                                                                    |
| taskEdit.fieldDescription               | Журнал                                                                                                 |
| taskEdit.fieldBox                       | Курс                                                                                                   |
| taskEdit.fieldRepeat                    | Патруль                                                                                                |
| taskEdit.descriptionPlaceholder         | Дополнить журнал...                                                                                    |
| taskEdit.newChecklistItemPlaceholder    | Новая директива...                                                                                     |
| taskEdit.activeSection                  | К исполнению ({{count}})                                                                               |
| taskEdit.doneSection                    | Исполнено ({{count}})                                                                                  |
| taskEdit.deleteConfirmName              | Задание за борт?                                                                                       |
| taskEdit.duplicateButton                | Реплицировать задание                                                                                  |
| theme.system                            | По корабельному времени                                                                                |
| theme.light                             | Свет звёзд                                                                                             |
| theme.dark                              | Открытый космос                                                                                        |
| taskDetail.emptyState                   | Выберите задание для доклада                                                                           |
| taskDetail.delete                       | За борт                                                                                                |
| memo.pageName                           | Журнал капитана                                                                                        |
| memo.empty                              | Записей нет. Звёздная дата не ждёт.                                                                    |
| memo.notFound                           | В журнале такой записи нет.                                                                            |
| deleted.pageName                        | За бортом                                                                                              |
| deleted.empty                           | За бортом чисто. Никого не теряли, капитан.                                                            |
| deleted.sectionEmpty                    | Пусто. Космос как космос.                                                                              |
| deleted.tasks                           | Задания                                                                                                |
| deleted.goals                           | Миссии                                                                                                 |
| deleted.categories                      | Отсеки                                                                                                 |
| deleted.checklists                      | Директивы                                                                                              |
| deleted.ideas                           | Новые миры                                                                                             |
| deleted.checklistParent                 | Задание: {{task}}                                                                                      |
| deleted.restoreAriaLabel                | Поднять на борт {{name}}                                                                               |
| deleted.purgeButton                     | Отпустить в дрейф                                                                                      |
| deleted.purgeConfirmName                | Отпустить всё в дрейф?                                                                                 |
| deleted.purgeConfirmMessage             | Обратной дороги нет: вулканцы никогда не блефуют. Записи исчезнут с сервера и со всех Ваших устройств. |
| deleted.purgeConfirmCount               | В дрейф уйдёт: {{items}}                                                                               |
| deleted.purgeCountTasks_one             | {{count}} задание                                                                                      |
| deleted.purgeCountTasks_few             | {{count}} задания                                                                                      |
| deleted.purgeCountTasks_many            | {{count}} заданий                                                                                      |
| deleted.purgeCountGoals_one             | {{count}} миссия                                                                                       |
| deleted.purgeCountGoals_few             | {{count}} миссии                                                                                       |
| deleted.purgeCountGoals_many            | {{count}} миссий                                                                                       |
| deleted.purgeCountCategories_one        | {{count}} отсек                                                                                        |
| deleted.purgeCountCategories_few        | {{count}} отсека                                                                                       |
| deleted.purgeCountCategories_many       | {{count}} отсеков                                                                                      |
| deleted.purgeCountChecklistItems_one    | {{count}} директива                                                                                    |
| deleted.purgeCountChecklistItems_few    | {{count}} директивы                                                                                    |
| deleted.purgeCountChecklistItems_many   | {{count}} директив                                                                                     |
| deleted.purgeCountIdeas_one             | {{count}} мир                                                                                          |
| deleted.purgeCountIdeas_few             | {{count}} мира                                                                                         |
| deleted.purgeCountIdeas_many            | {{count}} миров                                                                                        |
| deleted.purgeConfirm                    | Отпустить в дрейф                                                                                      |
| deleted.purgeError                      | Не вышло. Они всё ещё за бортом.                                                                       |
| deleted.purgingInProgress               | Отпускаю в дрейф...                                                                                    |
| sync.syncing                            | Передаю телеметрию...                                                                                  |
| sync.synced                             | Телеметрия принята                                                                                     |
| sync.noConnection                       | Канал потерян                                                                                          |
| sync.serverError                        | Сбой на приёмнике                                                                                      |
| sync.projectPaused                      | Передача приостановлена                                                                                |
| sync.alertTitle                         | Сбой канала                                                                                            |
| error.title                             | Щиты пробиты                                                                                           |
| error.description                       | Неизвестная аномалия. Инженерный рекомендует перезапуск варп-ядра.                                     |
| error.reload                            | Перезапустить ядро                                                                                     |
| commandBar.placeholder.inbox            | Кто на связи?..                                                                                        |
| commandBar.placeholder.today            | Что прямо по курсу?..                                                                                  |
| commandBar.placeholder.week             | В ближний космос...                                                                                    |
| commandBar.placeholder.later            | В глубокий космос...                                                                                   |
| commandBar.placeholder.goal             | Новая миссия...                                                                                        |
| commandBar.placeholder.idea             | Новый мир...                                                                                           |
| commandBar.placeholder.category         | Новый отсек...                                                                                         |
| commandBar.filterByBox                  | Фильтр по курсу                                                                                        |
| commandBar.toggleHiddenItems            | Показать/скрыть замаскированное                                                                        |
| attachment.empty                        | Голозаписей нет. Голопалуба пустует.                                                                   |
| attachment.confirmDelete                | Стереть голозапись?                                                                                    |
| attachment.confirmDeleteMessage         | Голозаписи не восстанавливаются.                                                                       |
| attachment.lightbox.previewNotAvailable | Голопроектор такое не выведет. Скачивайте.                                                             |
| attachment.lightbox.loadError           | Голозапись не загрузилась. Проектор барахлит.                                                          |
| attachment.attach.button                | Прикрепить голозапись                                                                                  |
| attachment.attach.errorSize             | Голозапись слишком тяжёлая (макс. 5 МБ)                                                                |
| attachment.attach.errorType             | Голопроектор такой формат не примет                                                                    |
| attachment.attach.errorUnrecognized     | Голопроектор не распознал формат                                                                       |
| attachment.dropZone.hint                | Телепортируйте голозаписи сюда                                                                         |
| share.inviteMessage                     | Космос — последний рубеж. Прокрастинация — нет. Попробуй Clear Progress!                               |
| pwa.newVersionAvailable                 | Новая версия. Сопротивление бесполезно.                                                                |
| onboarding.goalName                     | Пройти Академию Звёздного флота                                                                        |
| onboarding.goalDescription              | Выполните задания ниже. Когда освоитесь — доложите о выполнении миссии.                                |
| onboarding.task1Name                    | Проведите по заданию вправо или отметьте галочкой — задание выполнено                                  |
| onboarding.task2Name                    | Нажмите на задание для быстрой корректировки                                                           |
| onboarding.task3Name                    | Нажмите на задание и держите — откроется полная диагностика                                            |
| onboarding.task4Name                    | Загляните в Машинное отделение в боковой панели                                                        |
| onboarding.task5Name                    | Включите нужные пункты меню в Машинном отделении                                                       |
| onboarding.dialogTitle                  | Добро пожаловать на борт «Энтерпрайза»                                                                 |
| onboarding.dialogBody                   | Начнём с учебной миссии? Создадим миссию с заданиями, на которых можно освоить основные манёвры.       |
| onboarding.dialogAccept                 | Вперёд!                                                                                                |
| onboarding.dialogDecline                | Я уже капитан                                                                                          |

#### Scenario: Inventory matches file exactly
- **WHEN** `startrek.json` is flattened (excluding `_meta.*`)
- **THEN** its key-value set equals this table exactly (no extra, no missing keys)
