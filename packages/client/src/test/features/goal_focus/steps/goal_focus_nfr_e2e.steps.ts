import { expect } from "@playwright/test";
import { createBdd, DataTable } from "playwright-bdd";

const { Given, When, Then } = createBdd();

// --- Background ---

Given("goals exist:", async ({ page }, dataTable: DataTable) => {
  const goals = dataTable.hashes();
  await page.evaluate((_goalsData) => {
    // Inject test data into IndexedDB before navigation
    // TODO: implement seed via IndexedDB helper or API mock
  }, goals);
  await page.goto("/goals");
});

// --- NFR-A1, NFR-A2: Focus icon keyboard accessibility ---

// Verifies NFR-A1, NFR-A2 of add-goal-focus
Given("user opens goal page {string}", async ({ page }, goalName: string) => {
  await page.goto("/goals");
  await page.getByText(goalName).click();
});

When("user presses Tab to focus icon", async ({ page }) => {
  await page.keyboard.press("Tab");
});

Then("icon receives keyboard focus", async ({ page }) => {
  const focusIcon = page.getByTestId("focus-icon");
  await expect(focusIcon).toBeFocused();
});

Then("icon aria-label = {string}", async ({ page }, expectedLabel: string) => {
  const focusIcon = page.getByTestId("focus-icon");
  await expect(focusIcon).toHaveAttribute("aria-label", expectedLabel);
});

When("user presses Enter", async ({ page }) => {
  await page.keyboard.press("Enter");
});

Then("goal is added to focus", async ({ page }) => {
  const focusIcon = page.getByTestId("focus-icon");
  await expect(focusIcon).toHaveAttribute("aria-pressed", "true");
});

Then(
  "icon aria-label changed to {string}",
  async ({ page }, expectedLabel: string) => {
    const focusIcon = page.getByTestId("focus-icon");
    await expect(focusIcon).toHaveAttribute("aria-label", expectedLabel);
  },
);

// --- NFR-A3: Replacement dialog keyboard accessibility ---

// Verifies NFR-A3 of add-goal-focus
Given(
  "{int} goals in focus: {string}, {string}",
  async ({ page }, _count: number, _goal1: string, _goal2: string) => {
    // Seed 2 focused goals via IndexedDB
    // TODO: implement seed
    await page.goto("/goals");
  },
);

Given("clicks focus icon", async ({ page }) => {
  await page.getByTestId("focus-icon").click();
});

Given("replacement dialog is displayed", async ({ page }) => {
  await expect(page.getByRole("dialog")).toBeVisible();
});

When("user presses Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
});

Then("focus moves between dialog buttons", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  const buttons = dialog.getByRole("button");
  await expect(buttons.first()).toBeFocused();
});

When("user presses Escape", async ({ page }) => {
  await page.keyboard.press("Escape");
});

Then("dialog closes", async ({ page }) => {
  await expect(page.getByRole("dialog")).not.toBeVisible();
});

Then("focus returns to focus icon", async ({ page }) => {
  await expect(page.getByTestId("focus-icon")).toBeFocused();
});

// --- NFR-R1: Responsive ---

// Verifies NFR-R1 of add-goal-focus
When("user opens the app on mobile \\(collapsed panel)", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto("/");
});

Then("focused goals are displayed in collapsed mode", async ({ page }) => {
  const panel = page.getByTestId("focus-panel");
  await expect(panel).toHaveAttribute("data-collapsed", "true");
});

When("user opens the app on desktop \\(expanded panel)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto("/");
});

Then(
  "focused goals are displayed in expanded mode with full names",
  async ({ page }) => {
    const panel = page.getByTestId("focus-panel");
    await expect(panel).toHaveAttribute("data-collapsed", "false");
  },
);

// --- UX4: Smooth disappearance ---

// Verifies UX4 of add-goal-focus
Given(
  "{int} goal in focus: {string}",
  async ({ page }, _count: number, _goalName: string) => {
    // Seed 1 focused goal via IndexedDB
    // TODO: implement seed
    await page.goto("/goals");
  },
);

When("user removes goal from focus", async ({ page }) => {
  await page.getByTestId("focus-icon").click();
});

Then("goal smoothly disappears from navigation", async ({ page }) => {
  const navItem = page.getByTestId("focused-goal-nav-item");
  await expect(navItem).not.toBeVisible({ timeout: 1000 });
});

Then("no layout jank occurs", async ({ page }) => {
  const clsValue = await page.evaluate(() => {
    return new Promise<number>((resolve) => {
      let cls = 0;
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as PerformanceEntry & { hadRecentInput: boolean }).hadRecentInput) {
            cls += (entry as PerformanceEntry & { value: number }).value;
          }
        }
      });
      observer.observe({ type: "layout-shift", buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(cls);
      }, 500);
    });
  });
  expect(clsValue).toBeLessThan(0.1);
});
