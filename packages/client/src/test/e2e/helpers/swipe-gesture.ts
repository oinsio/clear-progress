import type { Page } from "@playwright/test";

const SWIPE_GESTURE_STEPS = 10;
const SWIPE_DISTANCE_FACTOR = 0.5;

export async function performSwipeRight(
  page: Page,
  testId: string,
): Promise<void> {
  const element = page.getByTestId(testId).first();
  const boundingBox = await element.boundingBox();
  if (!boundingBox)
    throw new Error(`Element with testId="${testId}" not found`);

  const startX = boundingBox.x + boundingBox.width / 2;
  const startY = boundingBox.y + boundingBox.height / 2;
  const endX = startX + boundingBox.width * SWIPE_DISTANCE_FACTOR;

  await page.mouse.move(startX, startY);
  await page.mouse.down();
  for (let step = 0; step < SWIPE_GESTURE_STEPS; step++) {
    await page.mouse.move(
      startX + ((endX - startX) * (step + 1)) / SWIPE_GESTURE_STEPS,
      startY,
    );
  }
  await page.mouse.up();
}
