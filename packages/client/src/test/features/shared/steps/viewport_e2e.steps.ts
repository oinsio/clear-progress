// Shared responsive-viewport step reused across responsive NFR e2e specs.
// Verifies NFR-R3 of command-bar, NFR-R1 of show-upcoming-recurrences.
import { createBdd } from "playwright-bdd";

const { Given } = createBdd();

const DEFAULT_VIEWPORT_HEIGHT = 812;

Given("viewport is {int}px wide", async ({ page }, width: number) => {
  await page.setViewportSize({ width, height: DEFAULT_VIEWPORT_HEIGHT });
});
