# Design: add-startrek-locale

## Context

`startrek.json` is the second dialect locale (`_meta.baseLanguage: "ru"`), built on the mechanics and content rules proven by `rework-house-locale`: base-language fallback, dialect plural-rule inheritance, minimal-override principle, and no-theming zones. All decisions below were made with the user during the explore sessions (2026-07-13/14). Context: driven by FR1–FR9 from proposal.

## Goals / Non-Goals

**Goals:**
- A single glossary (starship Enterprise metaphor, user = captain) every current and future key must follow.
- Minimal file: themed overrides only, everything else falls back.
- Canon-accurate quotes (G4) with a coherent crew-to-captain voice.

**Non-Goals:**
- No i18n runtime or tooling changes; no base-locale or house-locale changes; no `en`-based Star Trek locale.

## Decisions

### D1: Entity glossary

| App entity         | Star Trek term                                         | Rationale / alternatives rejected                                                                                                                                                                                  |
|--------------------|--------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Idea               | новый мир                                              | «Исследовать новые удивительные миры» — from the opening monologue; delete = «покинуть орбиту». Rejected: «аномалия» (threatening tone), «сигнал» (collides with comms/sync), «гипотеза» (dry, not Trek-exclusive) |
| Goal               | миссия                                                 | «Its continuing mission»; statuses map to navigation (D2). Rejected: «экспедиция» (less recognizable), «директива» (a rule, not an aspiration — reserved for checklist)                                            |
| Idea→Goal link     | мир становится миссией исследования                    | Falls out of the two rows above                                                                                                                                                                                    |
| Task               | задание                                                | Away missions — daily crew work; natural in every state. Rejected: «приказ» (militaristic for daily chores, though «постоянный приказ» for recurring was tempting), «высадка» (exotic for household tasks)         |
| Checklist item     | директива                                              | Prime Directive nod; items are prescriptions to execute. Rejected: «протокол», «манёвр»                                                                                                                            |
| Category           | отсек                                                  | Ship compartments = life spheres; delete = «задраить». Rejected: «служба» (my recommendation, user preferred отсек), «палуба», «сектор»                                                                            |
| Context            | — (fallback)                                           | Same deliberate neutral zone as house (NG3). Rejected after review: «пост», «станция», «точка высадки»                                                                                                             |
| Box (generic)      | курс                                                   | Boxes are courses the ship can fly; move = «проложить другой курс». Rejected: «квадрант», «зона», «сектор», «координаты», «орбита» (collides with goal-paused status), «рубеж» (heavy declension)                  |
| Inbox              | Первый контакт                                         | Everything new starts with first contact. Rejected: «Транспортаторная», «Неопознанные объекты», «Ангар», «Стыковочный док»                                                                                         |
| Today              | Прямо по курсу                                         | Dead ahead — cannot be avoided. Rejected: «Красная тревога» (alert system discarded with the whole set), «Визуальный контакт», «На орбите» (collision)                                                             |
| Week               | Ближний космос                                         | Near space = soon                                                                                                                                                                                                  |
| Later              | Глубокий космос                                        | Deep space = far horizon (DS9 nod)                                                                                                                                                                                 |
| All                | Вся галактика                                          | Widest possible sweep. Rejected: «Весь квадрант», «Полное сканирование» (collides with search), «Обзорный экран» (collides with focus «На экран!»)                                                                 |
| Hidden task        | маскировка                                             | Cloaking device: «включить/снять маскировку»                                                                                                                                                                       |
| Attachment / cover | голозапись                                             | Holo-recordings; uploads «проецируются». Rejected: «данные сенсоров» (long, collides with scanning), «снимки с орбиты» (bad for arbitrary files)                                                                   |
| Memo               | Журнал капитана                                        | «Captain's log, stardate…» — placeholder uses the formula. Rejected: «бортовой журнал», «личные логи»                                                                                                              |
| Completed sections | журнал миссий                                          | «В журнале сегодня/вчера», «Записи за 7 дней/за месяц», «Давние записи». Rejected: «доклады», no-theming                                                                                                           |
| Deleted            | За бортом                                              | Deleted items drift overboard; delete verb everywhere = «за борт». Rejected: «буфер транспортатора» (my recommendation), «Нейтральная зона»                                                                        |
| Purge              | отпустить в дрейф                                      | Confirmation must add an explicit irreversibility warning (UX2), since the phrase alone sounds gentle                                                                                                              |
| Search             | сканирование                                           | Sensors: parameters in → matches out. Rejected: «сенсоры», «дальняя разведка»                                                                                                                                      |
| Sync (background)  | телеметрия                                             | Chosen for brevity (FR9): «Передаю телеметрию…» / «Телеметрия принята» / «Канал потерян» / «Сбой на приёмнике». Rejected: «частоты связи», «звёздная база» (longer strings)                                        |
| Full sync          | полная сверка данных                                   | The ceremony name                                                                                                                                                                                                  |
| Settings           | Машинное отделение                                     | Scotty's domain — where the ship gets tuned; day boundary = «Начало вахты». Rejected: «Каюта капитана» (my recommendation), «Командование Флота»                                                                   |
| Focus goal         | На экран!                                              | «On screen!» — focused missions are on the bridge viewscreen; remove = «Убрать с экрана»                                                                                                                           |
| Theme values       | Свет звёзд / Открытый космос / По корабельному времени | Light / dark / system. Rejected: «Дневная/Ночная вахта» set, «Как решит компьютер»                                                                                                                                 |

### D2: Verb and status system (consistency rule)

- Tasks and goals go «за борт»; ideas «покидают орбиту»; structural entities (отсеки) are «задраены», never thrown overboard.
- restore = «поднять на борт», purge = «отпустить в дрейф», complete = «выполнено», uncomplete = «возобновить», move = «проложить другой курс», recurring = «регулярный патруль».
- Goal statuses: «Прокладываем курс» → «В пути» → «Стандартная орбита» (paused) → «Миссия выполнена» → «Отозвана Флотом».
- Collision watch (UX3): «Прокладываем курс» (goal status) vs «проложить другой курс» (task move) — semantically distinct, verified not to co-occur on one surface during inventory review; fallback rename for the status: «Составляем план полёта».

### D3: Voice — crew addressing the captain, with character cameos

The base voice is the crew/ship computer reporting to the user as «капитан» (FR8). Character cameo lines are allowed only in low-frequency surfaces — empty states, statuses, loading, and error texts — and never on action buttons: Spock comments on illogical/empty states, Picard on goals and decisions, Scotty on loading and engineering failures, McCoy on lost connections («Связи нет, Джим. Я врач, а не связист!»). Alternatives rejected: pure crew voice (loses the best quotes), pure character mix (no coherent world), neutral narrator (no role frame). Direct address: «капитан» mid-sentence lowercase, or capitalized «Вы»/«Ваш» — same register rule as house D4.

### D4: One locale for both eras (TOS + TNG)

Kirk, Spock, Picard, Scotty, and McCoy coexist in one locale — one universe, one Starfleet, and twice the quote material. Alternatives rejected: TOS-only (loses «Engage!»/«Make it so» and Picard's motivational lines), TNG-only (loses «Живи долго и процветай»), two separate dialects (double inventory and maintenance for no user benefit).

### D5: Canon accuracy of quotes (G4)

Phrases derived from franchise quotes must be canon-accurate, based on the verified quote library collected during the explore session (~70 quotes with episode attribution, TOS S1–S3, TNG S1–S7, films marked). Known misquotes are banned in literal form: «Beam me up, Scotty» never occurred (canon form: «Scotty, beam us up»); «The needs of the many…» and «KHAAAN!» are film-era, acceptable but attributed as films in inventory comments. Russian renderings follow established translations where they exist («Живи долго и процветай», «Космос — последний рубеж», «Крайне нелогично», «Сопротивление бесполезно»); elsewhere the inventory fixes our own translation as normative.

### D6: No-theming zones

Identical to house D3, restated for this locale:
1. Accessibility-only strings: aria-labels, alt texts, SR announcements. Exception: restore aria-label «Поднять на борт {{name}}» — the glossary verb is the clearest action name.
2. Data-repair and config instructions: `sync.alert.*`, `settings.server.*`, `projectPausedDialog.*`, `auth.*`, invalid-repeat-rule strings.
3. Navigation/confirmation buttons where instant readability matters: `common.cancel/save/close/back/next`, `settings.disconnectConfirm`, `commandBar.create`.
4. Functional settings labels (language, handedness, scale, panels) and the repeat-rule configurator (all of `repeat.*` except `none`).

Rule of thumb (inherited from house): jokes live in statuses, empty states, and confirmations; instructions for fixing problems stay literal.

### D7: Phrase inventory location

The normative key-by-key inventory lives in `specs/startrek-locale/spec.md` (single source of truth for implementation and tests), mirrored by a typed inventory constant in the BDD steps. design.md holds only the rules that generated it, so future keys can be derived without re-deciding.

## Risks / Trade-offs

- [Humor ages or annoys daily] → Jokes concentrate in low-frequency surfaces (D3); high-frequency labels are terse glossary nouns («Задания», «Миссии», «Сканировать...»).
- [Non-viewers miss references] → Every phrase still states its function literally; box names chosen for spatial comprehension («Ближний/Глубокий космос» read as near/far even without the show).
- [Naval/military vocabulary feels cold for personal tasks] → Softened at the term level: «задание» over «приказ», «Машинное отделение» over «Командование Флота»; the captain frame makes remaining commands playful, not bossy.
- [Glossary drift returns with future keys] → Glossary + zones are spec'd and covered by content tests identical in structure to the house suite; adding an off-glossary key fails review against this design.
- [Two dialects diverge in content rules] → This change copies the house rule set verbatim where applicable (D6); a future shared `dialect-locales` spec can extract the common rules if a third dialect appears.
