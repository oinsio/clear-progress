// implements FR9-FR15 of linkify-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { shortenUrl } from "@/utils/linkify";

const feature = await loadFeature("../linkify_shorten_url.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @linkify-spec @FR9
    f.Scenario("www prefix is removed from hostname", ({ When, Then }) => {
      let shortenedResult: string;

      When(
        'shortenUrl is called with "https://www.example.com/path"',
        (_ctx: TestContext) => {
          shortenedResult = shortenUrl("https://www.example.com/path");
        },
      );

      Then(
        'the shortened result is "example.com/path"',
        (_ctx: TestContext) => {
          expect(shortenedResult).toBe("example.com/path");
        },
      );
    });

    // @linkify-spec @FR10
    f.Scenario("Trailing slash is removed from path", ({ When, Then }) => {
      let shortenedResult: string;

      When(
        'shortenUrl is called with "https://example.com/path/"',
        (_ctx: TestContext) => {
          shortenedResult = shortenUrl("https://example.com/path/");
        },
      );

      Then(
        'the shortened result is "example.com/path"',
        (_ctx: TestContext) => {
          expect(shortenedResult).toBe("example.com/path");
        },
      );
    });

    // @linkify-spec @FR11
    f.Scenario(
      "Three-segment path is abbreviated with ellipsis",
      ({ When, Then }) => {
        let shortenedResult: string;

        When(
          'shortenUrl is called with "https://example.com/first/middle/last"',
          (_ctx: TestContext) => {
            shortenedResult = shortenUrl(
              "https://example.com/first/middle/last",
            );
          },
        );

        Then(
          'the shortened result is "example.com/first/…/last"',
          (_ctx: TestContext) => {
            expect(shortenedResult).toBe("example.com/first/…/last");
          },
        );
      },
    );

    // @linkify-spec @FR11
    f.Scenario(
      "Four-segment path with query and hash is abbreviated",
      ({ When, Then }) => {
        let shortenedResult: string;

        When(
          'shortenUrl is called with "https://www.example.com/a/b/c/d?foo=bar#section"',
          (_ctx: TestContext) => {
            shortenedResult = shortenUrl(
              "https://www.example.com/a/b/c/d?foo=bar#section",
            );
          },
        );

        Then(
          'the shortened result is "example.com/a/…/d"',
          (_ctx: TestContext) => {
            expect(shortenedResult).toBe("example.com/a/…/d");
          },
        );
      },
    );

    // @linkify-spec @FR12
    f.Scenario("Single-segment path is kept intact", ({ When, Then }) => {
      let shortenedResult: string;

      When(
        'shortenUrl is called with "https://example.com/path"',
        (_ctx: TestContext) => {
          shortenedResult = shortenUrl("https://example.com/path");
        },
      );

      Then(
        'the shortened result is "example.com/path"',
        (_ctx: TestContext) => {
          expect(shortenedResult).toBe("example.com/path");
        },
      );
    });

    // @linkify-spec @FR12
    f.Scenario("Two-segment path is kept intact", ({ When, Then }) => {
      let shortenedResult: string;

      When(
        'shortenUrl is called with "https://example.com/first/second"',
        (_ctx: TestContext) => {
          shortenedResult = shortenUrl("https://example.com/first/second");
        },
      );

      Then(
        'the shortened result is "example.com/first/second"',
        (_ctx: TestContext) => {
          expect(shortenedResult).toBe("example.com/first/second");
        },
      );
    });

    // @linkify-spec @FR13
    f.Scenario(
      "Query parameters are omitted from display",
      ({ When, Then }) => {
        let shortenedResult: string;

        When(
          'shortenUrl is called with "https://example.com/path?foo=bar&baz=qux"',
          (_ctx: TestContext) => {
            shortenedResult = shortenUrl(
              "https://example.com/path?foo=bar&baz=qux",
            );
          },
        );

        Then(
          'the shortened result is "example.com/path"',
          (_ctx: TestContext) => {
            expect(shortenedResult).toBe("example.com/path");
          },
        );
      },
    );

    // @linkify-spec @FR13
    f.Scenario("Hash fragment is omitted from display", ({ When, Then }) => {
      let shortenedResult: string;

      When(
        'shortenUrl is called with "https://example.com/path#section"',
        (_ctx: TestContext) => {
          shortenedResult = shortenUrl("https://example.com/path#section");
        },
      );

      Then(
        'the shortened result is "example.com/path"',
        (_ctx: TestContext) => {
          expect(shortenedResult).toBe("example.com/path");
        },
      );
    });

    // @linkify-spec @FR14
    f.Scenario("URL without path shows hostname only", ({ When, Then }) => {
      let shortenedResult: string;

      When(
        'shortenUrl is called with "https://example.com"',
        (_ctx: TestContext) => {
          shortenedResult = shortenUrl("https://example.com");
        },
      );

      Then('the shortened result is "example.com"', (_ctx: TestContext) => {
        expect(shortenedResult).toBe("example.com");
      });
    });

    // @linkify-spec @FR14
    f.Scenario(
      "URL with only trailing slash shows hostname only",
      ({ When, Then }) => {
        let shortenedResult: string;

        When(
          'shortenUrl is called with "https://example.com/"',
          (_ctx: TestContext) => {
            shortenedResult = shortenUrl("https://example.com/");
          },
        );

        Then('the shortened result is "example.com"', (_ctx: TestContext) => {
          expect(shortenedResult).toBe("example.com");
        });
      },
    );

    // @linkify-spec @FR15
    f.Scenario(
      "Invalid URL falls back to removing protocol",
      ({ When, Then }) => {
        let shortenedResult: string;

        When(
          'shortenUrl is called with "not-a-valid-url"',
          (_ctx: TestContext) => {
            shortenedResult = shortenUrl("not-a-valid-url");
          },
        );

        Then(
          'the shortened result is "not-a-valid-url"',
          (_ctx: TestContext) => {
            expect(shortenedResult).toBe("not-a-valid-url");
          },
        );
      },
    );
  },
);
