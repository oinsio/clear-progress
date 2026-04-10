import { test, expect } from "@playwright/test";

test.describe("Interface Scale", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/settings");
    await page.waitForSelector('[data-test-id="settings-interface-scale"]');
  });

  test("should apply data-scale attribute when clicking scale buttons", async ({
    page,
  }) => {
    const scales = ["small", "normal", "large", "xLarge"];

    for (const scale of scales) {
      await page.click(`[data-test-id="settings-scale-option-${scale}"]`);

      const dataScale = await page.evaluate(() =>
        document.documentElement.getAttribute("data-scale"),
      );

      expect(dataScale).toBe(scale);
    }
  });

  test("should update CSS variable --scale-factor for each scale", async ({
    page,
  }) => {
    const scaleValues = {
      small: "0.875",
      normal: "1",
      large: "1.125",
      xLarge: "1.25",
    };

    for (const [scale, expectedValue] of Object.entries(scaleValues)) {
      await page.click(`[data-test-id="settings-scale-option-${scale}"]`);

      const scaleFactor = await page.evaluate(() =>
        getComputedStyle(document.documentElement)
          .getPropertyValue("--scale-factor")
          .trim(),
      );

      expect(scaleFactor).toBe(expectedValue);
    }
  });

  test("should persist selected scale in localStorage and restore on reload", async ({
    page,
  }) => {
    await page.click('[data-test-id="settings-scale-option-large"]');

    let dataScale = await page.evaluate(() =>
      document.documentElement.getAttribute("data-scale"),
    );
    expect(dataScale).toBe("large");

    await page.reload();
    await page.waitForSelector('[data-test-id="settings-interface-scale"]');

    dataScale = await page.evaluate(() =>
      document.documentElement.getAttribute("data-scale"),
    );
    expect(dataScale).toBe("large");

    const scaleFactor = await page.evaluate(() =>
      getComputedStyle(document.documentElement)
        .getPropertyValue("--scale-factor")
        .trim(),
    );
    expect(scaleFactor).toBe("1.125");

    const isPressed = await page.getAttribute(
      '[data-test-id="settings-scale-option-large"]',
      "aria-pressed",
    );
    expect(isPressed).toBe("true");
  });

  test("should visually change body font-size based on scale", async ({
    page,
  }) => {
    await page.click('[data-test-id="settings-scale-option-normal"]');

    const normalFontSize = await page.evaluate(() => {
      const fontSize = getComputedStyle(document.body).fontSize;
      return parseFloat(fontSize);
    });

    await page.click('[data-test-id="settings-scale-option-xLarge"]');

    const xLargeFontSize = await page.evaluate(() => {
      const fontSize = getComputedStyle(document.body).fontSize;
      return parseFloat(fontSize);
    });

    expect(xLargeFontSize).toBeCloseTo(normalFontSize * 1.25, 1);
  });

  test("should highlight selected scale button", async ({ page }) => {
    await page.click('[data-test-id="settings-scale-option-small"]');

    const smallPressed = await page.getAttribute(
      '[data-test-id="settings-scale-option-small"]',
      "aria-pressed",
    );
    expect(smallPressed).toBe("true");

    const normalPressed = await page.getAttribute(
      '[data-test-id="settings-scale-option-normal"]',
      "aria-pressed",
    );
    expect(normalPressed).toBe("false");

    await page.click('[data-test-id="settings-scale-option-xLarge"]');

    const xLargePressed = await page.getAttribute(
      '[data-test-id="settings-scale-option-xLarge"]',
      "aria-pressed",
    );
    expect(xLargePressed).toBe("true");

    const smallPressedAfter = await page.getAttribute(
      '[data-test-id="settings-scale-option-small"]',
      "aria-pressed",
    );
    expect(smallPressedAfter).toBe("false");
  });
});
