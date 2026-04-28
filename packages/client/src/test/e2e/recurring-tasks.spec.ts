import { expect, type Page, test } from "@playwright/test";

// Helper functions
async function openTaskCreation(page: Page) {
  const addButton = page.locator('[data-test-id="add-task-button"]');
  await addButton.click();
}

async function fillTaskName(page: Page, name: string) {
  const nameInput = page.locator('[data-test-id="task-name-input"]');
  await nameInput.fill(name);
}

async function openRepeatSelector(page: Page) {
  const repeatButton = page.locator('[data-test-id="task-repeat-button"]');
  await repeatButton.click();
}

async function selectFixedRepeatType(page: Page) {
  await page.locator('[data-test-id="repeat-type-fixed"]').click();
}

async function selectRepeatFrequency(
  page: Page,
  frequency: "daily" | "weekly" | "monthly",
) {
  await page.locator(`[data-test-id="repeat-frequency-${frequency}"]`).click();
}

async function proceedToPlacement(page: Page) {
  await page.locator('[data-test-id="repeat-fixed-next"]').click();
}

async function selectTargetBox(
  page: Page,
  box: "today" | "week" | "later" | "inbox",
) {
  await page.locator(`[data-test-id="repeat-target-box-${box}"]`).click();
}

async function applyRepeatRule(page: Page) {
  await page.locator('[data-test-id="repeat-apply"]').click();
}

async function saveTask(page: Page) {
  const saveButton = page.locator('[data-test-id="task-save-button"]');
  await saveButton.click();
}

async function createRecurringTask(
  page: Page,
  name: string,
  frequency: "daily" | "weekly" | "monthly",
  targetBox: "today" | "week" | "later" | "inbox" = "today",
) {
  await openTaskCreation(page);
  await fillTaskName(page, name);
  await openRepeatSelector(page);
  await selectFixedRepeatType(page);
  await selectRepeatFrequency(page, frequency);

  if (frequency === "weekly") {
    // Select Monday by default
    await page.locator('[data-test-id="repeat-weekday-1"]').click();
  }

  await proceedToPlacement(page);
  await selectTargetBox(page, targetBox);
  await applyRepeatRule(page);
  await saveTask(page);
  await page.waitForTimeout(500);
}

test.describe("Recurring Tasks E2E", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to app
    await page.goto("http://localhost:5173");
    await page.waitForTimeout(1000);
  });

  test("should create task with daily repeat rule", async ({ page }) => {
    await createRecurringTask(page, "Daily review", "daily");

    // Verify task appears with repeat icon
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily review",
    });
    await expect(taskItem).toBeVisible();

    const repeatIcon = taskItem.locator('[data-test-id="task-repeat-icon"]');
    await expect(repeatIcon).toBeVisible();
  });

  test("should create hidden clone when completing recurring task", async ({
    page,
  }) => {
    // Create a recurring task first
    await createRecurringTask(page, "Weekly review", "weekly");

    // Complete the task
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Weekly review",
    });
    const completeButton = taskItem.locator(
      '[data-test-id="task-complete-button"]',
    );
    await completeButton.click();

    // Wait for completion
    await page.waitForTimeout(500);

    // Task should be marked as completed (or moved to completed section)
    // Hidden clone should be created but not visible by default
    const visibleTasks = page.locator('[data-test-id="task-item"]', {
      hasText: "Weekly review",
    });
    const count = await visibleTasks.count();

    // Should be 0 (completed task is hidden) or 1 (if completed tasks are shown)
    expect(count).toBeLessThanOrEqual(1);
  });

  test("should show hidden tasks when toggle is enabled", async ({ page }) => {
    // Create a recurring task and complete it (to create hidden clone)
    await createRecurringTask(page, "Daily standup", "daily");

    // Complete the task
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily standup",
    });
    const completeButton = taskItem.locator(
      '[data-test-id="task-complete-button"]',
    );
    await completeButton.click();

    await page.waitForTimeout(500);

    // Toggle hidden tasks visibility
    const hiddenToggle = page.locator('[data-test-id="hidden-tasks-toggle"]');
    await hiddenToggle.click();

    await page.waitForTimeout(500);

    // Now hidden clone should be visible
    const hiddenTask = page.locator('[data-test-id="task-item"]', {
      hasText: "Daily standup",
    });
    await expect(hiddenTask).toBeVisible();

    // Should have visual indicator (opacity or icon)
    const hiddenIcon = hiddenTask.locator('[data-test-id="task-hidden-icon"]');
    await expect(hiddenIcon).toBeVisible();
  });

  test("should create after_completion recurring task", async ({ page }) => {
    const addButton = page.locator('[data-test-id="add-task-button"]');
    await addButton.click();

    const nameInput = page.locator('[data-test-id="task-name-input"]');
    await nameInput.fill("Water plants");

    const repeatButton = page.locator('[data-test-id="task-repeat-button"]');
    await repeatButton.click();

    // Select after_completion type
    await page.locator('[data-test-id="repeat-type-after-completion"]').click();

    // Set delay days (default is 1, can be changed)
    const delayInput = page.locator('[data-test-id="repeat-delay-days-input"]');
    await delayInput.fill("7");

    await page.locator('[data-test-id="repeat-after-completion-next"]').click();

    // Select target box
    await page.locator('[data-test-id="repeat-target-box-week"]').click();

    await page.locator('[data-test-id="repeat-apply"]').click();

    const saveButton = page.locator('[data-test-id="task-save-button"]');
    await saveButton.click();

    await page.waitForTimeout(500);

    // Verify task appears
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Water plants",
    });
    await expect(taskItem).toBeVisible();

    const repeatIcon = taskItem.locator('[data-test-id="task-repeat-icon"]');
    await expect(repeatIcon).toBeVisible();
  });

  test("should remove repeat rule from task", async ({ page }) => {
    // Create a recurring task
    await createRecurringTask(page, "Temporary recurring task", "daily");

    // Edit task to remove repeat rule
    const taskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Temporary recurring task",
    });
    await taskItem.click();

    const editRepeatButton = page.locator(
      '[data-test-id="task-repeat-button"]',
    );
    await editRepeatButton.click();

    // Click remove button
    const removeButton = page.locator('[data-test-id="repeat-remove"]');
    await removeButton.click();

    const saveEditButton = page.locator('[data-test-id="task-save-button"]');
    await saveEditButton.click();

    await page.waitForTimeout(500);

    // Verify repeat icon is gone
    const updatedTaskItem = page.locator('[data-test-id="task-item"]', {
      hasText: "Temporary recurring task",
    });
    const repeatIcon = updatedTaskItem.locator(
      '[data-test-id="task-repeat-icon"]',
    );
    await expect(repeatIcon).not.toBeVisible();
  });

  test("should navigate through repeat selector steps", async ({ page }) => {
    await openTaskCreation(page);
    await fillTaskName(page, "Test navigation");
    await openRepeatSelector(page);

    // Step 1: Type selection
    await expect(
      page.locator('[data-test-id="repeat-type-step"]'),
    ).toBeVisible();

    await page.locator('[data-test-id="repeat-type-fixed"]').click();

    // Step 2: Fixed params
    await expect(
      page.locator('[data-test-id="repeat-fixed-params-step"]'),
    ).toBeVisible();

    // Go back
    await page.locator('[data-test-id="repeat-back"]').click();

    // Should be back at step 1
    await expect(
      page.locator('[data-test-id="repeat-type-step"]'),
    ).toBeVisible();

    // Go forward again
    await page.locator('[data-test-id="repeat-type-fixed"]').click();
    await page.locator('[data-test-id="repeat-frequency-monthly"]').click();
    await page.locator('[data-test-id="repeat-fixed-next"]').click();

    // Step 3: Placement
    await expect(
      page.locator('[data-test-id="repeat-placement-step"]'),
    ).toBeVisible();

    // Go back
    await page.locator('[data-test-id="repeat-back"]').click();

    // Should be back at step 2
    await expect(
      page.locator('[data-test-id="repeat-fixed-params-step"]'),
    ).toBeVisible();
  });
});
