// implements FR1-FR9 of add-startrek-locale
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import ruLocale from "@/locales/ru.json";
import startrekLocale from "@/locales/startrek.json";
import {
  ACCESSIBILITY_ONLY_KEYS,
  ACCESSIBILITY_ONLY_PREFIXES,
  extractPlaceholders,
  flattenLocale,
  hasMidSentenceCapitalizedCaptain,
  isForbiddenKey,
  LOWERCASE_ADDRESS_REGEX,
  REPAIR_AND_CONFIG_KEYS,
  REPAIR_AND_CONFIG_PREFIXES,
  SYNC_KEY_PREFIX,
  SYNC_LENGTH_BUDGET,
  withoutMetaKeys,
} from "./startrek_locale.helpers";
import { STARTREK_LOCALE_INVENTORY } from "./startrek_locale.inventory";

const feature = await loadFeature("../startrek_locale.feature");

type LocaleValueRow = { key: string; value: string };
type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let startrekOverrides: Record<string, string>;
  let ruFlat: Record<string, string>;

  f.Background(({ Given }) => {
    Given(
      'the "startrek" and "ru" locale files are flattened',
      (_ctx: TestContext) => {
        startrekOverrides = withoutMetaKeys(
          flattenLocale(startrekLocale as Record<string, unknown>),
        );
        ruFlat = flattenLocale(ruLocale as Record<string, unknown>);
        expect(Object.keys(startrekOverrides).length).toBeGreaterThan(0);
      },
    );
  });

  // @add-startrek-locale @FR1
  f.Scenario(
    "Locale carries only phrases that differ from the base",
    ({ Then }) => {
      Then(
        "no startrek override has a value identical to its base value",
        (_ctx: TestContext) => {
          const redundantKeys = Object.entries(startrekOverrides)
            .filter(([key, value]) => ruFlat[key] === value)
            .map(([key]) => key);
          expect(redundantKeys).toEqual([]);
        },
      );
    },
  );

  // @add-startrek-locale @FR1
  f.Scenario("Every override exists in the base locale", ({ Then }) => {
    Then(
      "every startrek override key exists in the base locale",
      (_ctx: TestContext) => {
        const orphanKeys = Object.keys(startrekOverrides).filter(
          (key) => !(key in ruFlat),
        );
        expect(orphanKeys).toEqual([]);
      },
    );
  });

  // @add-startrek-locale @FR2
  f.Scenario("Entity pages follow the starship glossary", ({ Then }) => {
    Then("the startrek locale values are:", (_ctx: TestContext, table) => {
      const rows = (Array.isArray(table) ? table : []) as LocaleValueRow[];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(startrekOverrides[row.key]).toBe(row.value);
      }
    });
  });

  // @add-startrek-locale @FR3
  f.Scenario("Deletion verbs follow the verb system", ({ Then }) => {
    Then("the startrek locale values are:", (_ctx: TestContext, table) => {
      const rows = (Array.isArray(table) ? table : []) as LocaleValueRow[];
      expect(rows.length).toBeGreaterThan(0);
      for (const row of rows) {
        expect(startrekOverrides[row.key]).toBe(row.value);
      }
    });
  });

  // @add-startrek-locale @FR4
  f.Scenario("Accessibility strings keep their base wording", ({ Then }) => {
    Then("no accessibility-only key is overridden", (_ctx: TestContext) => {
      const themedAccessibilityKeys = Object.keys(startrekOverrides).filter(
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

  // @add-startrek-locale @FR5
  f.Scenario(
    "Data-repair and configuration instructions keep their base wording",
    ({ Then }) => {
      Then(
        "no data-repair or configuration key is overridden",
        (_ctx: TestContext) => {
          const themedRepairKeys = Object.keys(startrekOverrides).filter(
            (key) =>
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

  // @add-startrek-locale @FR6
  f.Scenario(
    "Overrides keep the placeholders of their base phrases",
    ({ Then }) => {
      Then(
        "every override contains exactly the placeholders of its base value",
        (_ctx: TestContext) => {
          for (const [key, value] of Object.entries(startrekOverrides)) {
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

  // @add-startrek-locale @FR7
  f.Scenario("Locale metadata identifies the dialect", ({ Then }) => {
    Then(
      'startrek locale metadata declares code "startrek" with base language "ru" and emoji "🖖"',
      (_ctx: TestContext) => {
        expect(startrekLocale._meta).toEqual({
          code: "startrek",
          name: "Star Trek",
          nativeName: "Звёздный путь",
          baseLanguage: "ru",
          emoji: "🖖",
        });
      },
    );
  });

  // @add-startrek-locale @FR8
  f.Scenario("The user is addressed with capitalized Вы", ({ Then }) => {
    Then(
      "no override contains a lowercase direct-address pronoun",
      (_ctx: TestContext) => {
        const lowercaseAddressKeys = Object.entries(startrekOverrides)
          .filter(([, value]) => LOWERCASE_ADDRESS_REGEX.test(value))
          .map(([key]) => key);
        expect(lowercaseAddressKeys).toEqual([]);
      },
    );
  });

  // @add-startrek-locale @FR8
  f.Scenario("The captain address stays lowercase mid-sentence", ({ Then }) => {
    Then(
      "every override addressing «капитан» mid-sentence writes it in lowercase",
      (_ctx: TestContext) => {
        const capitalizedCaptainKeys = Object.entries(startrekOverrides)
          .filter(([, value]) => hasMidSentenceCapitalizedCaptain(value))
          .map(([key]) => key);
        expect(capitalizedCaptainKeys).toEqual([]);
      },
    );
  });

  // @add-startrek-locale @FR9
  f.Scenario(
    "Sync status strings stay within the length budget",
    ({ Then }) => {
      Then(
        "no themed sync string exceeds its base value by more than 10 characters",
        (_ctx: TestContext) => {
          const overBudgetKeys = Object.entries(startrekOverrides)
            .filter(([key]) => key.startsWith(SYNC_KEY_PREFIX) && key in ruFlat)
            .filter(
              ([key, value]) =>
                value.length > ruFlat[key].length + SYNC_LENGTH_BUDGET,
            )
            .map(([key]) => key);
          expect(overBudgetKeys).toEqual([]);
        },
      );
    },
  );

  // @add-startrek-locale @FR1 @FR2 @FR3
  f.Scenario("Locale content equals the normative inventory", ({ Then }) => {
    Then(
      "the startrek overrides equal the normative phrase inventory exactly",
      (_ctx: TestContext) => {
        expect(startrekOverrides).toEqual(STARTREK_LOCALE_INVENTORY);
      },
    );
  });
});
