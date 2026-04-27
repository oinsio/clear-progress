import { expect, test } from "@playwright/test";

test.describe("Recurring Tasks - Timezone Integration", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(1000);
  });

  test("should create hidden clone with next_date when completing recurring task", async ({
    page,
  }) => {
    // Создать daily повторяющуюся задачу
    await page.locator('[data-test-id="add-task-button"]').click();
    await page.locator('[data-test-id="task-name-input"]').fill("Daily task");

    // Настроить repeat rule
    await page.locator('[data-test-id="task-repeat-button"]').click();
    await page.locator('[data-test-id="repeat-type-fixed"]').click();
    await page.locator('[data-test-id="repeat-frequency-daily"]').click();
    await page.locator('[data-test-id="repeat-fixed-next"]').click();
    await page.locator('[data-test-id="repeat-target-box-today"]').click();
    await page.locator('[data-test-id="repeat-apply"]').click();

    await page.locator('[data-test-id="task-save-button"]').click();
    await page.waitForTimeout(500);

    // Завершить задачу
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily task",
    });
    await taskItem.locator('[data-test-id="task-complete-button"]').click();
    await page.waitForTimeout(500);

    // Включить показ скрытых задач
    await page.locator('[data-test-id="hidden-tasks-toggle"]').click();
    await page.waitForTimeout(500);

    // Проверить, что создана скрытая копия
    const hiddenTask = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily task",
    });
    await expect(hiddenTask).toBeVisible();

    // Проверить наличие иконки скрытой задачи
    const hiddenIcon = hiddenTask.locator('[data-test-id="task-hidden-icon"]');
    await expect(hiddenIcon).toBeVisible();
  });
});
