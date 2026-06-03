/**
 * Verifies NFR-R1, NFR-R2, NFR-R3 of command-bar.
 * CommandBar must not overlap Sidebar and must match content area width.
 */
import { expect, type Page, test } from "@playwright/test";

const SIDEBAR_TESTID = "sidebar-toggle";
const COMMAND_BAR_TESTID = "command-bar";
const MAIN_COLUMN_TESTID = "main-column";

const DESKTOP_VIEWPORT = { width: 1440, height: 900 };
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const LAYOUT_SETTLE_MS = 100;
const OVERLAP_TOLERANCE_PX = 1;

async function getBox(page: Page, testId: string) {
  const box = await page.getByTestId(testId).boundingBox();
  if (!box)
    throw new Error(`Element with testId "${testId}" has no bounding box`);
  return box;
}

async function setViewportAndWait(
  page: Page,
  viewport: { width: number; height: number },
) {
  await page.setViewportSize(viewport);
  await page.waitForTimeout(LAYOUT_SETTLE_MS);
}

test.describe("CommandBar layout relative to Sidebar", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/tasks");
    await page.getByTestId(COMMAND_BAR_TESTID).waitFor({ state: "visible" });
  });

  // Verifies NFR-R3 of command-bar
  for (const { label, viewport } of [
    { label: "desktop", viewport: DESKTOP_VIEWPORT },
    { label: "mobile", viewport: MOBILE_VIEWPORT },
  ]) {
    test(`${label}: CommandBar does not overlap Sidebar`, async ({ page }) => {
      await setViewportAndWait(page, viewport);

      const commandBarBox = await getBox(page, COMMAND_BAR_TESTID);
      const sidebarBox = await getBox(page, SIDEBAR_TESTID);

      const commandBarRight = commandBarBox.x + commandBarBox.width;
      expect(commandBarRight).toBeLessThanOrEqual(
        sidebarBox.x + OVERLAP_TOLERANCE_PX,
      );
    });
  }

  // Verifies NFR-R1 of command-bar
  for (const { label, viewport } of [
    { label: "desktop", viewport: DESKTOP_VIEWPORT },
    { label: "mobile", viewport: MOBILE_VIEWPORT },
  ]) {
    test(`${label}: CommandBar width matches content column width`, async ({
      page,
    }) => {
      await setViewportAndWait(page, viewport);

      const commandBarBox = await getBox(page, COMMAND_BAR_TESTID);
      const mainColumnBox = await getBox(page, MAIN_COLUMN_TESTID);

      expect(commandBarBox.width).toBeCloseTo(mainColumnBox.width, 0);
    });
  }

  // Verifies NFR-R3 of command-bar
  test("CommandBar does not extend past Sidebar", async ({ page }) => {
    await setViewportAndWait(page, DESKTOP_VIEWPORT);

    const commandBarBox = await getBox(page, COMMAND_BAR_TESTID);
    const sidebarBox = await getBox(page, SIDEBAR_TESTID);

    const commandBarRight = commandBarBox.x + commandBarBox.width;
    expect(commandBarRight).toBeLessThanOrEqual(
      sidebarBox.x + OVERLAP_TOLERANCE_PX,
    );
  });
});
