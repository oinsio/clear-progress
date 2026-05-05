import { expect } from "@playwright/test";
import { createBdd, type DataTable } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const DB_NAME = "clear-progress";
const DB_VERSION = 4;

interface GoalSeedRow {
  id: string;
  name: string;
  status: string;
}

async function seedGoals(
  page: import("@playwright/test").Page,
  goals: GoalSeedRow[],
) {
  await page.evaluate(
    ({ dbName, dbVersion, goalsData }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onupgradeneeded = () => {
          const database = request.result;
          if (!database.objectStoreNames.contains("goals")) {
            database.createObjectStore("goals", { keyPath: "id" });
          }
          if (!database.objectStoreNames.contains("settings")) {
            database.createObjectStore("settings", { keyPath: "key" });
          }
        };
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(["goals"], "readwrite");
          const goalsStore = transaction.objectStore("goals");
          for (const goal of goalsData) {
            goalsStore.put({
              id: goal.id,
              name: goal.name,
              description: "",
              cover_file_id: "",
              status: goal.status,
              sort_order: 0,
              is_deleted: false,
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: "2026-01-01T00:00:00.000Z",
              version: 1,
              revision: 0,
              needsSync: false,
            });
          }
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    },
    { dbName: DB_NAME, dbVersion: DB_VERSION, goalsData: goals },
  );
}

async function seedFocusedGoals(
  page: import("@playwright/test").Page,
  focusedGoalIds: string[],
) {
  await page.evaluate(
    ({ dbName, dbVersion, goalIds }) => {
      return new Promise<void>((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(["settings"], "readwrite");
          const settingsStore = transaction.objectStore("settings");
          settingsStore.put({
            key: "focused_goal_1",
            value: goalIds[0] ?? "",
            updated_at: "2026-01-01T00:00:00.000Z",
            needsSync: false,
          });
          settingsStore.put({
            key: "focused_goal_2",
            value: goalIds[1] ?? "",
            updated_at: "2026-01-01T00:00:00.000Z",
            needsSync: false,
          });
          transaction.oncomplete = () => {
            database.close();
            resolve();
          };
          transaction.onerror = () => reject(transaction.error);
        };
        request.onerror = () => reject(request.error);
      });
    },
    { dbName: DB_NAME, dbVersion: DB_VERSION, goalIds: focusedGoalIds },
  );
}

async function findGoalIdsByNames(
  page: import("@playwright/test").Page,
  goalNames: string[],
): Promise<string[]> {
  return page.evaluate(
    ({ dbName, dbVersion, names }) => {
      return new Promise<string[]>((resolve, reject) => {
        const request = indexedDB.open(dbName, dbVersion);
        request.onsuccess = () => {
          const database = request.result;
          const transaction = database.transaction(["goals"], "readonly");
          const goalsStore = transaction.objectStore("goals");
          const getAllRequest = goalsStore.getAll();
          getAllRequest.onsuccess = () => {
            const allGoals = getAllRequest.result as {
              id: string;
              name: string;
            }[];
            const matchedIds = names
              .map((name: string) => allGoals.find((g) => g.name === name)?.id)
              .filter(Boolean) as string[];
            database.close();
            resolve(matchedIds);
          };
          getAllRequest.onerror = () => reject(getAllRequest.error);
        };
        request.onerror = () => reject(request.error);
      });
    },
    { dbName: DB_NAME, dbVersion: DB_VERSION, names: goalNames },
  );
}

// --- Background ---

Given("goals exist:", async ({ page }, dataTable: DataTable) => {
  const goals = dataTable.hashes() as unknown as GoalSeedRow[];
  await page.goto("/");
  await seedGoals(page, goals);
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
  async ({ page }, _count: number, goal1: string, goal2: string) => {
    const focusedIds = await findGoalIdsByNames(page, [goal1, goal2]);
    await seedFocusedGoals(page, focusedIds);
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
  async ({ page }, _count: number, goalName: string) => {
    const focusedIds = await findGoalIdsByNames(page, [goalName]);
    if (focusedIds.length > 0) {
      await seedFocusedGoals(page, focusedIds);
    }
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
