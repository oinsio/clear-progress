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

const feature = await loadFeature("../goal_cover_picker_a11y.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams) => {
  f.BeforeEachScenario(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // @miss-ui-specs @NFR-A2
  f.Scenario("Picker button has aria-label", ({ When, Then }) => {
    When("GoalCoverPicker is rendered", (_ctx: TestContext) => {
      renderPicker(null);
    });

    Then(
      'the picker button has aria-label "goal.cover.choose"',
      (_ctx: TestContext) => {
        const pickerButton = screen.getByTestId("cover-picker-button");
        expect(pickerButton).toHaveAttribute("aria-label", "goal.cover.choose");
      },
    );
  });

  // @miss-ui-specs @NFR-A2
  f.Scenario("Default SVG placeholder is decorative", ({ When, Then, And }) => {
    When("GoalCoverPicker is rendered with no preview", (_ctx: TestContext) => {
      renderPicker(null);
    });

    Then('the default image has aria-hidden "true"', (_ctx: TestContext) => {
      const defaultImage = screen.getByTestId("cover-default-img");
      expect(defaultImage).toHaveAttribute("aria-hidden", "true");
    });

    And("the default image has empty alt text", (_ctx: TestContext) => {
      const defaultImage = screen.getByTestId("cover-default-img");
      expect(defaultImage).toHaveAttribute("alt", "");
    });
  });

  // @miss-ui-specs @NFR-A2
  f.Scenario("Remove button has aria-label", ({ When, Then }) => {
    When(
      "GoalCoverPicker is rendered with a preview image",
      (_ctx: TestContext) => {
        renderPicker("https://example.com/cover.jpg");
      },
    );

    Then(
      'the remove button has aria-label "goal.cover.remove"',
      (_ctx: TestContext) => {
        const removeButton = screen.getByTestId("cover-remove-button");
        expect(removeButton).toHaveAttribute("aria-label", "goal.cover.remove");
      },
    );
  });

  // @miss-ui-specs @NFR-A2
  f.Scenario("X icon is decorative", ({ When, Then }) => {
    When(
      "GoalCoverPicker is rendered with a preview image",
      (_ctx: TestContext) => {
        renderPicker("https://example.com/cover.jpg");
      },
    );

    Then('the X icon SVG has aria-hidden "true"', (_ctx: TestContext) => {
      const removeButton = screen.getByTestId("cover-remove-button");
      const xIconSvg = removeButton.querySelector("svg");
      expect(xIconSvg).not.toBeNull();
      expect(xIconSvg).toHaveAttribute("aria-hidden", "true");
    });
  });
});
