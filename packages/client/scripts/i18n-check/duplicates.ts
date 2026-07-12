import type { LocaleData } from "./types";

/** Groups of keys whose values match in both en and ru. */
export function findDuplicateGroups(
  en: LocaleData,
  ru: LocaleData,
): Map<string, string[]> {
  const byEnValue = new Map<string, string[]>();

  for (const [key, value] of Object.entries(en.flat)) {
    const normalizedValue = value.trim().toLowerCase();
    if (!normalizedValue) continue;
    byEnValue.set(normalizedValue, [
      ...(byEnValue.get(normalizedValue) ?? []),
      key,
    ]);
  }

  const result = new Map<string, string[]>();

  for (const [value, keys] of byEnValue) {
    if (keys.length < 2) continue;

    const ruValues = new Set(
      keys.map((key) => ru.flat[key]?.trim().toLowerCase()),
    );

    if (ruValues.size === 1 && !ruValues.has(undefined as unknown as string)) {
      result.set(value, keys);
    }
  }

  return result;
}
