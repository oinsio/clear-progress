import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
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

type FeatureContext = {
  mockOnFileSelect: ReturnType<typeof vi.fn>;
  mockOnRemove: ReturnType<typeof vi.fn>;
};

let context: FeatureContext;

function renderPicker(previewSrc: string | null) {
  context.mockOnFileSelect = vi.fn();
  context.mockOnRemove = vi.fn();
  return render(
    <GoalCoverPicker
      previewSrc={previewSrc}
      onFileSelect={context.mockOnFileSelect}
      onRemove={context.mockOnRemove}
    />,
  );
}

const feature = await loadFeature("../goal_cover_picker_interaction.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams) => {
  f.BeforeEachScenario(() => {
    cleanup();
    vi.clearAllMocks();
    context = {
      mockOnFileSelect: vi.fn(),
      mockOnRemove: vi.fn(),
    };
  });

  // @miss-ui-specs @FR5
  f.Scenario("File picker opens on button click", ({ When, Then }) => {
    When("user clicks the cover picker button", async (_ctx: TestContext) => {
      renderPicker(null);
      const input = screen.getByTestId("cover-file-input");
      vi.spyOn(input, "click");
      const pickerButton = screen.getByTestId("cover-picker-button");
      await userEvent.click(pickerButton);
    });

    Then("the hidden file input click is triggered", (_ctx: TestContext) => {
      const input = screen.getByTestId("cover-file-input");
      expect(input.click).toHaveBeenCalled();
    });
  });

  // @miss-ui-specs @FR6
  f.Scenario("File selection triggers callback", ({ When, Then }) => {
    When(
      "user selects an image file via the file picker",
      async (_ctx: TestContext) => {
        renderPicker(null);
        const file = new File(["content"], "photo.jpg", {
          type: "image/jpeg",
        });
        const input = screen.getByTestId("cover-file-input");
        await userEvent.upload(input, file);
      },
    );

    Then(
      "onFileSelect is called with the selected file",
      (_ctx: TestContext) => {
        expect(context.mockOnFileSelect).toHaveBeenCalledOnce();
        const calledFile = context.mockOnFileSelect.mock.calls[0][0];
        expect(calledFile).toBeInstanceOf(File);
        expect(calledFile.name).toBe("photo.jpg");
      },
    );
  });

  // @miss-ui-specs @FR6
  f.Scenario("No callback when no file selected", ({ When, Then }) => {
    When(
      "file picker change fires with no files",
      async (_ctx: TestContext) => {
        renderPicker(null);
        const input = screen.getByTestId(
          "cover-file-input",
        ) as HTMLInputElement;
        await userEvent.upload(input, []);
      },
    );

    Then("onFileSelect is not called", (_ctx: TestContext) => {
      expect(context.mockOnFileSelect).not.toHaveBeenCalled();
    });
  });

  // @miss-ui-specs @FR8
  f.Scenario("Input reset after file selection", ({ When, Then }) => {
    When(
      "user selects an image file via the file picker",
      async (_ctx: TestContext) => {
        renderPicker(null);
        const file = new File(["content"], "photo.jpg", {
          type: "image/jpeg",
        });
        const input = screen.getByTestId("cover-file-input");
        await userEvent.upload(input, file);
      },
    );

    Then(
      "the file input value is reset to empty string",
      (_ctx: TestContext) => {
        const input = screen.getByTestId(
          "cover-file-input",
        ) as HTMLInputElement;
        expect(input.value).toBe("");
      },
    );
  });

  // @miss-ui-specs @FR5
  f.Scenario("Remove button calls onRemove", ({ Given, When, Then }) => {
    Given("GoalCoverPicker has a preview image", (_ctx: TestContext) => {
      renderPicker("https://example.com/cover.jpg");
    });

    When("user clicks the remove button", async (_ctx: TestContext) => {
      const removeButton = screen.getByTestId("cover-remove-button");
      await userEvent.click(removeButton);
    });

    Then("onRemove callback is called", (_ctx: TestContext) => {
      expect(context.mockOnRemove).toHaveBeenCalledOnce();
    });
  });
});
