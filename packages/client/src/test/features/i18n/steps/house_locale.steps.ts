// implements FR1-FR8 of rework-house-locale
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import houseLocale from "@/locales/house.json";
import ruLocale from "@/locales/ru.json";
import { HOUSE_LOCALE_INVENTORY } from "./house_locale.inventory";
import {
  ACCESSIBILITY_ONLY_KEYS,
  ACCESSIBILITY_ONLY_PREFIXES,
  extractPlaceholders,
  flattenLocale,
  isForbiddenKey,
  LOWERCASE_ADDRESS_REGEX,
  REPAIR_AND_CONFIG_KEYS,
  REPAIR_AND_CONFIG_PREFIXES,
  withoutMetaKeys,
} from "./locale_content.helpers";

const feature = await loadFeature("../house_locale.feature");

type LocaleValueRow = { key: string; value: string };
type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let houseOverrides: Record<string, string>;
  let ruFlat: Record<string, string>;

  f.Background(({ Given }) => {
    Given(
      'the "house" and "ru" locale files are flattened',
      (_ctx: TestContext) => {
        houseOverrides = withoutMetaKeys(
          flattenLocale(houseLocale as Record<string, unknown>),
        );
        ruFlat = flattenLocale(ruLocale as Record<string, unknown>);
        expect(Object.keys(houseOverrides).length).toBeGreaterThan(0);
      },
    );
  });

  // @rework-house-locale @FR1
  f.Scenario(
    "Locale carries only phrases that differ from the base",
    ({ Then }) => {
      Then(
        "no house override has a value identical to its base value",
        (_ctx: TestContext) => {
          const redundantKeys = Object.entries(houseOverrides)
            .filter(([key, value]) => ruFlat[key] === value)
            .map(([key]) => key);
          expect(redundantKeys).toEqual([]);
        },
      );
    },
  );

  // @rework-house-locale @FR1
  f.Scenario("Every override exists in the base locale", ({ Then }) => {
    Then(
      "every house override key exists in the base locale",
      (_ctx: TestContext) => {
        const orphanKeys = Object.keys(houseOverrides).filter(
          (key) => !(key in ruFlat),
        );
        expect(orphanKeys).toEqual([]);
      },
    );
  });

  // @rework-house-locale @FR2
  f.Scenario("Entity pages follow the hospital glossary", ({ Then }) => {
    Then("the house locale values are:", (_ctx: TestContext, table) => {
      const rows = (Array.isArray(table) ? table : []) as LocaleValueRow[];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(houseOverrides[row.key]).toBe(row.value);
      }
    });
  });

  // @rework-house-locale @FR3
  f.Scenario("Deletion verbs follow the verb system", ({ Then }) => {
    Then("the house locale values are:", (_ctx: TestContext, table) => {
      const rows = (Array.isArray(table) ? table : []) as LocaleValueRow[];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(houseOverrides[row.key]).toBe(row.value);
      }
    });
  });

  // @rework-house-locale @FR4
  f.Scenario("Accessibility strings keep their base wording", ({ Then }) => {
    Then("no accessibility-only key is overridden", (_ctx: TestContext) => {
      const themedAccessibilityKeys = Object.keys(houseOverrides).filter(
        (key) =>
          isForbiddenKey(
            key,
            ACCESSIBILITY_ONLY_KEYS,
            ACCESSIBILITY_ONLY_PREFIXES,
          ),
      );
      expect(themedAccessibilityKeys).toEqual([]);
    });
  });

  // @rework-house-locale @FR5
  f.Scenario(
    "Data-repair and configuration instructions keep their base wording",
    ({ Then }) => {
      Then(
        "no data-repair or configuration key is overridden",
        (_ctx: TestContext) => {
          const themedRepairKeys = Object.keys(houseOverrides).filter((key) =>
            isForbiddenKey(
              key,
              REPAIR_AND_CONFIG_KEYS,
              REPAIR_AND_CONFIG_PREFIXES,
            ),
          );
          expect(themedRepairKeys).toEqual([]);
        },
      );
    },
  );

  // @rework-house-locale @FR6
  f.Scenario(
    "Overrides keep the placeholders of their base phrases",
    ({ Then }) => {
      Then(
        "every override contains exactly the placeholders of its base value",
        (_ctx: TestContext) => {
          for (const [key, value] of Object.entries(houseOverrides)) {
            const baseValue = ruFlat[key];
            if (baseValue === undefined) continue; // orphans covered by FR1
            expect({ key, placeholders: extractPlaceholders(value) }).toEqual({
              key,
              placeholders: extractPlaceholders(baseValue),
            });
          }
        },
      );
    },
  );

  // @rework-house-locale @FR7
  f.Scenario("Locale metadata identifies the dialect", ({ Then }) => {
    Then(
      'house locale metadata declares code "house" with base language "ru"',
      (_ctx: TestContext) => {
        expect(houseLocale._meta).toEqual({
          code: "house",
          name: "Dr. House",
          nativeName: "Доктор Хаус",
          baseLanguage: "ru",
          emoji: "🏥",
        });
      },
    );
  });

  // @rework-house-locale @FR8
  f.Scenario("The user is addressed with capitalized Вы", ({ Then }) => {
    Then(
      "no override contains a lowercase direct-address pronoun",
      (_ctx: TestContext) => {
        const lowercaseAddressKeys = Object.entries(houseOverrides)
          .filter(([, value]) => LOWERCASE_ADDRESS_REGEX.test(value))
          .map(([key]) => key);
        expect(lowercaseAddressKeys).toEqual([]);
      },
    );
  });

  // @rework-house-locale @FR1 @FR2 @FR3
  f.Scenario("Locale content equals the normative inventory", ({ Then }) => {
    Then(
      "the house overrides equal the normative phrase inventory exactly",
      (_ctx: TestContext) => {
        expect(houseOverrides).toEqual(HOUSE_LOCALE_INVENTORY);
      },
    );
  });
});
