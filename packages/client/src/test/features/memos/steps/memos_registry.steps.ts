// implements FR4, FR8, FR9, FR13 of add-memos
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { afterEach, beforeEach, expect, type TestContext, vi } from "vitest";
import type { MemoEntry } from "@/content/memos";

const feature = await loadFeature("../memos_registry.feature");

const VALID_MEMO_RU_REVIEW = `---
title: Обзор задач
description: Ежедневный обзор
icon: refresh-cw
order: 2
---
# Обзор`;

const VALID_MEMO_RU_PLANNING = `---
title: Планирование
description: Модель планирования
icon: map
order: 1
---
# Планирование`;

const VALID_MEMO_EN_REVIEW = `---
title: Task Review
description: Daily review
icon: refresh-cw
order: 2
---
# Review`;

const VALID_MEMO_EN_PLANNING = `---
title: Natural Planning
description: Planning model
icon: map
order: 1
---
# Planning`;

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  beforeEach(() => vi.resetModules());
  afterEach(() => vi.restoreAllMocks());

  async function setupRegistry(
    globFiles: Record<string, string>,
  ): Promise<(baseLanguage: string) => MemoEntry[]> {
    vi.doMock("@/content/memos/memoGlobImport", () => ({
      memoGlobImport: globFiles,
    }));
    const registryModule = await import("@/content/memos");
    return registryModule.getMemos;
  }

  // @add-memos @FR8
  f.Scenario(
    "Memos discovered from glob result",
    ({ Given, When, Then, And }) => {
      let globResult: Record<string, string>;
      let getMemosFn: (baseLanguage: string) => MemoEntry[];

      Given(
        'a glob result with valid memo files for "ru" and "en"',
        (_ctx: TestContext) => {
          globResult = {
            "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
            "./en/task-review.md": VALID_MEMO_EN_REVIEW,
          };
        },
      );

      When("the registry is built", async (_ctx: TestContext) => {
        getMemosFn = await setupRegistry(globResult);
      });

      Then('memos are available for language "ru"', (_ctx: TestContext) => {
        const memos = getMemosFn("ru");
        expect(memos.length).toBeGreaterThan(0);
      });

      And('memos are available for language "en"', (_ctx: TestContext) => {
        const memos = getMemosFn("en");
        expect(memos.length).toBeGreaterThan(0);
      });
    },
  );

  // @add-memos @FR4
  f.Scenario(
    "Memos sorted by order field ascending",
    ({ Given, When, Then, And }) => {
      let globResult: Record<string, string>;
      let getMemosFn: (baseLanguage: string) => MemoEntry[];

      Given(
        'a glob result with memos having order 2 and order 1 for "ru"',
        (_ctx: TestContext) => {
          globResult = {
            "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
            "./ru/natural-planning.md": VALID_MEMO_RU_PLANNING,
          };
        },
      );

      When("the registry is built", async (_ctx: TestContext) => {
        getMemosFn = await setupRegistry(globResult);
      });

      Then('the first memo for "ru" has order 1', (_ctx: TestContext) => {
        const memos = getMemosFn("ru");
        expect(memos[0].order).toBe(1);
      });

      And('the second memo for "ru" has order 2', (_ctx: TestContext) => {
        const memos = getMemosFn("ru");
        expect(memos[1].order).toBe(2);
      });
    },
  );

  // @add-memos @FR9
  f.Scenario(
    "Language selection returns memos for requested language",
    ({ Given, When, Then }) => {
      let getMemosFn: (baseLanguage: string) => MemoEntry[];
      let resultMemos: MemoEntry[];

      Given(
        "a glob result with Russian and English memos",
        (_ctx: TestContext) => {
          // setup deferred to When
        },
      );

      When('memos are requested for "ru"', async (_ctx: TestContext) => {
        getMemosFn = await setupRegistry({
          "./ru/task-review.md": VALID_MEMO_RU_REVIEW,
          "./en/task-review.md": VALID_MEMO_EN_REVIEW,
        });
        resultMemos = getMemosFn("ru");
      });

      Then("only Russian memos are returned", (_ctx: TestContext) => {
        expect(resultMemos).toHaveLength(1);
        expect(resultMemos[0].title).toBe("Обзор задач");
      });
    },
  );

  // @add-memos @FR13
  f.Scenario(
    "Fallback to default language when requested language missing",
    ({ Given, When, Then }) => {
      let getMemosFn: (baseLanguage: string) => MemoEntry[];
      let resultMemos: MemoEntry[];

      Given("a glob result with only English memos", (_ctx: TestContext) => {
        // setup deferred to When
      });

      When('memos are requested for "fr"', async (_ctx: TestContext) => {
        getMemosFn = await setupRegistry({
          "./en/task-review.md": VALID_MEMO_EN_REVIEW,
          "./en/natural-planning.md": VALID_MEMO_EN_PLANNING,
        });
        resultMemos = getMemosFn("fr");
      });

      Then("English memos are returned as fallback", (_ctx: TestContext) => {
        expect(resultMemos).toHaveLength(2);
        expect(resultMemos[0].title).toBe("Natural Planning");
      });
    },
  );

  // @add-memos @FR13
  f.Scenario("Empty array when no memos exist", ({ Given, When, Then }) => {
    let getMemosFn: (baseLanguage: string) => MemoEntry[];
    let resultMemos: MemoEntry[];

    Given("an empty glob result", (_ctx: TestContext) => {
      // setup deferred to When
    });

    When('memos are requested for "ru"', async (_ctx: TestContext) => {
      getMemosFn = await setupRegistry({});
      resultMemos = getMemosFn("ru");
    });

    Then("an empty array is returned", (_ctx: TestContext) => {
      expect(resultMemos).toEqual([]);
    });
  });
});
