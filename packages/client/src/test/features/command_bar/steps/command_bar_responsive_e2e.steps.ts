// Verifies NFR-R1, NFR-R2, NFR-R3 of command-bar
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

const COMMAND_BAR_TIMEOUT_MS = 3000;
const OVERLAP_TOLERANCE_PX = 1;

// ============================================================================
// Background steps
// ============================================================================

Given("user is on a page with CommandBar", async ({ page }) => {
  await page.goto("/tasks");
  await page
    .getByTestId("command-bar")
    .waitFor({ state: "visible", timeout: COMMAND_BAR_TIMEOUT_MS });
});

// ============================================================================
// NFR-R3: CommandBar does not overlap the Sidebar
// ============================================================================

Then("CommandBar does not overlap the Sidebar", async ({ page }) => {
  const commandBar = page.getByTestId("command-bar");
  const sidebarToggle = page.getByTestId("sidebar-collapsed").first();

  const commandBarBox = await commandBar.boundingBox();
  const sidebarBox = await sidebarToggle.boundingBox();

  if (!commandBarBox || !sidebarBox) {
    throw new Error("CommandBar or Sidebar bounding box not found");
  }

  const commandBarRight = commandBarBox.x + commandBarBox.width;
  const sidebarLeft = sidebarBox.x;

  expect(commandBarRight).toBeLessThanOrEqual(
    sidebarLeft + OVERLAP_TOLERANCE_PX,
  );
});

// ============================================================================
// NFR-R1, NFR-R2: CommandBar width matches content column width
// ============================================================================

Then("CommandBar width matches the content column width", async ({ page }) => {
  const commandBar = page.getByTestId("command-bar");
  const mainColumn = page.getByTestId("main-column");

  const commandBarBox = await commandBar.boundingBox();
  const mainColumnBox = await mainColumn.boundingBox();

  if (!commandBarBox || !mainColumnBox) {
    throw new Error("CommandBar or main column bounding box not found");
  }

  expect(commandBarBox.width).toBeCloseTo(mainColumnBox.width, 0);
});
