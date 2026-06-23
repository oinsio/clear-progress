import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { expect, type TestContext, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/assets/default-goal-cover.svg", () => ({
  default: "default-cover.svg",
}));

import { GoalCoverPicker } from "@/components/goals/GoalCoverPicker";

function renderPicker(previewSrc: string | null) {
  return render(
    <GoalCoverPicker
      previewSrc={previewSrc}
      onFileSelect={vi.fn()}
      onRemove={vi.fn()}
    />,
  );
}

const feature = await loadFeature("../goal_cover_picker_display.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams) => {
  f.BeforeEachScenario(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // @miss-ui-specs @FR4
  f.Scenario("Default cover shown when no preview", ({ When, Then, And }) => {
    When(
      "GoalCoverPicker is rendered with no previewSrc",
      (_ctx: TestContext) => {
        renderPicker(null);
      },
    );

    Then("the default SVG placeholder is displayed", (_ctx: TestContext) => {
      const defaultImage = screen.getByTestId("cover-default-img");
      expect(defaultImage).toBeInTheDocument();
      expect(defaultImage).toHaveAttribute("src", "default-cover.svg");
    });

    And("no preview image is visible", (_ctx: TestContext) => {
      expect(screen.queryByTestId("cover-preview-img")).not.toBeInTheDocument();
    });
  });

  // @miss-ui-specs @FR4
  f.Scenario(
    "Preview image shown when previewSrc provided",
    ({ When, Then, And }) => {
      When(
        'GoalCoverPicker is rendered with previewSrc "https://example.com/cover.jpg"',
        (_ctx: TestContext) => {
          renderPicker("https://example.com/cover.jpg");
        },
      );

      Then(
        'the preview image is displayed with src "https://example.com/cover.jpg"',
        (_ctx: TestContext) => {
          const previewImage = screen.getByTestId("cover-preview-img");
          expect(previewImage).toBeInTheDocument();
          expect(previewImage).toHaveAttribute(
            "src",
            "https://example.com/cover.jpg",
          );
        },
      );

      And("no default SVG placeholder is visible", (_ctx: TestContext) => {
        expect(
          screen.queryByTestId("cover-default-img"),
        ).not.toBeInTheDocument();
      });
    },
  );

  // @miss-ui-specs @FR7
  f.Scenario("Remove button hidden when no cover", ({ When, Then }) => {
    When(
      "GoalCoverPicker is rendered with no previewSrc",
      (_ctx: TestContext) => {
        renderPicker(null);
      },
    );

    Then("no remove button is visible", (_ctx: TestContext) => {
      expect(
        screen.queryByTestId("cover-remove-button"),
      ).not.toBeInTheDocument();
    });
  });

  // @miss-ui-specs @FR7
  f.Scenario(
    "Remove button visible when cover is present",
    ({ When, Then }) => {
      When(
        'GoalCoverPicker is rendered with previewSrc "https://example.com/cover.jpg"',
        (_ctx: TestContext) => {
          renderPicker("https://example.com/cover.jpg");
        },
      );

      Then("the remove button is visible", (_ctx: TestContext) => {
        expect(screen.getByTestId("cover-remove-button")).toBeInTheDocument();
      });
    },
  );
});
