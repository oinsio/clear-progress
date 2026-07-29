// Verifies NFR-R1 of configurable-sync-timing
import { expect, type Locator, type Page } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Then } = createBdd();

// The "reach the settings page with the sync timing controls visible" Given
// step and the "viewport is {int}px wide" step are intentionally NOT
// redefined here: playwright-bdd registers step definitions globally across
// every *_e2e.steps.ts file it loads, so reusing the exact wording from
// sync_timing_a11y_e2e.steps.ts and shared/steps/viewport_e2e.steps.ts is
// enough for this feature's Background/Given to resolve to those existing
// definitions.

// ============================================================================
// Helpers
// ============================================================================

const SYNC_TIMING_SECTION_TEST_ID = "settings-sync-timing";
const SYNC_INTERVAL_INPUT_TEST_ID = "sync-interval-input";
const AUTO_SYNC_DELAY_INPUT_TEST_ID = "auto-sync-delay-input";
const SYNC_INTERVAL_INPUT_ID = "sync-interval";
const AUTO_SYNC_DELAY_INPUT_ID = "auto-sync-delay";
const CLIPPING_TOLERANCE_PX = 1;

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

async function boundingBoxOrThrow(
  locator: Locator,
  label: string,
): Promise<Rect> {
  const box = await locator.boundingBox();
  if (!box) {
    throw new Error(`${label} bounding box not found`);
  }
  return box;
}

/**
 * Bounding box of a whole timing field (label, input, unit suffix,
 * SyncIndicator, description) — the immediate parent of the field's
 * `<label for= "...">` — so overlap checks cover the full field, not just
 * the bare `<input>`.
 */
function fieldContainer(page: Page, inputId: string): Locator {
  return page.locator(`label[for="${inputId}"]`).locator("xpath=..");
}

function rectanglesOverlap(first: Rect, second: Rect): boolean {
  const firstRight = first.x + first.width;
  const firstBottom = first.y + first.height;
  const secondRight = second.x + second.width;
  const secondBottom = second.y + second.height;

  const horizontallySeparate = firstRight <= second.x || secondRight <= first.x;
  const verticallySeparate = firstBottom <= second.y || secondBottom <= first.y;

  return !horizontallySeparate && !verticallySeparate;
}

// ============================================================================
// NFR-R1: Inputs render without clipping
// ============================================================================

Then(
  "sync interval input is fully visible within the sync timing section",
  async ({ page }) => {
    await assertInputFullyVisibleWithinSection(
      page,
      SYNC_INTERVAL_INPUT_TEST_ID,
    );
  },
);

Then(
  "auto sync delay input is fully visible within the sync timing section",
  async ({ page }) => {
    await assertInputFullyVisibleWithinSection(
      page,
      AUTO_SYNC_DELAY_INPUT_TEST_ID,
    );
  },
);

async function assertInputFullyVisibleWithinSection(
  page: Page,
  inputTestId: string,
): Promise<void> {
  const section = page.getByTestId(SYNC_TIMING_SECTION_TEST_ID);
  const input = page.getByTestId(inputTestId);

  await expect(input).toBeVisible();

  const sectionBox = await boundingBoxOrThrow(section, "Sync timing section");
  const inputBox = await boundingBoxOrThrow(input, inputTestId);

  expect(inputBox.x).toBeGreaterThanOrEqual(
    sectionBox.x - CLIPPING_TOLERANCE_PX,
  );
  expect(inputBox.y).toBeGreaterThanOrEqual(
    sectionBox.y - CLIPPING_TOLERANCE_PX,
  );
  expect(inputBox.x + inputBox.width).toBeLessThanOrEqual(
    sectionBox.x + sectionBox.width + CLIPPING_TOLERANCE_PX,
  );
  expect(inputBox.y + inputBox.height).toBeLessThanOrEqual(
    sectionBox.y + sectionBox.height + CLIPPING_TOLERANCE_PX,
  );
}

// ============================================================================
// NFR-R1: Fields do not overlap each other
// ============================================================================

Then(
  "the sync interval field and the auto sync delay field do not overlap",
  async ({ page }) => {
    const syncIntervalFieldBox = await boundingBoxOrThrow(
      fieldContainer(page, SYNC_INTERVAL_INPUT_ID),
      "Sync interval field",
    );
    const autoSyncDelayFieldBox = await boundingBoxOrThrow(
      fieldContainer(page, AUTO_SYNC_DELAY_INPUT_ID),
      "Auto sync delay field",
    );

    expect(rectanglesOverlap(syncIntervalFieldBox, autoSyncDelayFieldBox)).toBe(
      false,
    );
  },
);

// ============================================================================
// NFR-R1: No horizontal page overflow at the narrowest viewport
// ============================================================================

Then("the page does not overflow horizontally", async ({ page }) => {
  const viewportWidth = page.viewportSize()?.width;
  if (!viewportWidth) {
    throw new Error("Viewport width not set");
  }

  const documentScrollWidth = await page.evaluate(
    () => document.documentElement.scrollWidth,
  );

  expect(documentScrollWidth).toBeLessThanOrEqual(
    viewportWidth + CLIPPING_TOLERANCE_PX,
  );
});
