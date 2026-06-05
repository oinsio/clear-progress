import { expect, test } from "@playwright/test";

test.describe("Recurring Tasks - Timezone Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(1000);
  });

  test("should create hidden clone with next_date when completing recurring task", async ({
    page,
  }) => {
    // Create a daily recurring task
    await page.locator('[data-test-id="add-task-button"]').click();
    await page.locator('[data-test-id="task-name-input"]').fill("Daily task");

    // Configure repeat rule
    await page.locator('[data-test-id="task-repeat-button"]').click();
    await page.locator('[data-test-id="repeat-type-fixed"]').click();
    await page.locator('[data-test-id="repeat-frequency-daily"]').click();
    await page.locator('[data-test-id="repeat-fixed-next"]').click();
    await page.locator('[data-test-id="repeat-target-box-today"]').click();
    await page.locator('[data-test-id="repeat-apply"]').click();

    await page.locator('[data-test-id="task-save-button"]').click();
    await page.waitForTimeout(500);

    // Complete the task
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily task",
    });
    await taskItem.locator('[data-test-id="task-complete-button"]').click();
    await page.waitForTimeout(500);

    // Enable display of hidden tasks
    await page.locator('[data-test-id="hidden-tasks-toggle"]').click();
    await page.waitForTimeout(500);

    // Verify that a hidden copy was created
    const hiddenTask = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily task",
    });
    await expect(hiddenTask).toBeVisible();

    // Verify that the hidden task icon is present
    const hiddenIcon = hiddenTask.locator('[data-test-id="task-hidden-icon"]');
    await expect(hiddenIcon).toBeVisible();
  });
});
