// implements FR16-FR22 of linkify-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import React from "react";
import { expect, type TestContext, vi } from "vitest";
import { LinkedText } from "@/components/ui/LinkedText";

const feature = await loadFeature("../linkify_linked_text.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let container: HTMLElement;
    let rootElement: ChildNode | null;
    let links: HTMLElement[];

    // @linkify-spec @FR16
    f.Scenario(
      "Text without URLs renders as plain text",
      ({ When, Then, And }) => {
        When(
          'LinkedText is rendered with text "Just plain text"',
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(LinkedText, { text: "Just plain text" }),
            );
            container = renderResult.container;
            rootElement = container.firstChild;
            links = within(container).queryAllByRole("link");
          },
        );

        Then('the text "Just plain text" is visible', (_ctx: TestContext) => {
          expect(rootElement).toHaveTextContent("Just plain text");
        });

        And("no link elements are present", (_ctx: TestContext) => {
          expect(links).toHaveLength(0);
        });
      },
    );

    // @linkify-spec @FR17
    f.Scenario(
      "URL renders as anchor with security attributes",
      ({ When, Then, And }) => {
        let link: HTMLElement;

        When(
          'LinkedText is rendered with text "Visit https://example.com for details"',
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(LinkedText, {
                text: "Visit https://example.com for details",
              }),
            );
            container = renderResult.container;
            link = within(container).getByRole("link");
          },
        );

        Then(
          'a link element is present with href "https://example.com"',
          (_ctx: TestContext) => {
            expect(link).toHaveAttribute("href", "https://example.com");
          },
        );

        And('the link has target "_blank"', (_ctx: TestContext) => {
          expect(link).toHaveAttribute("target", "_blank");
        });

        And('the link has rel "noopener noreferrer"', (_ctx: TestContext) => {
          expect(link).toHaveAttribute("rel", "noopener noreferrer");
        });
      },
    );

    // @linkify-spec @FR17
    f.Scenario(
      "Multiple URLs render as separate links",
      ({ When, Then, And }) => {
        When(
          'LinkedText is rendered with text "Visit https://example.com and https://test.org"',
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(LinkedText, {
                text: "Visit https://example.com and https://test.org",
              }),
            );
            container = renderResult.container;
            links = within(container).getAllByRole("link");
          },
        );

        Then("2 link elements are present", (_ctx: TestContext) => {
          expect(links).toHaveLength(2);
        });

        And('link 1 has href "https://example.com"', (_ctx: TestContext) => {
          expect(links[0]).toHaveAttribute("href", "https://example.com");
        });

        And('link 2 has href "https://test.org"', (_ctx: TestContext) => {
          expect(links[1]).toHaveAttribute("href", "https://test.org");
        });
      },
    );

    // @linkify-spec @FR18
    f.Scenario(
      "Long URL is displayed with shortened text",
      ({ When, Then }) => {
        let link: HTMLElement;

        When(
          'LinkedText is rendered with text "Visit https://www.example.com/very/long/path"',
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(LinkedText, {
                text: "Visit https://www.example.com/very/long/path",
              }),
            );
            container = renderResult.container;
            link = within(container).getByRole("link");
          },
        );

        Then(
          'the link text content includes "example.com/very/…/path"',
          (_ctx: TestContext) => {
            expect(link).toHaveTextContent("example.com/very/…/path");
          },
        );
      },
    );

    // @linkify-spec @FR19
    f.Scenario("Full URL is shown in title attribute", ({ When, Then }) => {
      let link: HTMLElement;

      When(
        'LinkedText is rendered with text "Visit https://example.com/path"',
        (_ctx: TestContext) => {
          const renderResult = render(
            React.createElement(LinkedText, {
              text: "Visit https://example.com/path",
            }),
          );
          container = renderResult.container;
          link = within(container).getByRole("link");
        },
      );

      Then(
        'the link has title attribute "https://example.com/path"',
        (_ctx: TestContext) => {
          expect(link).toHaveAttribute("title", "https://example.com/path");
        },
      );
    });

    // @linkify-spec @FR20
    f.Scenario(
      "Link click does not propagate to parent",
      ({ Given, When, Then }) => {
        const handleParentClick = vi.fn();
        let link: HTMLElement;

        Given(
          'a LinkedText with text "Visit https://example.com" inside a clickable parent',
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(
                "div",
                { onClick: handleParentClick },
                React.createElement(LinkedText, {
                  text: "Visit https://example.com",
                }),
              ),
            );
            container = renderResult.container;
            link = within(container).getByRole("link");
          },
        );

        When("the link is clicked", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          await user.click(link);
        });

        Then(
          "the parent onClick handler is not called",
          (_ctx: TestContext) => {
            expect(handleParentClick).not.toHaveBeenCalled();
          },
        );
      },
    );

    // @linkify-spec @FR21
    f.Scenario("Empty text renders an empty element", ({ When, Then }) => {
      When('LinkedText is rendered with text ""', (_ctx: TestContext) => {
        const renderResult = render(
          React.createElement(LinkedText, { text: "" }),
        );
        container = renderResult.container;
        rootElement = container.firstChild;
      });

      Then("the rendered element is empty", (_ctx: TestContext) => {
        expect(rootElement).toBeEmptyDOMElement();
      });
    });

    // @linkify-spec @FR22
    f.Scenario(
      "Custom className is applied to root element",
      ({ When, Then }) => {
        When(
          'LinkedText is rendered with text "Plain text" and className "custom-class"',
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(LinkedText, {
                text: "Plain text",
                className: "custom-class",
              }),
            );
            container = renderResult.container;
            rootElement = container.firstChild;
          },
        );

        Then(
          'the root element has class "custom-class"',
          (_ctx: TestContext) => {
            expect(rootElement).toHaveClass("custom-class");
          },
        );
      },
    );
  },
);
