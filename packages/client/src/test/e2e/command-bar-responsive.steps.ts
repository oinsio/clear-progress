/**
 * E2E step definitions for CommandBar responsive layout.
 * Verifies NFR-R1, NFR-R2, NFR-R3 of command-bar.
 *
 * These scenarios require a real browser (Playwright) to verify:
 * - CommandBar does not overlap Sidebar
 * - CommandBar width matches content column
 *
 * To run: pnpm test:bdd (requires playwright-bdd setup)
 */
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, Then } = createBdd();

const MOBILE_VIEWPORT_HEIGHT = 812;
const DESKTOP_VIEWPORT_HEIGHT = 900;
const SM_BREAKPOINT = 640;

// Verifies NFR-R1 of command-bar
Given("viewport is {int}px wide", async ({ page }, width: number) => {
  const height =
    width < SM_BREAKPOINT ? MOBILE_VIEWPORT_HEIGHT : DESKTOP_VIEWPORT_HEIGHT;
  await page.setViewportSize({ width, height });
});

// Verifies NFR-R1 of command-bar
Given("user is on a page with CommandBar", async ({ page }) => {
  await page.goto("/inbox");
  await page.getByTestId("command-bar").waitFor({ state: "visible" });
});

// Verifies NFR-R3 of command-bar
Then("CommandBar does not overlap the Sidebar", async ({ page }) => {
  const commandBar = page.getByTestId("command-bar");
  const sidebar = page.getByTestId("sidebar-toggle");

  const commandBarBox = await commandBar.boundingBox();
  const sidebarBox = await sidebar.boundingBox();

  expect(commandBarBox).toBeTruthy();
  expect(sidebarBox).toBeTruthy();

  if (!commandBarBox || !sidebarBox) return;

  const commandBarRight = commandBarBox.x + commandBarBox.width;
  const sidebarLeft = sidebarBox.x;

  // CommandBar must not extend into or past the sidebar
  expect(commandBarRight).toBeLessThanOrEqual(sidebarLeft + 1);
});

// Verifies NFR-R1, NFR-R2 of command-bar
Then("CommandBar width matches the content column width", async ({ page }) => {
  const commandBar = page.getByTestId("command-bar");
  const mainColumn = page.getByTestId("main-column");

  const commandBarBox = await commandBar.boundingBox();
  const mainColumnBox = await mainColumn.boundingBox();

  expect(commandBarBox).toBeTruthy();
  expect(mainColumnBox).toBeTruthy();

  if (!commandBarBox || !mainColumnBox) return;

  // CommandBar width should match main column width (within 2px tolerance)
  expect(commandBarBox.width).toBeCloseTo(mainColumnBox.width, 0);
});
