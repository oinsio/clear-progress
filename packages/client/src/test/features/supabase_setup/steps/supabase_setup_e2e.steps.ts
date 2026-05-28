// Verifies FR3, FR8, FR14 of simplify-backend-connection
import { expect } from "@playwright/test";
import { createBdd } from "playwright-bdd";

const { Given, When, Then } = createBdd();

const SUPABASE_BUTTON_TIMEOUT_MS = 3000;
const OAUTH_BUTTONS_TIMEOUT_MS = 5000;

// --- Scenario: User connects to Supabase and initiates OAuth sign-in ---

Given("user opens Settings with no connection", async ({ page }) => {
  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
});

When("user selects Supabase backend", async ({ page }) => {
  const connectButton = page.getByTestId("server-connect-supabase");
  await connectButton.waitFor({
    state: "visible",
    timeout: SUPABASE_BUTTON_TIMEOUT_MS,
  });
  await connectButton.click();
});

When(
  "user enters Supabase URL {string} and Anon Key {string}",
  async ({ page }, url: string, anonKey: string) => {
    await page.getByTestId("server-supabase-url").fill(url);
    await page.getByTestId("server-supabase-anon-key").fill(anonKey);
  },
);

When("user submits the Supabase connection form", async ({ page }) => {
  await page.getByTestId("server-supabase-connect").click();
});

Then("OAuth provider buttons are visible", async ({ page }) => {
  const oauthButtons = page.getByTestId("server-oauth-buttons");
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
    // In E2E, we verify that the page navigated away from /settings
    // (actual OAuth redirect would leave the page)
    await expect(page).not.toHaveURL(/\/settings$/);
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
  await page.goto("/settings");
  await page.waitForLoadState("networkidle");
});

Then("user is on the inbox page", async ({ page }) => {
  await expect(page).toHaveURL(/\/inbox/);
});

// --- Scenario: OAuth error shows retry options on Settings page ---

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
    await page.goto(
      `/settings?error=${error}&error_description=User+cancelled`,
    );
    await page.waitForLoadState("networkidle");
  },
);

Then("error message is visible on Settings page", async ({ page }) => {
  const errorElement = page.getByTestId("server-supabase-error");
  await expect(errorElement).toBeVisible({
    timeout: OAUTH_BUTTONS_TIMEOUT_MS,
  });
});

Then("OAuth buttons are still available for retry", async ({ page }) => {
  const oauthButtons = page.getByTestId("server-oauth-buttons");
  await expect(oauthButtons).toBeVisible();
});
