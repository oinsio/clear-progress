import { toBaseKey } from "./flatten";
import type { CheckError, LocaleData, ScanResult } from "./types";
import { isWhitelisted } from "./whitelist";

function matchesDynamicPrefix(key: string, prefixes: Set<string>): boolean {
  for (const prefix of prefixes) {
    if (!key.startsWith(prefix)) continue;
    const rest = key.slice(prefix.length);
    // `commandBar.placeholder.${box}` -> prefix ends with dot: rest has no dots
    if (prefix.endsWith(".") && rest.length > 0 && !rest.includes("."))
      return true;
    // `repeat.month${m}` -> prefix without dot: rest is digits-only
    if (!prefix.endsWith(".") && /^\d+$/.test(rest)) return true;
  }
  return false;
}

export function checkUndefined(
  enLocale: LocaleData,
  scan: ScanResult,
): CheckError[] {
  const errors: CheckError[] = [];
  for (const key of scan.literalKeys) {
    if (scan.literalKeysTestOnly.has(key)) continue;
    const baseKey = toBaseKey(key);
    if (enLocale.baseKeys.has(baseKey) || enLocale.baseKeys.has(key)) continue;
    if (isWhitelisted(baseKey)) continue;
    errors.push({
      kind: "undefined",
      key,
      detail: "used in production code but missing from en.json",
    });
  }
  return errors;
}

export function checkUnused(
  enLocale: LocaleData,
  scan: ScanResult,
): CheckError[] {
  const errors: CheckError[] = [];
  for (const baseKey of enLocale.baseKeys) {
    if (scan.literalKeys.has(baseKey)) continue;
    if (isWhitelisted(baseKey)) continue;
    if (matchesDynamicPrefix(baseKey, scan.dynamicPrefixes)) continue;
    const isTestOnly = scan.literalKeysTestOnly.has(baseKey);
    errors.push({
      kind: "unused",
      key: baseKey,
      detail: isTestOnly
        ? "found ONLY in tests — likely a dead key"
        : "not found by literal or dynamic patterns",
    });
  }
  return errors;
}

export function checkParity(
  enLocale: LocaleData,
  ruLocale: LocaleData,
): CheckError[] {
  const errors: CheckError[] = [];
  for (const key of enLocale.baseKeys) {
    if (!ruLocale.baseKeys.has(key))
      errors.push({
        kind: "parity",
        key,
        detail: "present in en, missing in ru",
      });
  }
  for (const key of ruLocale.baseKeys) {
    if (!enLocale.baseKeys.has(key))
      errors.push({
        kind: "parity",
        key,
        detail: "present in ru, missing in en",
      });
  }
  return errors;
}

export function checkOverrideOrphans(
  override: LocaleData,
  base: LocaleData,
): CheckError[] {
  const errors: CheckError[] = [];
  for (const key of override.baseKeys) {
    if (key.startsWith("_meta")) continue;
    if (!base.baseKeys.has(key)) {
      errors.push({
        kind: "override-orphans",
        key,
        detail: `${override.code}.json overrides a key missing from ${base.code}.json`,
      });
    }
  }
  return errors;
}
