// implements FR1, FR2 of repeating-tasks-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import i18n from "i18next";
import { expect, type TestContext } from "vitest";
import type { RepeatRule } from "@/types/common";
import {
  formatRepeatRuleLabel,
  parseRepeatRule,
  serializeRepeatRule,
} from "@/utils/repeatRule";

const feature = await loadFeature("../repeat_rule_parsing.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let inputJson: string;
  let parsedResult: RepeatRule | null;
  let serializedResult: string;
  let formattedLabel: string;
  let ruleUnderTest: RepeatRule;

  // @repeating-tasks-specs @FR1
  f.Scenario("Parse valid fixed daily rule", ({ Given, When, Then, And }) => {
    Given("JSON string with fixed daily rule", (_ctx: TestContext) => {
      inputJson = JSON.stringify({
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      });
    });

    When("repeat rule is parsed", (_ctx: TestContext) => {
      parsedResult = parseRepeatRule(inputJson);
    });

    Then('result has type "fixed"', (_ctx: TestContext) => {
      expect(parsedResult?.type).toBe("fixed");
    });

    And('result has frequency "daily"', (_ctx: TestContext) => {
      expect(parsedResult?.type === "fixed" && parsedResult.frequency).toBe(
        "daily",
      );
    });

    And("result has interval 1", (_ctx: TestContext) => {
      expect(parsedResult?.type === "fixed" && parsedResult.interval).toBe(1);
    });
  });

  // @repeating-tasks-specs @FR1
  f.Scenario(
    "Parse valid after_completion rule",
    ({ Given, When, Then, And }) => {
      Given(
        "JSON string with after_completion rule and delay_days 3",
        (_ctx: TestContext) => {
          inputJson = JSON.stringify({
            type: "after_completion",
            delay_days: 3,
            target_box: "inbox",
            advance_days: 0,
          });
        },
      );

      When("repeat rule is parsed", (_ctx: TestContext) => {
        parsedResult = parseRepeatRule(inputJson);
      });

      Then('result has type "after_completion"', (_ctx: TestContext) => {
        expect(parsedResult?.type).toBe("after_completion");
      });

      And("result has delay_days 3", (_ctx: TestContext) => {
        expect(
          parsedResult?.type === "after_completion" && parsedResult.delay_days,
        ).toBe(3);
      });
    },
  );

  // @repeating-tasks-specs @FR1
  f.Scenario("Parse empty string returns null", ({ Given, When, Then }) => {
    Given("an empty string", (_ctx: TestContext) => {
      inputJson = "";
    });

    When("repeat rule is parsed", (_ctx: TestContext) => {
      parsedResult = parseRepeatRule(inputJson);
    });

    Then("result is null", (_ctx: TestContext) => {
      expect(parsedResult).toBeNull();
    });
  });

  // @repeating-tasks-specs @FR1
  f.Scenario("Parse invalid JSON returns null", ({ Given, When, Then }) => {
    Given('invalid JSON string "{not valid}"', (_ctx: TestContext) => {
      inputJson = "{not valid}";
    });

    When("repeat rule is parsed", (_ctx: TestContext) => {
      parsedResult = parseRepeatRule(inputJson);
    });

    Then("result is null", (_ctx: TestContext) => {
      expect(parsedResult).toBeNull();
    });
  });

  // @repeating-tasks-specs @FR1
  f.Scenario(
    "Parse JSON failing Zod validation returns null",
    ({ Given, When, Then }) => {
      Given("JSON string with unknown type", (_ctx: TestContext) => {
        inputJson = JSON.stringify({ type: "unknown_type" });
      });

      When("repeat rule is parsed", (_ctx: TestContext) => {
        parsedResult = parseRepeatRule(inputJson);
      });

      Then("result is null", (_ctx: TestContext) => {
        expect(parsedResult).toBeNull();
      });
    },
  );

  // @repeating-tasks-specs @FR2
  f.Scenario("Serialize a fixed daily rule", ({ Given, When, Then }) => {
    Given("a fixed daily repeat rule with interval 1", (_ctx: TestContext) => {
      ruleUnderTest = {
        type: "fixed",
        frequency: "daily",
        interval: 1,
        target_box: "today",
        advance_days: 0,
      };
    });

    When("repeat rule is serialized", (_ctx: TestContext) => {
      serializedResult = serializeRepeatRule(ruleUnderTest);
    });

    Then(
      "result is valid JSON string matching the rule",
      (_ctx: TestContext) => {
        expect(JSON.parse(serializedResult)).toEqual(ruleUnderTest);
      },
    );
  });

  // @repeating-tasks-specs @FR2
  f.Scenario(
    "Format label for daily with interval 1",
    ({ Given, When, Then }) => {
      Given(
        "a fixed daily repeat rule with interval 1",
        (_ctx: TestContext) => {
          ruleUnderTest = {
            type: "fixed",
            frequency: "daily",
            interval: 1,
            target_box: "today",
            advance_days: 0,
          };
        },
      );

      When("repeat rule label is formatted", async (_ctx: TestContext) => {
        await i18n.changeLanguage("en");
        const t = i18n.t.bind(i18n);
        formattedLabel = formatRepeatRuleLabel(ruleUnderTest, t);
      });

      Then(
        'label uses i18n key "repeat.everyNDays" with count 1',
        (_ctx: TestContext) => {
          const expected = i18n.t("repeat.everyNDays", { count: 1 });
          expect(formattedLabel).toBe(expected);
        },
      );
    },
  );

  // @repeating-tasks-specs @FR2
  f.Scenario(
    "Format label for weekly with weekdays",
    ({ Given, When, Then }) => {
      Given(
        "a fixed weekly repeat rule with weekdays 1, 3, 5",
        (_ctx: TestContext) => {
          ruleUnderTest = {
            type: "fixed",
            frequency: "weekly",
            interval: 1,
            weekdays: [1, 3, 5],
            target_box: "today",
            advance_days: 0,
          };
        },
      );

      When("repeat rule label is formatted", async (_ctx: TestContext) => {
        await i18n.changeLanguage("en");
        const t = i18n.t.bind(i18n);
        formattedLabel = formatRepeatRuleLabel(ruleUnderTest, t);
      });

      Then("label includes translated weekday names", (_ctx: TestContext) => {
        const weekday1 = i18n.t("repeat.weekday1");
        const weekday3 = i18n.t("repeat.weekday3");
        const weekday5 = i18n.t("repeat.weekday5");
        expect(formattedLabel).toContain(weekday1);
        expect(formattedLabel).toContain(weekday3);
        expect(formattedLabel).toContain(weekday5);
      });
    },
  );

  // @repeating-tasks-specs @FR2
  f.Scenario("Format label for after_completion", ({ Given, When, Then }) => {
    Given(
      "an after_completion repeat rule with delay_days 5",
      (_ctx: TestContext) => {
        ruleUnderTest = {
          type: "after_completion",
          delay_days: 5,
          target_box: "inbox",
          advance_days: 0,
        };
      },
    );

    When("repeat rule label is formatted", async (_ctx: TestContext) => {
      await i18n.changeLanguage("en");
      const t = i18n.t.bind(i18n);
      formattedLabel = formatRepeatRuleLabel(ruleUnderTest, t);
    });

    Then(
      'label uses i18n key "repeat.afterCompletion" with count 5',
      (_ctx: TestContext) => {
        const expected = i18n.t("repeat.afterCompletion", { count: 5 });
        expect(formattedLabel).toBe(expected);
      },
    );
  });
});
