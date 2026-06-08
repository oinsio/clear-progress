import type { Page } from "@playwright/test";

const GOAL_CREATION_TIMEOUT_MS = 5000;

export async function createGoalViaUI(page: Page, name: string): Promise<void> {
  await page.goto("/goals");
  await page.getByTestId("add-goal-button").first().click();
  const goalInput = page.getByTestId("add-goal-input");
  await goalInput.waitFor({ state: "visible" });
  await goalInput.fill(name);
  await goalInput.press("Enter");
  await page
    .getByText(name)
    .waitFor({ state: "visible", timeout: GOAL_CREATION_TIMEOUT_MS });
}

export async function openGoalEditMode(
  page: Page,
  goalName: string,
): Promise<void> {
  await page.getByText(goalName).click();
  await page.getByTestId("goal-detail-page").waitFor({ state: "visible" });
  await page.getByTestId("edit-goal-button").click();
}
