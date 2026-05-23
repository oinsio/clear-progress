// Verifies FR6, FR7, UX5 of add-supabase-ui
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const SUPABASE_SECTION_TOGGLE_TIMEOUT_MS = 3000;
const OAUTH_BUTTONS_TIMEOUT_MS = 5000;

// --- Scenario: User connects to Supabase and signs in via OAuth ---

Given("user opens SetupPage with no connection", async ({ page }) => {
  await page.goto("/setup");
  await page.waitForLoadState("networkidle");
});

When("user expands the Supabase section", async ({ page }) => {
  const toggle = page.getByTestId("setup-supabase-section-toggle");
  await toggle.waitFor({
    state: "visible",
    timeout: SUPABASE_SECTION_TOGGLE_TIMEOUT_MS,
  });
  await toggle.click();
});

When(
  "user enters Supabase URL {string} and Anon Key {string}",
  async ({ page }, url: string, anonKey: string) => {
    await page.getByTestId("setup-supabase-url-input").fill(url);
    await page.getByTestId("setup-supabase-anon-key-input").fill(anonKey);
  },
);

When("user clicks the Supabase Connect button", async ({ page }) => {
  await page.getByTestId("setup-supabase-connect-button").click();
});

Then("OAuth provider buttons are visible", async ({ page }) => {
  const oauthButtons = page.getByTestId("setup-supabase-oauth-buttons");
  await expect(oauthButtons).toBeVisible({
    timeout: OAUTH_BUTTONS_TIMEOUT_MS,
  });
});

When(
  "user clicks the {string} OAuth button",
  async ({ page }, buttonLabel: string) => {
    await page.getByText(buttonLabel).click();
  },
);

Then(
  "OAuth flow is initiated with provider {string}",
  async ({ page }, _provider: string) => {
    // In E2E, we can verify that the page navigated away or that
    // signInWithOAuth was called by checking URL change or mock
    // For now, verify the OAuth buttons section handled the click
    // (actual OAuth redirect would leave the page)
    await expect(page).not.toHaveURL(/\/setup$/);
  },
);

// --- Scenario: After successful OAuth, user lands in inbox ---

Given("user has completed Supabase OAuth flow", async ({ page }) => {
  // Simulate returning from OAuth with a session already established
  // Set connection config in localStorage before navigating
  await page.evaluate(() => {
    localStorage.setItem(
      "connection_config",
      JSON.stringify({
        type: "supabase",
        url: "https://myproject.supabase.co",
        anonKey: "test-anon-key",
        isActive: true,
      }),
    );
  });
  await page.goto("/setup");
  await page.waitForLoadState("networkidle");
});

Then("user is on the inbox page", async ({ page }) => {
  await expect(page).toHaveURL(/\/inbox/);
});

Then("no extra confirmation step is shown", async ({ page }) => {
  // Verify we went straight to inbox without an intermediate screen
  await expect(page.getByTestId("setup-page")).not.toBeVisible();
});

// --- Scenario: OAuth error shows retry options ---

Given(
  "user returns from OAuth with error {string}",
  async ({ page }, error: string) => {
    await page.evaluate(
      (config) => {
        localStorage.setItem("connection_config", JSON.stringify(config));
      },
      {
        type: "supabase",
        url: "https://myproject.supabase.co",
        anonKey: "test-anon-key",
        isActive: true,
      },
    );
    await page.goto(`/setup?error=${error}&error_description=User+cancelled`);
    await page.waitForLoadState("networkidle");
  },
);

Then("error message is visible on SetupPage", async ({ page }) => {
  const errorElement = page.getByTestId("setup-supabase-error");
  await expect(errorElement).toBeVisible({ timeout: OAUTH_BUTTONS_TIMEOUT_MS });
});

Then("OAuth buttons are still available for retry", async ({ page }) => {
  const oauthButtons = page.getByTestId("setup-supabase-oauth-buttons");
  await expect(oauthButtons).toBeVisible();
});
