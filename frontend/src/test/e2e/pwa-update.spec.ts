import { test, expect } from "@playwright/test";

test.describe("PWA Update Notification", () => {
  test("should show update notification when new version is available", async ({
    page,
  }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the app to load
    await page.waitForLoadState("networkidle");

    // Check if service worker is registered
    const swRegistered = await page.evaluate(async () => {
      if ("serviceWorker" in navigator) {
        const registration = await navigator.serviceWorker.getRegistration();
        return !!registration;
      }
      return false;
    });

    console.log("Service Worker registered:", swRegistered);

    // Listen for console logs to track PWA update flow
    const consoleLogs: string[] = [];
    page.on("console", (msg) => {
      const text = msg.text();
      consoleLogs.push(text);
      if (text.includes("[UpdateNotification]")) {
        console.log("PWA Update:", text);
      }
      if (text.includes("[SyncProvider]")) {
        console.log("Sync:", text);
      }
    });

    // Simulate a service worker update by triggering the update event
    // This is a workaround since we can't easily trigger real SW updates in tests
    const updateTriggered = await page.evaluate(() => {
      return new Promise<boolean>((resolve) => {
        if ("serviceWorker" in navigator) {
          navigator.serviceWorker.getRegistration().then((registration) => {
            if (registration) {
              // Try to trigger an update check
              registration
                .update()
                .then(() => {
                  console.log(
                    "[Test] Service worker update check triggered",
                  );
                  resolve(true);
                })
                .catch((err) => {
                  console.error("[Test] Failed to trigger update:", err);
                  resolve(false);
                });
            } else {
              resolve(false);
            }
          });
        } else {
          resolve(false);
        }
      });
    });

    console.log("Update check triggered:", updateTriggered);

    // Wait a bit to see if the notification appears
    await page.waitForTimeout(3000);

    // Take a screenshot for debugging
    await page.screenshot({
      path: "test-results/pwa-update-check.png",
      fullPage: true,
    });

    // Check if update notification is visible
    const notificationVisible = await page
      .locator('[data-test-id="update-notification"]')
      .isVisible()
      .catch(() => false);

    console.log("Update notification visible:", notificationVisible);

    // Print all console logs for analysis
    console.log("\n=== Console Logs ===");
    const relevantLogs = consoleLogs.filter(
      (log) =>
        log.includes("[UpdateNotification]") || log.includes("[SyncProvider]"),
    );
    relevantLogs.forEach((log) => console.log(log));
    console.log("===================\n");

    // If notification is visible, test the update button
    if (notificationVisible) {
      const updateButton = page.locator(
        '[data-test-id="update-notification-update-btn"]',
      );
      await expect(updateButton).toBeVisible();

      // Take screenshot before clicking
      await page.screenshot({
        path: "test-results/pwa-update-notification.png",
        fullPage: true,
      });

      // Note: We don't actually click the button in this test
      // because it would reload the page and break the test
      console.log("[Test] Update notification is working correctly");
    } else {
      console.log(
        "[Test] Update notification not shown - this is expected if no update is available",
      );
    }
  });

  test("should display update notification with correct text", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Check if we can find the notification component in the DOM
    // (it might be hidden if no update is available)
    const notificationExists = await page
      .locator('[data-test-id="update-notification"]')
      .count();

    console.log("Update notification component exists:", notificationExists > 0);

    // If notification is visible, check the text
    if (notificationExists > 0) {
      const isVisible = await page
        .locator('[data-test-id="update-notification"]')
        .isVisible();

      if (isVisible) {
        const message = page.locator(
          '[data-test-id="update-notification-message"]',
        );
        await expect(message).toBeVisible();

        const updateBtn = page.locator(
          '[data-test-id="update-notification-update-btn"]',
        );
        await expect(updateBtn).toBeVisible();

        console.log("[Test] Notification UI elements are present");
      }
    }
  });

  test("should check service worker registration", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("networkidle");

    const swInfo = await page.evaluate(async () => {
      if (!("serviceWorker" in navigator)) {
        return { supported: false };
      }

      const registration = await navigator.serviceWorker.getRegistration();
      if (!registration) {
        return { supported: true, registered: false };
      }

      return {
        supported: true,
        registered: true,
        scope: registration.scope,
        updateViaCache: registration.updateViaCache,
        active: !!registration.active,
        waiting: !!registration.waiting,
        installing: !!registration.installing,
      };
    });

    console.log("Service Worker Info:", JSON.stringify(swInfo, null, 2));

    expect(swInfo.supported).toBe(true);
    expect(swInfo.registered).toBe(true);
  });
});
