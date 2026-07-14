import type { LocaleData, ScanResult } from "../../../scripts/i18n-check";

export function makeLocale(
  code: string,
  keys: string[],
  flat?: Record<string, string>,
): LocaleData {
  const baseKeys = new Set(keys);
  return {
    code,
    baseLanguage: code,
    flat: flat ?? Object.fromEntries(keys.map((key) => [key, key])),
    baseKeys,
  };
}

export function makeScan(overrides: Partial<ScanResult> = {}): ScanResult {
  return {
    literalKeys: overrides.literalKeys ?? new Set(),
    dynamicPrefixes: overrides.dynamicPrefixes ?? new Set(),
    literalKeysTestOnly: overrides.literalKeysTestOnly ?? new Set(),
  };
}
