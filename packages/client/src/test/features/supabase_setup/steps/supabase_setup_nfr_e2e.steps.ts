// Verifies NFR-A1, NFR-A2, NFR-A3, NFR-R1 of add-supabase-ui
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const SECTION_TOGGLE_TIMEOUT_MS = 3000;
const CONNECTION_TIMEOUT_MS = 5000;

// ============================================================================
// Helpers
// ============================================================================

async function expandSupabaseSection(page: Page): Promise<void> {
  const toggle = page.getByTestId("setup-supabase-section-toggle");
  await toggle.waitFor({
    state: "visible",
    timeout: SECTION_TOGGLE_TIMEOUT_MS,
  });
  await toggle.click();
}

async function fillAndConnect(
  page: Page,
  url = "myproject",
  anonKey = "test-anon-key",
): Promise<void> {
  await page.getByTestId("setup-supabase-url-input").fill(url);
  await page.getByTestId("setup-supabase-anon-key-input").fill(anonKey);
  await page.getByTestId("setup-supabase-connect-button").click();
}

async function expectAriaLiveRegion(
  locator: import("@playwright/test").Locator,
): Promise<void> {
  await expect(locator).toBeVisible();
  const ariaLive = await locator.getAttribute("aria-live");
  const roleAttr = await locator.getAttribute("role");
  const hasLiveRegion =
    ariaLive === "polite" ||
    ariaLive === "assertive" ||
    roleAttr === "status" ||
    roleAttr === "alert";
  expect(hasLiveRegion).toBe(true);
}

// ============================================================================
// NFR-A1: Keyboard navigation
// ============================================================================

Given("user opens SetupPage with no saved connection", async ({ page }) => {
  await page.goto("/setup");
  await page.waitForLoadState("networkidle");
});

When("user expands Supabase section via keyboard", async ({ page }) => {
  const toggle = page.getByTestId("setup-supabase-section-toggle");
  await toggle.focus();
  await page.keyboard.press("Enter");
});

Then("Supabase URL input is focusable via Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const urlInput = page.getByTestId("setup-supabase-url-input");
  await expect(urlInput).toBeFocused();
});

Then("Anon Key input is focusable via Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const anonKeyInput = page.getByTestId("setup-supabase-anon-key-input");
  await expect(anonKeyInput).toBeFocused();
});

Then("Connect button is focusable via Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const connectButton = page.getByTestId("setup-supabase-connect-button");
  await expect(connectButton).toBeFocused();
});

Given(
  "user opens SetupPage with Supabase section expanded",
  async ({ page }) => {
    await page.goto("/setup");
    await page.waitForLoadState("networkidle");
    await expandSupabaseSection(page);
  },
);

When(
  "user fills Supabase URL {string} via keyboard",
  async ({ page }, url: string) => {
    const urlInput = page.getByTestId("setup-supabase-url-input");
    await urlInput.focus();
    await urlInput.fill(url);
  },
);

When(
  "user fills Anon Key {string} via keyboard",
  async ({ page }, anonKey: string) => {
    const anonKeyInput = page.getByTestId("setup-supabase-anon-key-input");
    await anonKeyInput.focus();
    await anonKeyInput.fill(anonKey);
  },
);

When("user activates Connect button via Enter key", async ({ page }) => {
  const connectButton = page.getByTestId("setup-supabase-connect-button");
  await connectButton.focus();
  await page.keyboard.press("Enter");
});

Then("Supabase connection attempt is initiated", async ({ page }) => {
  // Verify loading state appeared (connection was attempted)
  const loading = page.getByTestId("setup-supabase-loading");
  const error = page.getByTestId("setup-supabase-error");
  // Either loading or error means the connection was attempted
  await expect(loading.or(error)).toBeVisible({
    timeout: CONNECTION_TIMEOUT_MS,
  });
});

// ============================================================================
// NFR-A2: OAuth buttons accessible names
// ============================================================================

Given(
  "user has connected to Supabase with providers {string}",
  async ({ page }, providersCsv: string) => {
    const providers = providersCsv.split(",");
    // Mock the settings endpoint to return specific providers
    await page.route("**/auth/v1/settings", (route) =>
      route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          external: Object.fromEntries(
            providers.map((provider) => [provider, true]),
          ),
        }),
      }),
    );
    await page.goto("/setup");
    await page.waitForLoadState("networkidle");
    await expandSupabaseSection(page);

    // Fill form and connect
    await fillAndConnect(page);

    // Wait for OAuth buttons
    await page
      .getByTestId("setup-supabase-oauth-buttons")
      .waitFor({ state: "visible", timeout: CONNECTION_TIMEOUT_MS });
  },
);

Then(
  "OAuth button for {string} has accessible name {string}",
  async ({ page }, provider: string, expectedName: string) => {
    const button = page.getByTestId(`setup-supabase-oauth-${provider}`);
    await expect(button).toBeVisible();
    await expect(button).toHaveText(expectedName);
  },
);

// ============================================================================
// NFR-A3: aria-live regions
// ============================================================================

When("user initiates Supabase connection", async ({ page }) => {
  await fillAndConnect(page);
});

Then(
  "a loading indicator with aria-live region is present",
  async ({ page }) => {
    const loading = page.getByTestId("setup-supabase-loading");
    await expect(loading).toBeVisible({ timeout: CONNECTION_TIMEOUT_MS });
    await expectAriaLiveRegion(loading);
  },
);

Given(
  "user opens SetupPage with Supabase connection error",
  async ({ page }) => {
    // Mock settings endpoint to fail
    await page.route("**/auth/v1/settings", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );
    await page.goto("/setup");
    await page.waitForLoadState("networkidle");
    await expandSupabaseSection(page);
    await fillAndConnect(page);
    // Wait for error to appear
    await page
      .getByTestId("setup-supabase-error")
      .waitFor({ state: "visible", timeout: CONNECTION_TIMEOUT_MS });
  },
);

Then("error message is in an aria-live region", async ({ page }) => {
  const errorElement = page.getByTestId("setup-supabase-error");
  await expectAriaLiveRegion(errorElement);
});

// ============================================================================
// NFR-A2: axe-core assertions
// ============================================================================

// Note: axe-core checks are run as part of the scenarios above.
// Additional dedicated axe-core scan for the full SetupPage:

Then("SetupPage passes axe-core accessibility checks", async ({ page }) => {
  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
  expect(accessibilityScanResults.violations).toEqual([]);
});

// ============================================================================
// NFR-R1: Responsive layout
// ============================================================================

Given(
  "user opens SetupPage at viewport width {int}px",
  async ({ page }, width: number) => {
    const DEFAULT_VIEWPORT_HEIGHT = 800;
    await page.setViewportSize({ width, height: DEFAULT_VIEWPORT_HEIGHT });
    await page.goto("/setup");
    await page.waitForLoadState("networkidle");
  },
);

When("user expands the Supabase setup section", async ({ page }) => {
  await expandSupabaseSection(page);
});

Then("Supabase URL input is visible and usable", async ({ page }) => {
  const urlInput = page.getByTestId("setup-supabase-url-input");
  await expect(urlInput).toBeVisible();
  await expect(urlInput).toBeEnabled();
  // Verify input is not clipped — has reasonable width
  const box = await urlInput.boundingBox();
  expect(box).not.toBeNull();
  const MINIMUM_INPUT_WIDTH = 100;
  expect(box?.width).toBeGreaterThan(MINIMUM_INPUT_WIDTH);
});

Then("Anon Key input is visible and usable", async ({ page }) => {
  const anonKeyInput = page.getByTestId("setup-supabase-anon-key-input");
  await expect(anonKeyInput).toBeVisible();
  await expect(anonKeyInput).toBeEnabled();
  const box = await anonKeyInput.boundingBox();
  expect(box).not.toBeNull();
  const MINIMUM_INPUT_WIDTH = 100;
  expect(box?.width).toBeGreaterThan(MINIMUM_INPUT_WIDTH);
});

Then("Connect button is visible", async ({ page }) => {
  const connectButton = page.getByTestId("setup-supabase-connect-button");
  await expect(connectButton).toBeVisible();
});
