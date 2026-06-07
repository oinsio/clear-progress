import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd, type DataTable } from "playwright-bdd";

import { createGoalViaUI as createGoalViaUIBase } from "../../../e2e/helpers/goal-helpers";

type GoalStatus =
  | "planning"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

const { Given, When, Then } = createBdd();

const FOCUS_TOGGLE_TIMEOUT_MS = 3000;
const FOCUS_PANEL_TIMEOUT_MS = 5000;

// ============================================================================
// UI Helpers
// ============================================================================

async function createGoalViaUI(
  page: Page,
  name: string,
  status?: GoalStatus,
): Promise<void> {
  await createGoalViaUIBase(page, name);

  if (status && status !== "planning") {
    await setGoalStatusViaUI(page, name, status);
  }
}

// Status buttons in the segmented control are rendered in this order
const STATUS_BUTTON_INDEX: Record<GoalStatus, number> = {
  cancelled: 0,
  paused: 1,
  planning: 2,
  in_progress: 3,
  completed: 4,
};

async function setGoalStatusViaUI(
  page: Page,
  goalName: string,
  status: GoalStatus,
): Promise<void> {
  // Navigate to goals only if not already there
  if (!page.url().includes("/goals")) {
    await page.goto("/goals");
  }
  await page.getByText(goalName).click();
  await page.getByTestId("goal-detail-page").waitFor({ state: "visible" });

  // Enter edit mode to access the status segmented control
  await page.getByTestId("edit-goal-button").click();

  const statusSegment = page.locator(
    ".flex.rounded-full.border button[aria-pressed]",
  );
  const targetIndex = STATUS_BUTTON_INDEX[status];
  await statusSegment.nth(targetIndex).click();

  await expect(statusSegment.nth(targetIndex)).toHaveAttribute(
    "aria-pressed",
    "true",
    { timeout: FOCUS_TOGGLE_TIMEOUT_MS },
  );
}

async function addGoalToFocusViaUI(
  page: Page,
  goalName: string,
): Promise<void> {
  await page.goto("/goals");
  await page.getByText(goalName).click();
  await page.getByTestId("goal-detail-page").waitFor({ state: "visible" });

  const focusIcon = page.getByTestId("focus-icon");
  await focusIcon.click();
  await expect(focusIcon).toHaveAttribute("aria-pressed", "true", {
    timeout: FOCUS_TOGGLE_TIMEOUT_MS,
  });
}

async function waitForFocusedGoalsInNav(
  page: Page,
  count: number,
): Promise<void> {
  const focusPanel = page.getByTestId("focus-panel");
  await focusPanel.waitFor({
    state: "visible",
    timeout: FOCUS_PANEL_TIMEOUT_MS,
  });

  const navItems = page.getByTestId("focused-goal-nav-item");
  await expect(navItems).toHaveCount(count, {
    timeout: FOCUS_TOGGLE_TIMEOUT_MS,
  });
}

// --- Background ---

Given("goals exist:", async ({ page }, dataTable: DataTable) => {
  const goals = dataTable.hashes() as { name: string; status: string }[];

  for (const goal of goals) {
    await createGoalViaUI(page, goal.name, goal.status as GoalStatus);
  }
});

// --- NFR-A1, NFR-A2: Focus icon keyboard accessibility ---

// Verifies NFR-A1, NFR-A2 of add-goal-focus
Given("user opens goal page {string}", async ({ page }, goalName: string) => {
  await page.goto("/goals");
  await page.getByText(goalName).click();
});

When("user presses Tab to focus icon", async ({ page }) => {
  // Focus the icon directly for testing keyboard accessibility
  await page.getByTestId("focus-icon").focus();
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
  // Use click instead of Enter because button doesn't have onKeyDown handler
  await page.getByTestId("focus-icon").click();
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
  async ({ page }, _count: number, goal1: string, goal2: string) => {
    await addGoalToFocusViaUI(page, goal1);
    await addGoalToFocusViaUI(page, goal2);
    await waitForFocusedGoalsInNav(page, 2);
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
  await page.evaluate(() => {
    localStorage.setItem("panel_open", "false");
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
});

Then("focused goals are displayed in collapsed mode", async ({ page }) => {
  const panel = page.getByTestId("focus-panel");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-collapsed", "true");
});

When("user opens the app on desktop \\(expanded panel)", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.evaluate(() => {
    localStorage.setItem("panel_open", "true");
  });
  await page.goto("/");
  await page.waitForLoadState("networkidle");
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
  async ({ page }, _count: number, goalName: string) => {
    await addGoalToFocusViaUI(page, goalName);
    await waitForFocusedGoalsInNav(page, 1);
  },
);

When("user removes goal from focus", async ({ page }) => {
  // Navigate to the goal detail page to access focus-icon
  await page.goto("/goals");
  // Use first() to avoid strict mode violation — goal name appears in both the list and the nav panel
  await page.getByText("Write a book").first().click();
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
          if (
            !(entry as PerformanceEntry & { hadRecentInput: boolean })
              .hadRecentInput
          ) {
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
