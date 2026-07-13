// Verifies NFR-R1 of show-upcoming-recurrences
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

const ELEMENT_TIMEOUT_MS = 5000;
const TASK_NAME = "Test recurring task";

Given("user opens the repeat rule selector for a task", async ({ page }) => {
  await page.goto("/tasks");

  // Create a task via the command bar
  const commandBar = page.getByTestId("command-bar");
  await commandBar.waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT_MS });
  await commandBar.getByRole("textbox").fill(TASK_NAME);
  await commandBar.getByRole("textbox").press("Enter");

  // Wait for the task to appear and click it to open detail panel
  const taskItem = page.getByText(TASK_NAME).first();
  await taskItem.waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT_MS });
  await taskItem.click();

  // Open the repeat rule selector
  const repeatRow = page.getByTestId("repeat-rule-row");
  await repeatRow.waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT_MS });
  await repeatRow.click();

  // Select fixed type
  const fixedTypeButton = page.getByTestId("repeat-type-fixed");
  await fixedTypeButton.waitFor({
    state: "visible",
    timeout: ELEMENT_TIMEOUT_MS,
  });
  await fixedTypeButton.click();
});

Given("user configures a daily fixed rule", async ({ page }) => {
  const dailyButton = page.getByTestId("repeat-frequency-daily");
  await dailyButton.waitFor({ state: "visible", timeout: ELEMENT_TIMEOUT_MS });
  await dailyButton.click();
});

Then("the upcoming dates preview is visible", async ({ page }) => {
  const preview = page.getByTestId("upcoming-dates-preview");
  await expect(preview).toBeVisible({ timeout: ELEMENT_TIMEOUT_MS });
});

Then(
  "the upcoming dates preview fits within the viewport",
  async ({ page }) => {
    const preview = page.getByTestId("upcoming-dates-preview");
    const previewBox = await preview.boundingBox();
    const viewportSize = page.viewportSize();

    if (!previewBox || !viewportSize) {
      throw new Error("Preview bounding box or viewport size not found");
    }

    // Preview should not extend beyond viewport width
    const previewRight = previewBox.x + previewBox.width;
    expect(previewRight).toBeLessThanOrEqual(viewportSize.width);

    // Preview should have positive width (not collapsed)
    expect(previewBox.width).toBeGreaterThan(0);
    expect(previewBox.height).toBeGreaterThan(0);
  },
);
