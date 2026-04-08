import { test } from "@playwright/test";

test.describe("Manual Click Test", () => {
  test("check if clicks work", async ({ page }) => {
    // Navigate to app
    await page.goto("http://localhost:5173");

    // Wait for app to initialize
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({
      path: "test-results/01-initial.png",
      fullPage: true,
    });

    // Try to find any task items
    const taskItems = page.locator('[data-test-id="task-item"]');
    const count = await taskItems.count();
    console.log(`Found ${count} task items`);

    if (count === 0) {
      console.log("No tasks found. Checking page content...");
      const bodyText = await page.locator("body").textContent();
      console.log("Page content:", bodyText?.substring(0, 500));

      // Take screenshot
      await page.screenshot({
        path: "test-results/02-no-tasks.png",
        fullPage: true,
      });
      return;
    }

    // Get first task
    const firstTask = taskItems.first();
    await firstTask.screenshot({ path: "test-results/03-first-task.png" });

    // Try clicking complete button
    const completeButton = firstTask.locator("button").first();
    console.log("Clicking complete button...");
    await completeButton.click();
    await page.waitForTimeout(500);
    await page.screenshot({
      path: "test-results/04-after-complete-click.png",
      fullPage: true,
    });

    // Try clicking task body
    const taskBody = firstTask.locator('[data-test-id="task-item-body"]');
    if ((await taskBody.count()) > 0) {
      console.log("Clicking task body...");
      await taskBody.click();
      await page.waitForTimeout(500);
      await page.screenshot({
        path: "test-results/05-after-body-click.png",
        fullPage: true,
      });
    }

    // Keep browser open for manual inspection
    await page.waitForTimeout(5000);
  });
});
