// Shared UI interaction helpers for integration tests: checklist actions.
// Split from page-actions.ts (process-invariants file-size cap).
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Checklist actions
// ---------------------------------------------------------------------------

export async function switchToChecklistTab(page: Page): Promise<void> {
  await page.getByTestId("tab-checklist").click();
}

export async function addChecklistItem(
  page: Page,
  itemName: string,
): Promise<void> {
  const checklistInput = page
    .getByTestId("task-detail-panel")
    .locator('input[type="text"]');
  await checklistInput.fill(itemName);
  await checklistInput.press("Enter");
  await page
    .getByTestId("task-detail-panel")
    .locator(`text=${itemName}`)
    .waitFor({ state: "visible" });
}
