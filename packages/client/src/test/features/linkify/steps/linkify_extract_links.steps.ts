// implements FR1-FR8 of linkify-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { extractLinks, type LinkSegment } from "@/utils/linkify";

const feature = await loadFeature("../linkify_extract_links.feature");

type FeatureContext = {
  segments: LinkSegment[];
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @linkify-spec @FR1
    f.Scenario("Empty string produces no segments", ({ When, Then }) => {
      let segments: LinkSegment[];

      When('extractLinks is called with ""', (_ctx: TestContext) => {
        segments = extractLinks("");
      });

      Then("the result is an empty array", (_ctx: TestContext) => {
        expect(segments).toEqual([]);
      });
    });

    // @linkify-spec @FR2
    f.Scenario(
      "Text without URLs is a single text segment",
      ({ When, Then, And }) => {
        let segments: LinkSegment[];

        When(
          'extractLinks is called with "Just plain text without links"',
          (_ctx: TestContext) => {
            segments = extractLinks("Just plain text without links");
          },
        );

        Then("the result contains 1 segment", (_ctx: TestContext) => {
          expect(segments).toHaveLength(1);
        });

        And(
          'segment 1 has type "text" and value "Just plain text without links"',
          (_ctx: TestContext) => {
            expect(segments[0]).toEqual({
              type: "text",
              value: "Just plain text without links",
            });
          },
        );
      },
    );

    // @linkify-spec @FR3
    f.Scenario("HTTP URL is detected", ({ When, Then }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "Visit http://example.com"',
        (_ctx: TestContext) => {
          segments = extractLinks("Visit http://example.com");
        },
      );

      Then(
        'the result contains a URL segment with value "http://example.com"',
        (_ctx: TestContext) => {
          const urlSegments = segments.filter(
            (segment) => segment.type === "url",
          );
          expect(urlSegments).toContainEqual({
            type: "url",
            value: "http://example.com",
          });
        },
      );
    });

    // @linkify-spec @FR4
    f.Scenario("HTTPS URL is detected", ({ When, Then }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "Visit https://example.com"',
        (_ctx: TestContext) => {
          segments = extractLinks("Visit https://example.com");
        },
      );

      Then(
        'the result contains a URL segment with value "https://example.com"',
        (_ctx: TestContext) => {
          const urlSegments = segments.filter(
            (segment) => segment.type === "url",
          );
          expect(urlSegments).toContainEqual({
            type: "url",
            value: "https://example.com",
          });
        },
      );
    });

    // @linkify-spec @FR5
    f.Scenario("URL at start of text", ({ When, Then, And }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "https://example.com is the link"',
        (_ctx: TestContext) => {
          segments = extractLinks("https://example.com is the link");
        },
      );

      Then(
        'segment 1 has type "url" and value "https://example.com"',
        (_ctx: TestContext) => {
          expect(segments[0]).toEqual({
            type: "url",
            value: "https://example.com",
          });
        },
      );

      And(
        'segment 2 has type "text" and value " is the link"',
        (_ctx: TestContext) => {
          expect(segments[1]).toEqual({
            type: "text",
            value: " is the link",
          });
        },
      );
    });

    // @linkify-spec @FR5
    f.Scenario("URL in middle of text", ({ When, Then, And }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "Before https://example.com after"',
        (_ctx: TestContext) => {
          segments = extractLinks("Before https://example.com after");
        },
      );

      Then(
        'segment 1 has type "text" and value "Before "',
        (_ctx: TestContext) => {
          expect(segments[0]).toEqual({ type: "text", value: "Before " });
        },
      );

      And(
        'segment 2 has type "url" and value "https://example.com"',
        (_ctx: TestContext) => {
          expect(segments[1]).toEqual({
            type: "url",
            value: "https://example.com",
          });
        },
      );

      And(
        'segment 3 has type "text" and value " after"',
        (_ctx: TestContext) => {
          expect(segments[2]).toEqual({ type: "text", value: " after" });
        },
      );
    });

    // @linkify-spec @FR5
    f.Scenario("URL at end of text", ({ When, Then, And }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "The link is https://example.com"',
        (_ctx: TestContext) => {
          segments = extractLinks("The link is https://example.com");
        },
      );

      Then(
        'segment 1 has type "text" and value "The link is "',
        (_ctx: TestContext) => {
          expect(segments[0]).toEqual({
            type: "text",
            value: "The link is ",
          });
        },
      );

      And(
        'segment 2 has type "url" and value "https://example.com"',
        (_ctx: TestContext) => {
          expect(segments[1]).toEqual({
            type: "url",
            value: "https://example.com",
          });
        },
      );
    });

    // @linkify-spec @FR6
    f.Scenario("Multiple URLs are extracted", ({ When, Then, And }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "Visit https://example.com and https://test.org"',
        (_ctx: TestContext) => {
          segments = extractLinks(
            "Visit https://example.com and https://test.org",
          );
        },
      );

      Then("the result contains 4 segments", (_ctx: TestContext) => {
        expect(segments).toHaveLength(4);
      });

      And(
        'segment 2 has type "url" and value "https://example.com"',
        (_ctx: TestContext) => {
          expect(segments[1]).toEqual({
            type: "url",
            value: "https://example.com",
          });
        },
      );

      And(
        'segment 4 has type "url" and value "https://test.org"',
        (_ctx: TestContext) => {
          expect(segments[3]).toEqual({
            type: "url",
            value: "https://test.org",
          });
        },
      );
    });

    // @linkify-spec @FR7
    f.Scenario("URL with query parameters preserves them", ({ When, Then }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "Translate https://translate.google.com/?hl=ru&sl=en here"',
        (_ctx: TestContext) => {
          segments = extractLinks(
            "Translate https://translate.google.com/?hl=ru&sl=en here",
          );
        },
      );

      Then(
        'the result contains a URL segment with value "https://translate.google.com/?hl=ru&sl=en"',
        (_ctx: TestContext) => {
          const urlSegments = segments.filter(
            (segment) => segment.type === "url",
          );
          expect(urlSegments).toContainEqual({
            type: "url",
            value: "https://translate.google.com/?hl=ru&sl=en",
          });
        },
      );
    });

    // @linkify-spec @FR8
    f.Scenario("Trailing period is stripped from URL", ({ When, Then }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "See https://example.com."',
        (_ctx: TestContext) => {
          segments = extractLinks("See https://example.com.");
        },
      );

      Then(
        'the result contains a URL segment with value "https://example.com"',
        (_ctx: TestContext) => {
          const urlSegments = segments.filter(
            (segment) => segment.type === "url",
          );
          expect(urlSegments).toContainEqual({
            type: "url",
            value: "https://example.com",
          });
        },
      );
    });

    // @linkify-spec @FR8
    f.Scenario("Trailing comma is stripped from URL", ({ When, Then }) => {
      let segments: LinkSegment[];

      When(
        'extractLinks is called with "Also https://test.org, and more"',
        (_ctx: TestContext) => {
          segments = extractLinks("Also https://test.org, and more");
        },
      );

      Then(
        'the result contains a URL segment with value "https://test.org"',
        (_ctx: TestContext) => {
          const urlSegments = segments.filter(
            (segment) => segment.type === "url",
          );
          expect(urlSegments).toContainEqual({
            type: "url",
            value: "https://test.org",
          });
        },
      );
    });

    // @linkify-spec @FR8
    f.Scenario(
      "Trailing closing parenthesis is stripped from URL",
      ({ When, Then }) => {
        let segments: LinkSegment[];

        When(
          "extractLinks is called with text containing a URL followed by closing parenthesis",
          (_ctx: TestContext) => {
            segments = extractLinks("Link https://foo.bar) here");
          },
        );

        Then(
          'the result contains a URL segment with value "https://foo.bar"',
          (_ctx: TestContext) => {
            const urlSegments = segments.filter(
              (segment) => segment.type === "url",
            );
            expect(urlSegments).toContainEqual({
              type: "url",
              value: "https://foo.bar",
            });
          },
        );
      },
    );
  },
);
