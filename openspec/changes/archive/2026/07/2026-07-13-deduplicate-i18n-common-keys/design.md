## Context

The `i18n:check` script reports ~30 duplicate value groups across `en.json` and `ru.json`. Many are common UI labels (Cancel, Back, Delete) repeated under different domain namespaces. This noise masks real issues and increases maintenance cost.

Current structure: each domain namespace (task, goal, idea, settings, etc.) defines its own copy of shared labels. All locale files use a flat namespace-based approach via i18next.

Driven by G1, G2 from proposal.

## Goals / Non-Goals

**Goals:**
- Introduce a `common` namespace for shared UI labels (FR1)
- Clean up i18n-check output by whitelisting intentional duplicates (FR4, FR5)
- Remove dead keys (FR6)

**Non-Goals:**
- Changing i18next configuration or initialization
- Altering how `t()` is called (just changing key strings)
- Modifying the duplicate detection algorithm itself

## Decisions

### D1: `common` namespace as a top-level key in locale JSON

**Decision**: Add `"common": { ... }` as a top-level key in `en.json` and `ru.json`, alongside existing namespaces like `task`, `goal`, etc.

**Alternatives considered**:
- Separate `common.json` file — adds complexity to locale loading, i18next config changes needed. Rejected per NG3/NG4.
- i18next `defaultNS` or `fallbackNS` — would require config changes and could mask missing keys. Rejected.

**Rationale**: Simplest approach. No config changes. Same `t("common.cancel")` pattern as all other keys.

### D2: Which keys go into `common`

**Decision**: Only keys where the value is identical across ALL current locales (en, ru) AND the semantic meaning is truly generic (UI action labels, field labels). Specifically:

| Key                | EN          | RU                 | Replaces |
|--------------------|-------------|--------------------|----------|
| common.cancel      | Cancel      | Отмена             | 10 keys  |
| common.back        | Back        | Назад              | 7 keys   |
| common.delete      | Delete      | Удалить            | 5 keys   |
| common.close       | Close       | Закрыть            | 4 keys   |
| common.next        | Next        | Далее              | 3 keys   |
| common.save        | Save        | Сохранить          | 2 keys   |
| common.loading     | Loading...  | Загрузка...        | 2 keys   |
| common.name        | Name        | Название           | 3 keys   |
| common.taskCount   | Tasks:      | Задач:             | 3 keys   |
| common.details     | Details     | Детали             | 2 keys   |
| common.attachments | Attachments | Вложения           | 2 keys   |
| common.saveName    | Save name   | Сохранить название | 2 keys   |

**Rationale**: These are context-independent UI labels. Adding a 3rd language won't require diverging "Cancel" in a dialog vs "Cancel" in a button.

### D3: Domain terms stay separate, get whitelisted

**Decision**: Navigation/filter/section terms (inbox, today, later, tasks, goals, ideas, etc.) remain as separate keys. The whitelist gets new entries to suppress duplicate warnings.

**Rationale**: In languages with grammatical cases (German, Finnish), "Inbox" as a page title may differ from "Inbox" as a filter label. Keeping them separate preserves this flexibility.

### D4: Semantic pairs stay separate, get whitelisted

**Decision**: Pairs like `settings.name` / `settings.settingsAriaLabel` (display vs a11y), `settings.pinDetailPanel` / `taskDetail.pin` (settings toggle vs panel button) remain separate.

**Rationale**: Different semantic roles. The a11y label might diverge from the display label for screen reader clarity.

### D5: Whitelist structure — group by category

**Decision**: Add whitelist entries grouped by reason:
1. Domain navigation terms (pattern matching multiple namespaces)
2. Semantic display/a11y pairs (explicit key lists)

Use `Set`-based lookup for exact keys, and existing `RegExp` patterns for prefix-based groups.

### D6: saveName keys are alive

**Decision**: `context.saveName` and `category.saveName` are alive — passed dynamically via `i18nKeys.saveName` object in `EntityDetailLayout` from `ContextDetailPage` and `CategoryDetailPage`. They are extracted into `common.saveName` (same value in both languages).

## Risks / Trade-offs

- **[Risk] Missed dynamic `t()` usage** → Before removing old keys, grep for all dynamic patterns that could construct the old key path. The i18n-check script already catches undefined keys, so CI will fail if we miss one.
- **[Risk] Future language needs divergent translations** → Can always split a `common.*` key back into domain-specific keys. The migration is straightforward (add domain key, update `t()` call, remove from common).
- **[Trade-off] Whitelist growth** → Adding ~15 whitelist entries is acceptable given they are well-documented and self-validating (stale entries cause errors per FR8 of i18n-check spec).
