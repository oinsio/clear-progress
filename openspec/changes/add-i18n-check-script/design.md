## Context

The project uses i18next with JSON locale files (`src/locales/{en,ru,house}.json`). Keys are referenced in source code via `t("key")` calls, dynamic template literals (`` t(`prefix.${var}`) ``), and indirect `messageKey` patterns. There is no tooling to detect drift between locale files and code usage.

Project-specific concerns:
- `_meta.*` block in each locale is service metadata (read by `localeRegistry.ts`), not a translation key
- `house.json` is a partial override of `ru` (incompleteness is normal; only orphan keys are errors)
- Plural suffixes (`_one|_two|_few|_many|_other|_zero`) and ordinal suffixes (`_ordinal_*`) differ legitimately between en/ru — comparisons must use normalized base keys
- Some keys are constructed dynamically: `` t(`repeat.month${m}`) ``, `` t(`goal.status.${status}`) ``, `messageKey` in `healingRules.ts`

## Goals / Non-Goals

**Goals:**
- Statically validate all classes of i18n inconsistency (FR1–FR10)
- Integrate into existing test suite without new runtime dependencies
- Keep maintenance burden minimal (only `whitelist.ts` requires manual updates)

**Non-Goals:**
- Runtime checking or type generation (NG1, NG3)
- Auto-removal of dead keys (NG2 — separate change)

## Decisions

### D1: Script location — `packages/client/scripts/i18n-check/`

**Rationale**: The script operates exclusively on client package files. Placing it inside `packages/client` keeps paths simple and avoids cross-package imports. The `scripts/` directory separates tooling from application source.

**Alternatives considered**: Root-level `tools/` directory — rejected because the script reads `src/locales` and `src/**/*.{ts,tsx}` relative to the client package.

### D2: Module structure — 8 files with `index.ts` facade

```
scripts/i18n-check/
├── index.ts       # public facade (project invariant)
├── types.ts       # shared types
├── flatten.ts     # JSON flattening + plural normalization
├── scan.ts        # source file scanning for key references
├── whitelist.ts   # explicit patterns for undetectable dynamic keys
├── checks.ts      # 4 check functions (undefined/unused/parity/orphans)
├── duplicates.ts  # report-only duplicate detection
├── run.ts         # orchestrator (no process.exit)
└── cli.ts         # entrypoint with process.exit and CLI flags
```

**Rationale**: Separation of `run.ts` (pure logic) from `cli.ts` (side effects) enables Vitest to import check logic without triggering `process.exit`. Each file stays under 200 lines (NFR-M1).

### D3: Key detection strategy — regex-based static scan

Two regex patterns extract keys from source:
1. **Literal keys**: dot-separated identifiers in quotes — filtered by top-level namespace membership (from `en.json` root keys) to reject false matches like `"package.json"` or URLs
2. **Dynamic prefixes**: template literal prefix before `${...}` — matches keys where the remainder after prefix contains no dots (for `.`-terminated prefixes) or is digits-only (for non-`.` prefixes like `repeat.month`)

**Rationale**: No AST parsing needed — regex is fast (<2s) and sufficient for the project's patterns. The namespace filter eliminates most false positives without maintaining a stop-list.

**Trade-off**: String concatenation (`"repeat." + x`) is not detected. This is acceptable given the project convention of using template literals; edge cases go into the whitelist.

### D4: Whitelist design — explicit `RegExp` patterns with self-validation

Each whitelist entry is a `{ pattern: RegExp; reason: string }`. The script validates that every pattern matches at least one key in `en.json` — stale entries become errors automatically.

**Rationale**: Patterns are more expressive than simple prefix lists (can express numeric ranges like `repeat.weekday1..7`). Self-validation prevents whitelist rot.

### D5: Dynamic prefix matching — conservative rest-character check

A dynamic prefix `P` matches key `K` only if:
- `P` ends with `.` AND the rest (`K` minus `P`) contains no dots, OR
- `P` does not end with `.` AND the rest is digits-only

**Rationale**: Without this restriction, prefix `repeat.month` would falsely cover `repeat.monthAndDay` or `repeat.monthGenitive1`. The conservative check ensures only intended suffixes are matched.

### D6: Execution — `tsx` runner via `pnpm i18n:check`

The script uses TypeScript directly via `tsx` (already a dev dependency). No compilation step needed.

**Alternative**: Run only via Vitest integration test — rejected because a standalone CLI command is useful for local debugging and CI readability.

### D7: Test file separation — keys in test files reported differently

Keys found exclusively in test files (`*.test.*`, `*.spec.*`, `__mocks__/`, `test/`) do not trigger `undefined` errors (test fixtures may use non-existent keys). However, they are flagged in the `unused` report with a "test-only" marker.

**Rationale**: Prevents test helper strings (like `"task.name"` as entity field names) from blocking CI, while still surfacing potentially dead keys.

## Risks / Trade-offs

- **[Risk]** New dynamic patterns in future code may not be auto-detected → **Mitigation**: Developer guide documents the two-step process: (1) use template literal with dot prefix (auto-detected), (2) if impossible, add to `whitelist.ts`
- **[Risk]** False positives from non-i18n strings matching namespace filter (e.g., `"task.name"` as DB field) → **Mitigation**: Such strings are counted as "used", which only causes false negatives in `unused` (acceptable) — never false `undefined` errors
- **[Risk]** Script reads all source files synchronously — could slow down on very large codebases → **Mitigation**: Current codebase is ~150 files; synchronous I/O is simpler and fast enough (NFR-P1)
