// Verifies NFR-A1, NFR-A2, NFR-A3, NFR-R1 of simplify-backend-connection
import AxeBuilder from "@axe-core/playwright";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const SUPABASE_BUTTON_TIMEOUT_MS = 3000;
const CONNECTION_TIMEOUT_MS = 5000;

// ============================================================================
// Helpers
// ============================================================================

async function selectSupabaseBackend(page: Page): Promise<void> {
  const connectButton = page.getByTestId("server-connect-supabase");
  await connectButton.waitFor({
    state: "visible",
    timeout: SUPABASE_BUTTON_TIMEOUT_MS,
  });
  await connectButton.click();
}

async function fillAndConnect(
  page: Page,
  url = "myproject",
  anonKey = "test-anon-key",
): Promise<void> {
  await page.getByTestId("server-supabase-url").fill(url);
  await page.getByTestId("server-supabase-anon-key").fill(anonKey);
  await page.getByTestId("server-supabase-connect").click();
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
// NFR-A3: Keyboard navigation
// ============================================================================

Given("user opens Settings with Supabase form visible", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
  await selectSupabaseBackend(page);
});

Then("Supabase URL input is focusable via Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const urlInput = page.getByTestId("server-supabase-url");
  await expect(urlInput).toBeFocused();
});

Then("Anon Key input is focusable via Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const anonKeyInput = page.getByTestId("server-supabase-anon-key");
  await expect(anonKeyInput).toBeFocused();
});

Then("Connect button is focusable via Tab", async ({ page }) => {
  await page.keyboard.press("Tab");
  const connectButton = page.getByTestId("server-supabase-connect");
  await expect(connectButton).toBeFocused();
});

When(
  "user fills Supabase URL {string} via keyboard",
  async ({ page }, url: string) => {
    const urlInput = page.getByTestId("server-supabase-url");
    await urlInput.focus();
    await urlInput.fill(url);
  },
);

When(
  "user fills Anon Key {string} via keyboard",
  async ({ page }, anonKey: string) => {
    const anonKeyInput = page.getByTestId("server-supabase-anon-key");
    await anonKeyInput.focus();
    await anonKeyInput.fill(anonKey);
  },
);

When("user activates Connect button via Enter key", async ({ page }) => {
  const connectButton = page.getByTestId("server-supabase-connect");
  await connectButton.focus();
  await page.keyboard.press("Enter");
});

Then("Supabase connection attempt is initiated", async ({ page }) => {
  // Verify loading state appeared (connection was attempted)
  const loading = page.getByTestId("server-supabase-loading");
  const error = page.getByTestId("server-supabase-error");
  // Either loading or error means the connection was attempted
  await expect(loading.or(error)).toBeVisible({
    timeout: CONNECTION_TIMEOUT_MS,
  });
});

// ============================================================================
// NFR-A1: OAuth buttons accessible names
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
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await selectSupabaseBackend(page);

    // Fill form and connect
    await fillAndConnect(page);

    // Wait for OAuth buttons
    await page
      .getByTestId("server-oauth-buttons")
      .waitFor({ state: "visible", timeout: CONNECTION_TIMEOUT_MS });
  },
);

Then(
  "OAuth button for {string} has accessible name {string}",
  async ({ page }, provider: string, expectedName: string) => {
    const button = page.getByTestId(`server-oauth-${provider}`);
    await expect(button).toBeVisible();
    await expect(button).toHaveText(expectedName);
  },
);

// ============================================================================
// NFR-A2: aria-live regions
// ============================================================================

When("user initiates Supabase connection", async ({ page }) => {
  await fillAndConnect(page);
});

Then(
  "a loading indicator with aria-live region is present",
  async ({ page }) => {
    const loading = page.getByTestId("server-supabase-loading");
    await expect(loading).toBeVisible({ timeout: CONNECTION_TIMEOUT_MS });
    await expectAriaLiveRegion(loading);
  },
);

Given(
  "user opens Settings with Supabase connection error",
  async ({ page }) => {
    // Mock settings endpoint to fail
    await page.route("**/auth/v1/settings", (route) =>
      route.fulfill({ status: 500, body: "Internal Server Error" }),
    );
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
    await selectSupabaseBackend(page);
    await fillAndConnect(page);
    // Wait for error to appear
    await page
      .getByTestId("server-supabase-error")
      .waitFor({ state: "visible", timeout: CONNECTION_TIMEOUT_MS });
  },
);

Then("error message is in an aria-live region", async ({ page }) => {
  const errorElement = page.getByTestId("server-supabase-error");
  await expectAriaLiveRegion(errorElement);
});

// ============================================================================
// NFR-A1, NFR-A2, NFR-A3: axe-core assertions
// ============================================================================

Then(
  "Server section passes axe-core accessibility checks",
  async ({ page }) => {
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    expect(accessibilityScanResults.violations).toEqual([]);
  },
);

// ============================================================================
// NFR-R1: Responsive layout
// ============================================================================

Given(
  "user opens Settings at viewport width {int}px",
  async ({ page }, width: number) => {
    const DEFAULT_VIEWPORT_HEIGHT = 800;
    await page.setViewportSize({ width, height: DEFAULT_VIEWPORT_HEIGHT });
    await page.goto("/settings");
    await page.waitForLoadState("networkidle");
  },
);

When("user selects Supabase backend", async ({ page }) => {
  await selectSupabaseBackend(page);
});

Then("Supabase URL input is visible and usable", async ({ page }) => {
  const urlInput = page.getByTestId("server-supabase-url");
  await expect(urlInput).toBeVisible();
  await expect(urlInput).toBeEnabled();
  // Verify input is not clipped — has reasonable width
  const box = await urlInput.boundingBox();
  expect(box).not.toBeNull();
  const MINIMUM_INPUT_WIDTH = 100;
  expect(box?.width).toBeGreaterThan(MINIMUM_INPUT_WIDTH);
});

Then("Anon Key input is visible and usable", async ({ page }) => {
  const anonKeyInput = page.getByTestId("server-supabase-anon-key");
  await expect(anonKeyInput).toBeVisible();
  await expect(anonKeyInput).toBeEnabled();
  const box = await anonKeyInput.boundingBox();
  expect(box).not.toBeNull();
  const MINIMUM_INPUT_WIDTH = 100;
  expect(box?.width).toBeGreaterThan(MINIMUM_INPUT_WIDTH);
});

Then("Connect button is visible", async ({ page }) => {
  const connectButton = page.getByTestId("server-supabase-connect");
  await expect(connectButton).toBeVisible();
});
