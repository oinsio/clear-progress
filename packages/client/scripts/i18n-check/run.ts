import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  checkOverrideOrphans,
  checkParity,
  checkUndefined,
  checkUnused,
} from "./checks";
import { findDuplicateGroups } from "./duplicates";
import { flatten, toBaseKeySet } from "./flatten";
import { scanSources } from "./scan";
import type { CheckError, FlatMap, LocaleData } from "./types";
import { WHITELIST } from "./whitelist";

const CLIENT_ROOT = process.cwd();
const LOCALES_DIR = join(CLIENT_ROOT, "src/locales");
const SRC_DIR = join(CLIENT_ROOT, "src");

function removeMeta(flat: FlatMap): FlatMap {
  const result: FlatMap = {};
  for (const [key, value] of Object.entries(flat)) {
    if (!key.startsWith("_meta.") && key !== "_meta") {
      result[key] = value;
    }
  }
  return result;
}

export function loadLocale(code: string): LocaleData {
  const raw = JSON.parse(
    readFileSync(join(LOCALES_DIR, `${code}.json`), "utf-8"),
  );
  const baseLanguage: string = raw._meta?.baseLanguage ?? code;
  const allFlat = flatten(raw);
  const flat = removeMeta(allFlat);
  return { code, baseLanguage, flat, baseKeys: toBaseKeySet(flat) };
}

function collectSourceFiles(directory: string): string[] {
  const results: string[] = [];
  const entries = readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (fullPath === LOCALES_DIR) continue;
      results.push(...collectSourceFiles(fullPath));
    } else if (/\.(ts|tsx)$/.test(entry.name)) {
      results.push(fullPath);
    }
  }
  return results;
}

function validateWhitelist(
  enBaseKeys: Set<string>,
  enFlat: FlatMap,
): CheckError[] {
  const allKeys = [...enBaseKeys, ...Object.keys(enFlat)];
  const errors: CheckError[] = [];
  for (const entry of WHITELIST) {
    const hasMatch = allKeys.some((key) => entry.pattern.test(key));
    if (!hasMatch) {
      errors.push({
        kind: "unused",
        key: entry.pattern.source,
        detail: `stale whitelist pattern: ${entry.reason}`,
      });
    }
  }
  return errors;
}

export interface CheckResult {
  errors: CheckError[];
  duplicateGroups: Map<string, string[]>;
}

export function runAllChecks(): CheckResult {
  const codes = readdirSync(LOCALES_DIR)
    .filter((file) => file.endsWith(".json"))
    .map((file) => file.replace(".json", ""));
  const locales = new Map(codes.map((code) => [code, loadLocale(code)]));
  const enLocale = locales.get("en");
  const ruLocale = locales.get("ru");
  if (!enLocale || !ruLocale) throw new Error("en.json and ru.json must exist");

  const enRaw = JSON.parse(readFileSync(join(LOCALES_DIR, "en.json"), "utf-8"));
  const topLevelNamespaces = new Set(
    Object.keys(enRaw).filter((key) => key !== "_meta"),
  );

  const sourceFiles = collectSourceFiles(SRC_DIR);
  const scanResult = scanSources(sourceFiles, topLevelNamespaces);

  const errors: CheckError[] = [
    ...checkUndefined(enLocale, scanResult),
    ...checkUnused(enLocale, scanResult),
    ...checkParity(enLocale, ruLocale),
    ...validateWhitelist(enLocale.baseKeys, enLocale.flat),
  ];

  for (const locale of locales.values()) {
    if (locale.baseLanguage !== locale.code) {
      const baseLocale = locales.get(locale.baseLanguage);
      if (baseLocale) errors.push(...checkOverrideOrphans(locale, baseLocale));
    }
  }

  const duplicateGroups = findDuplicateGroups(enLocale, ruLocale);

  return { errors, duplicateGroups };
}
