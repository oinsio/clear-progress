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
];

export function isWhitelisted(baseKey: string): boolean {
  return WHITELIST.some((entry) => entry.pattern.test(baseKey));
}
