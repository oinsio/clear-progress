// implements FR1-FR7 of add-project-locales
// Project-dialect-specific helpers and the parameterized dialect map for the
// project-locales BDD steps. Shared flatten/placeholder rules live in
// locale_content.helpers.ts; kept in a separate module so
// project_locales.steps.ts stays within the file-size cap.

import { expect } from "vitest";
import enLocale from "@/locales/en.json";
import enProjectLocale from "@/locales/en-project.json";
import ruLocale from "@/locales/ru.json";
import ruProjectLocale from "@/locales/ru-project.json";
import {
  extractPlaceholders,
  flattenLocale,
  withoutMetaKeys,
} from "./locale_content.helpers";
import {
  EN_PROJECT_INVENTORY,
  EN_TERM_REGEX,
  RU_PROJECT_INVENTORY,
  RU_TERM_REGEX,
} from "./project_locales.inventory";

export const EN_PROJECT_DIALECT = "en-project";
export const RU_PROJECT_DIALECT = "ru-project";
export const PLURAL_SUFFIX_REGEX = /_(one|two|few|many|other|zero)$/;

export type DialectData = {
  overrides: Record<string, string>;
  base: Record<string, string>;
  termRegex: RegExp;
  inventory: Record<string, string>;
  meta: Record<string, string>;
};

function buildDialect(
  dialectModule: Record<string, unknown>,
  baseModule: Record<string, unknown>,
  termRegex: RegExp,
  inventory: Record<string, string>,
): DialectData {
  return {
    overrides: withoutMetaKeys(flattenLocale(dialectModule)),
    base: flattenLocale(baseModule),
    termRegex,
    inventory,
    meta: dialectModule._meta as Record<string, string>,
  };
}

export const dialectsByCode: Record<string, DialectData> = {
  [EN_PROJECT_DIALECT]: buildDialect(
    enProjectLocale as Record<string, unknown>,
    enLocale as Record<string, unknown>,
    EN_TERM_REGEX,
    EN_PROJECT_INVENTORY,
  ),
  [RU_PROJECT_DIALECT]: buildDialect(
    ruProjectLocale as Record<string, unknown>,
    ruLocale as Record<string, unknown>,
    RU_TERM_REGEX,
    RU_PROJECT_INVENTORY,
  ),
};

// FR4: returns the sorted plural suffixes present for a base name in a flat map.
function pluralSuffixesFor(
  baseName: string,
  flatMap: Record<string, string>,
): string[] {
  return Object.keys(flatMap)
    .filter((key) => key.startsWith(`${baseName}_`))
    .map((key) => key.match(PLURAL_SUFFIX_REGEX)?.[1])
    .filter((suffix): suffix is string => suffix !== undefined)
    .sort();
}

// FR1: override keys whose value equals the base value (must be none).
export function findRedundantOverrides(dialectCode: string): string[] {
  const { overrides, base } = dialectsByCode[dialectCode];
  return Object.entries(overrides)
    .filter(([key, value]) => base[key] === value)
    .map(([key]) => key);
}

// FR1: override keys absent from the base locale (must be none).
export function findOrphanOverrides(dialectCode: string): string[] {
  const { overrides, base } = dialectsByCode[dialectCode];
  return Object.keys(overrides).filter((key) => !(key in base));
}

// FR2: base keys whose value matches the dialect term regex, sorted.
export function deriveTermMentioningKeys(dialectCode: string): string[] {
  const { base, termRegex } = dialectsByCode[dialectCode];
  const baseWithoutMeta = withoutMetaKeys(base);
  return Object.keys(baseWithoutMeta)
    .filter((key) => termRegex.test(baseWithoutMeta[key]))
    .sort();
}

// FR3: override keys whose value still matches the term regex (must be none).
export function findSurvivingTermOverrides(dialectCode: string): string[] {
  const { overrides, termRegex } = dialectsByCode[dialectCode];
  return Object.entries(overrides)
    .filter(([, value]) => termRegex.test(value))
    .map(([key]) => key);
}

// FR4: override keys whose placeholder multiset differs from the base value.
export function findPlaceholderMismatches(dialectCode: string): string[] {
  const { overrides, base } = dialectsByCode[dialectCode];
  return Object.entries(overrides)
    .filter(([key, value]) => {
      const baseValue = base[key];
      if (baseValue === undefined) return false; // orphans covered by FR1
      return (
        extractPlaceholders(value).join() !==
        extractPlaceholders(baseValue).join()
      );
    })
    .map(([key]) => key);
}

// FR4: overridden plural base names whose suffix set differs from base.
export function findPluralSuffixMismatches(dialectCode: string): string[] {
  const { overrides, base } = dialectsByCode[dialectCode];
  const overriddenBaseNames = new Set(
    Object.keys(overrides)
      .filter((key) => PLURAL_SUFFIX_REGEX.test(key))
      .map((key) => key.replace(PLURAL_SUFFIX_REGEX, "")),
  );
  return [...overriddenBaseNames].filter(
    (baseName) =>
      pluralSuffixesFor(baseName, overrides).join() !==
      pluralSuffixesFor(baseName, base).join(),
  );
}

type LocaleValueRow = { key: string; value: string };
type MetadataRow = { field: string; value: string };

function asRows<Row>(table: unknown): Row[] {
  const rows = (Array.isArray(table) ? table : []) as Row[];
  expect(rows.length).toBeGreaterThan(0);
  return rows;
}

// FR3, FR7: assert each DataTable key holds the given override value.
export function expectDialectValues(dialectCode: string, table: unknown): void {
  const { overrides } = dialectsByCode[dialectCode];
  for (const row of asRows<LocaleValueRow>(table)) {
    expect(overrides[row.key]).toBe(row.value);
  }
}

// FR5: assert each DataTable field holds the given metadata value.
export function expectDialectMetadata(
  dialectCode: string,
  table: unknown,
): void {
  const { meta } = dialectsByCode[dialectCode];
  for (const row of asRows<MetadataRow>(table)) {
    expect(meta[row.field]).toBe(row.value);
  }
}

// FR6: assert each base locale holds the given sync-paused wording.
export function expectBaseSyncPaused(table: unknown): void {
  type LocaleWordingRow = { locale: string; value: string };
  const syncPausedKey = "sync.projectPaused";
  const baseByLocale: Record<string, Record<string, string>> = {
    en: dialectsByCode[EN_PROJECT_DIALECT].base,
    ru: dialectsByCode[RU_PROJECT_DIALECT].base,
  };
  for (const row of asRows<LocaleWordingRow>(table)) {
    expect(baseByLocale[row.locale][syncPausedKey]).toBe(row.value);
  }
}
