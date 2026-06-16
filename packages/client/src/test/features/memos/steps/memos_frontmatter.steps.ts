// implements FR10 of add-memos
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { parseFrontmatter } from "@/content/memos/parseFrontmatter";

const feature = await loadFeature("../memos_frontmatter.feature");

const VALID_MEMO = `---
title: Task Review
description: Daily review
icon: refresh-cw
order: 2
---
# Review content

Some body text.`;

const MEMO_WITHOUT_DELIMITERS = `# Just markdown
No frontmatter here`;

const MEMO_MISSING_TITLE = `---
description: Daily review
icon: refresh-cw
order: 2
---
# Review`;

const MEMO_NON_INTEGER_ORDER = `---
title: Bad
description: Bad memo
icon: x
order: first
---
# Bad`;

type FrontmatterContext = {
  rawContent: string;
  parseResult: ReturnType<typeof parseFrontmatter>;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FrontmatterContext>) => {
    // @add-memos @FR10
    f.Scenario(
      "Valid frontmatter parsed correctly",
      ({ Given, When, Then, And }) => {
        let rawContent: string;
        let parseResult: ReturnType<typeof parseFrontmatter>;

        Given("a memo with valid frontmatter", (_ctx: TestContext) => {
          rawContent = VALID_MEMO;
        });

        When("the frontmatter is parsed", (_ctx: TestContext) => {
          parseResult = parseFrontmatter(rawContent);
        });

        Then("all attributes are extracted", (_ctx: TestContext) => {
          expect(parseResult).not.toBeNull();
          expect(parseResult?.attributes.title).toBe("Task Review");
          expect(parseResult?.attributes.description).toBe("Daily review");
          expect(parseResult?.attributes.icon).toBe("refresh-cw");
          expect(parseResult?.attributes.order).toBe("2");
        });

        And("the body content is extracted", (_ctx: TestContext) => {
          expect(parseResult?.body).toContain("# Review content");
          expect(parseResult?.body).toContain("Some body text.");
        });
      },
    );

    // @add-memos @FR10
    f.Scenario(
      "Missing frontmatter delimiters returns null",
      ({ Given, When, Then }) => {
        let rawContent: string;
        let parseResult: ReturnType<typeof parseFrontmatter>;

        Given("a memo without frontmatter delimiters", (_ctx: TestContext) => {
          rawContent = MEMO_WITHOUT_DELIMITERS;
        });

        When("the frontmatter is parsed", (_ctx: TestContext) => {
          parseResult = parseFrontmatter(rawContent);
        });

        Then("null is returned", (_ctx: TestContext) => {
          expect(parseResult).toBeNull();
        });
      },
    );

    // @add-memos @FR10
    f.Scenario(
      "Missing required field returns null",
      ({ Given, When, Then }) => {
        let rawContent: string;
        let parseResult: ReturnType<typeof parseFrontmatter>;

        Given("a memo with missing title field", (_ctx: TestContext) => {
          rawContent = MEMO_MISSING_TITLE;
        });

        When("the frontmatter is parsed", (_ctx: TestContext) => {
          parseResult = parseFrontmatter(rawContent);
        });

        Then("null is returned", (_ctx: TestContext) => {
          expect(parseResult).toBeNull();
        });
      },
    );

    // @add-memos @FR10
    f.Scenario(
      "Non-integer order field returns null",
      ({ Given, When, Then }) => {
        let rawContent: string;
        let parseResult: ReturnType<typeof parseFrontmatter>;

        Given("a memo with non-integer order field", (_ctx: TestContext) => {
          rawContent = MEMO_NON_INTEGER_ORDER;
        });

        When("the frontmatter is parsed", (_ctx: TestContext) => {
          parseResult = parseFrontmatter(rawContent);
        });

        Then("null is returned", (_ctx: TestContext) => {
          expect(parseResult).toBeNull();
        });
      },
    );
  },
);
