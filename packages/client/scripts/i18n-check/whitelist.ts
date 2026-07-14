/**
 * Dynamic keys that cannot be found by literal search.
 * Each pattern MUST have a comment with the usage location in code.
 * The script also verifies that each pattern matches at least one
 * existing key — stale whitelist entries become errors themselves.
 */

function escapeRe(source: string): string {
  return source.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function range(prefix: string, from: number, to: number): RegExp {
  const numbers = Array.from(
    { length: to - from + 1 },
    (_, index) => index + from,
  );
  return new RegExp(`^${escapeRe(prefix)}(${numbers.join("|")})$`);
}

function oneOf(prefix: string, values: string[]): RegExp {
  return new RegExp(`^${escapeRe(prefix)}(${values.join("|")})$`);
}

export const WHITELIST: ReadonlyArray<{ pattern: RegExp; reason: string }> = [
  // RepeatRuleSelector.tsx — t(`repeat.${freq}`)
  {
    pattern: oneOf("repeat.", ["daily", "weekly", "monthly", "yearly"]),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`repeat.${freq}`)",
  },
  // RepeatRuleSelector.tsx — t(`repeat.weekday${day}`)
  {
    pattern: range("repeat.weekday", 1, 7),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`repeat.weekday${day}`)",
  },
  // RepeatRuleSelector.tsx — t(`repeat.month${m}`)
  {
    pattern: range("repeat.month", 1, 12),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`repeat.month${m}`)",
  },
  // RepeatRuleSelector.tsx, utils.ts, repeatRule.ts
  {
    pattern: range("repeat.monthGenitive", 1, 12),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`repeat.monthGenitive${m}`)",
  },
  // LookAndFeelSection.tsx — t(`theme.${scheme}`)
  {
    pattern: oneOf("theme.", ["light", "dark", "system"]),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`theme.${scheme}`)",
  },
  // AccentColorSection.tsx — t(`color.${color}`)
  {
    pattern: oneOf("color.", [
      "blue",
      "coral",
      "green",
      "indigo",
      "orange",
      "purple",
      "yellow",
    ]),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`color.${color}`)",
  },
  // GoalsPage.tsx — t(`goalFilter.${filter}`)
  {
    pattern: oneOf("goalFilter.", ["all", "active", "paused", "finished"]),
    // biome-ignore lint/suspicious/noTemplateCurlyInString: describes a template pattern, not a real template
    reason: "t(`goalFilter.${filter}`)",
  },
  // healingRules.ts — messageKey: "sync.alert.*"
  {
    pattern: /^sync\.alert\./,
    reason: "healingRules.ts messageKey",
  },
];

export function isWhitelisted(baseKey: string): boolean {
  return WHITELIST.some((entry) => entry.pattern.test(baseKey));
}

/**
 * Duplicate groups where ALL keys match a pattern are suppressed from output.
 * Implements FR4, FR5 of deduplicate-i18n-common-keys.
 */
export const DUPLICATE_WHITELIST: ReadonlyArray<{
  pattern: RegExp;
  reason: string;
}> = [
  // FR4 of deduplicate-i18n-common-keys: domain navigation terms
  {
    pattern: /^(box|section|filter)\.inbox$/,
    reason: "domain navigation term: inbox",
  },
  {
    pattern: /^(box|section|task|repeat)\.today$/,
    reason: "domain navigation term: today",
  },
  {
    pattern: /^(box|section)\.later$/,
    reason: "domain navigation term: later",
  },
  {
    pattern: /^(box|goalFilter)\.all$/,
    reason: "domain navigation term: all",
  },
  {
    pattern: /^(task\.yesterday|section\.completedYesterday)$/,
    reason: "domain navigation term: yesterday",
  },
  {
    pattern: /^((search|filter|deleted)\.tasks|settings\.sections\.tasks)$/,
    reason: "domain navigation term: tasks",
  },
  {
    pattern: /^(search|filter|deleted)\.goals$/,
    reason: "domain navigation term: goals",
  },
  {
    pattern: /^((search|filter|deleted)\.ideas|idea\.pageName)$/,
    reason: "domain navigation term: ideas",
  },
  {
    pattern: /^(filter|deleted)\.contexts$/,
    reason: "domain navigation term: contexts",
  },
  {
    pattern: /^(filter|deleted)\.categories$/,
    reason: "domain navigation term: categories",
  },
  {
    pattern: /^(filter\.memos|memo\.pageName)$/,
    reason: "domain navigation term: memos",
  },
  {
    pattern: /^(filter\.deleted|deleted\.pageName)$/,
    reason: "domain navigation term: deleted",
  },
  // FR5 of deduplicate-i18n-common-keys: semantic pair patterns
  {
    pattern: /^settings\.(name|settingsAriaLabel)$/,
    reason: "semantic pair: display label vs aria label",
  },
  {
    pattern: /^settings\.(login|loginAriaLabel)$/,
    reason: "semantic pair: display label vs aria label",
  },
  {
    pattern: /^(settings\.pinDetailPanel|taskDetail\.pin)$/,
    reason: "semantic pair: settings toggle vs panel button",
  },
  {
    pattern: /^(settings\.unpinDetailPanel|taskDetail\.unpin)$/,
    reason: "semantic pair: settings toggle vs panel button",
  },
  {
    pattern: /^settings\.(syncIndicator|syncLegend)$/,
    reason: "semantic pair: status indicator vs legend label",
  },
  {
    pattern: /^settings\.server\.(connectSupabase|typeSupabase)$/,
    reason: "semantic pair: connect button vs provider type label",
  },
  {
    pattern: /^(settings\.disconnectConfirm|settings\.server\.disconnect)$/,
    reason: "semantic pair: confirm action vs server disconnect",
  },
  {
    pattern: /^(goal\.status|goalFilter)\.paused$/,
    reason: "semantic pair: entity status vs filter label",
  },
];

export function isDuplicateWhitelisted(key: string): boolean {
  return DUPLICATE_WHITELIST.some((entry) => entry.pattern.test(key));
}
