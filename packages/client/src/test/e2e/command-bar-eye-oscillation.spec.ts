/**
 * Reproduces eye toggle oscillation bug:
 * When typing long text in CommandBar, the eye toggle button jumps
 * between positions on each keystroke near the wrapping threshold.
 */
import { expect, test } from "@playwright/test";

const COMMAND_BAR_TIMEOUT_MS = 3000;
const MOBILE_VIEWPORT = { width: 375, height: 812 };
const POSITION_TOLERANCE_PX = 1;

test.describe("CommandBar eye toggle oscillation", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto("/tasks");
    await page
      .getByTestId("command-bar")
      .waitFor({ state: "visible", timeout: COMMAND_BAR_TIMEOUT_MS });
  });

  test("eye toggle position stays stable while typing long text", async ({
    page,
  }) => {
    const textarea = page.getByTestId("command-bar-textarea");
    const eyeToggle = page.getByTestId("command-bar-eye-toggle");

    await textarea.focus();

    // Type enough text to trigger wrapping, character by character
    const longText =
      "This is a long task name that should cause the textarea to wrap to multiple lines eventually";
    const positions: { x: number; y: number }[] = [];

    for (const char of longText) {
      await page.keyboard.type(char, { delay: 0 });

      // Wait for layout to settle after React re-render
      await page.waitForTimeout(50);

      const box = await eyeToggle.boundingBox();
      if (box) {
        positions.push({ x: Math.round(box.x), y: Math.round(box.y) });
      }
    }

    // Detect oscillation: count how many times the Y position changes direction
    // Normal behavior: position changes at most once (from row → stacked)
    // Bug: position flips back and forth on each keystroke
    let directionChanges = 0;
    let previousDirection = 0; // -1 = up, 0 = same, 1 = down

    for (let index = 1; index < positions.length; index++) {
      const deltaY = positions[index].y - positions[index - 1].y;

      if (Math.abs(deltaY) <= POSITION_TOLERANCE_PX) continue;

      const currentDirection = deltaY > 0 ? 1 : -1;
      if (previousDirection !== 0 && currentDirection !== previousDirection) {
        directionChanges++;
      }
      previousDirection = currentDirection;
    }

    // Log positions for debugging
    const uniqueYPositions = [
      ...new Set(positions.map((position) => position.y)),
    ];
    console.log("Unique Y positions:", uniqueYPositions);
    console.log("Direction changes:", directionChanges);
    console.log(
      "Position timeline (y):",
      positions.map((position) => position.y).join(", "),
    );

    // A stable layout should have at most 1 direction change
    // (transition from row to stacked mode).
    // More than 1 means the eye toggle is oscillating.
    expect(
      directionChanges,
      `Eye toggle oscillated ${directionChanges} times. Y positions: ${uniqueYPositions.join(", ")}`,
    ).toBeLessThanOrEqual(1);
  });

  test("eye toggle position stays stable when typing near wrap threshold", async ({
    page,
  }) => {
    const textarea = page.getByTestId("command-bar-textarea");
    const eyeToggle = page.getByTestId("command-bar-eye-toggle");

    await textarea.focus();

    // First, type text that's just below the wrapping point
    const baseText = "A medium length task name here";
    await textarea.fill(baseText);
    await page.waitForTimeout(100);

    // Now type characters one by one around the wrap threshold
    const additionalChars = " and some more text added slowly";
    const positions: { x: number; y: number }[] = [];

    for (const char of additionalChars) {
      await page.keyboard.type(char, { delay: 0 });
      await page.waitForTimeout(50);

      const box = await eyeToggle.boundingBox();
      if (box) {
        positions.push({ x: Math.round(box.x), y: Math.round(box.y) });
      }
    }

    // Check for oscillation in Y position
    let oscillationCount = 0;
    for (let index = 2; index < positions.length; index++) {
      const previousDelta = positions[index - 1].y - positions[index - 2].y;
      const currentDelta = positions[index].y - positions[index - 1].y;

      // Oscillation: position goes up then down or down then up
      if (
        Math.abs(previousDelta) > POSITION_TOLERANCE_PX &&
        Math.abs(currentDelta) > POSITION_TOLERANCE_PX &&
        Math.sign(previousDelta) !== Math.sign(currentDelta)
      ) {
        oscillationCount++;
      }
    }

    console.log(
      "Position timeline (y):",
      positions.map((position) => position.y).join(", "),
    );
    console.log("Oscillation count:", oscillationCount);

    expect(
      oscillationCount,
      `Eye toggle oscillated ${oscillationCount} times near wrap threshold`,
    ).toBe(0);
  });
});
