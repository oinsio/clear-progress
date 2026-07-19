// Shared UI interaction helpers for integration tests: attachment actions.
// Split from page-actions.ts (process-invariants file-size cap).
import type { Page } from "@playwright/test";

// ---------------------------------------------------------------------------
// Attachment actions
// ---------------------------------------------------------------------------

export async function deleteFirstAttachment(page: Page): Promise<void> {
  await page.locator('[data-testid^="attachment-delete-"]').first().click();
  const confirmButton = page.getByTestId("confirm-dialog-confirm");
  if (await confirmButton.isVisible().catch(() => false)) {
    await confirmButton.click();
  }
}

export async function attachFileToEntity(
  page: Page,
  file: { name: string; mimeType: string; buffer: Buffer },
): Promise<void> {
  await page.getByTestId("tab-attachments").click();
  await page.getByTestId("attach-file-input").setInputFiles(file);
  await page
    .locator('[data-testid^="attachment-item-"]')
    .first()
    .waitFor({ state: "visible" });
}
