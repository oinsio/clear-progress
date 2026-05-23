// implements FR11 of add-i18n-specs
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import enLocale from "@/locales/en.json";
import ruLocale from "@/locales/ru.json";

// i18next plural/ordinal suffixes differ by language (CLDR rules):
// Russian: _one, _few, _many; English: _one, _other
// Ordinals: _ordinal_one, _ordinal_two, _ordinal_few, _ordinal_other
const PLURAL_SUFFIX_REGEX =
  /_(zero|one|two|few|many|other|ordinal_zero|ordinal_one|ordinal_two|ordinal_few|ordinal_many|ordinal_other)$/;

function stripPluralSuffix(key: string): string {
  return key.replace(PLURAL_SUFFIX_REGEX, "");
}

function extractBaseTranslationKeys(
  object: Record<string, unknown>,
  prefix = "",
): Set<string> {
  const keys = new Set<string>();
  for (const [key, value] of Object.entries(object)) {
    if (key === "_meta") continue;
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      for (const nestedKey of extractBaseTranslationKeys(
        value as Record<string, unknown>,
        fullKey,
      )) {
        keys.add(nestedKey);
      }
    } else {
      keys.add(stripPluralSuffix(fullKey));
    }
  }
  return keys;
}

const feature = await loadFeature("../i18n_completeness.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let ruBaseKeys: Set<string>;
  let enBaseKeys: Set<string>;

  // @add-i18n-specs @FR11
  f.Scenario(
    "All keys present in both base locales",
    ({ Given, When, Then, And }) => {
      Given(
        'base locale files "ru" and "en" are loaded',
        (_ctx: TestContext) => {
          ruBaseKeys = extractBaseTranslationKeys(
            ruLocale as Record<string, unknown>,
          );
          enBaseKeys = extractBaseTranslationKeys(
            enLocale as Record<string, unknown>,
          );
        },
      );

      When(
        'comparing translation keys excluding "_meta"',
        (_ctx: TestContext) => {
          // Keys are already extracted — comparison happens in Then/And
        },
      );

      Then('every key in "ru" exists in "en"', (_ctx: TestContext) => {
        const missingInEn = [...ruBaseKeys].filter(
          (key) => !enBaseKeys.has(key),
        );
        expect(
          missingInEn,
          `Base keys in ru.json missing from en.json: ${missingInEn.join(", ")}`,
        ).toEqual([]);
      });

      And('every key in "en" exists in "ru"', (_ctx: TestContext) => {
        const missingInRu = [...enBaseKeys].filter(
          (key) => !ruBaseKeys.has(key),
        );
        expect(
          missingInRu,
          `Base keys in en.json missing from ru.json: ${missingInRu.join(", ")}`,
        ).toEqual([]);
      });
    },
  );
});
