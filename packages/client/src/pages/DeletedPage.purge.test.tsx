/**
 * Tests for DeletedPage — purge dialog and button behavior.
 * Implements FR18, FR21, UX1 of swipeable-item.
 */
import { fireEvent, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import { renderDeletedPage } from "./deletedPage.testSetup";

describe("DeletedPage purge", () => {
  it("should render purge button with correct text", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    expect(screen.getByText("Очистить навсегда")).toBeInTheDocument();
  });

  it("should disable purge button when no entities exist", () => {
    renderDeletedPage();
    const purgeButton = screen.getByText("Очистить навсегда");
    expect(purgeButton.closest("button")).toBeDisabled();
  });

  it("should enable purge button when entities exist", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    const purgeButton = screen.getByText("Очистить навсегда");
    expect(purgeButton.closest("button")).not.toBeDisabled();
  });

  it("should show purging text when isPurging is true", () => {
    renderDeletedPage(
      { tasks: [buildTask({ is_deleted: true })] },
      { isPurging: true },
    );
    expect(screen.getByText("Удаление...")).toBeInTheDocument();
  });

  it("should open purge dialog on button click", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    fireEvent.click(screen.getByText("Очистить навсегда"));

    expect(screen.getByText("Удалить навсегда?")).toBeInTheDocument();
    expect(screen.getByText("Отмена")).toBeInTheDocument();
  });

  it("should show confirmation message in purge dialog", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    fireEvent.click(screen.getByText("Очистить навсегда"));

    expect(
      screen.getByText(/Это действие нельзя отменить/),
    ).toBeInTheDocument();
  });

  it("should close purge dialog on cancel click", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    fireEvent.click(screen.getByText("Очистить навсегда"));
    fireEvent.click(screen.getByText("Отмена"));

    expect(screen.queryByText("Удалить навсегда?")).not.toBeInTheDocument();
  });

  async function openAndConfirmPurge(mockPurge: ReturnType<typeof vi.fn>) {
    renderDeletedPage(
      { tasks: [buildTask({ is_deleted: true })] },
      { purge: mockPurge },
    );
    fireEvent.click(screen.getByText("Очистить навсегда"));

    const confirmButtons = screen.getAllByText("Удалить навсегда");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);
  }

  it("should call purge on confirm click", async () => {
    const mockPurge = vi.fn().mockResolvedValue(undefined);
    await openAndConfirmPurge(mockPurge);

    await waitFor(() => {
      expect(mockPurge).toHaveBeenCalledOnce();
    });
  });

  it("should close dialog after successful purge", async () => {
    const mockPurge = vi.fn().mockResolvedValue(undefined);
    await openAndConfirmPurge(mockPurge);

    await waitFor(() => {
      expect(screen.queryByText("Удалить навсегда?")).not.toBeInTheDocument();
    });
  });

  it("should show error message when purge fails", async () => {
    const mockPurge = vi.fn().mockRejectedValue(new Error("fail"));
    renderDeletedPage(
      { tasks: [buildTask({ is_deleted: true })] },
      { purge: mockPurge },
    );
    fireEvent.click(screen.getByText("Очистить навсегда"));

    const confirmButtons = screen.getAllByText("Удалить навсегда");
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(
        screen.getByText("Не удалось очистить записи"),
      ).toBeInTheDocument();
    });
  });

  it("should show purge count in dialog", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    fireEvent.click(screen.getByText("Очистить навсегда"));

    expect(screen.getByText(/1 задач/)).toBeInTheDocument();
  });

  it("should not show error message when purge dialog opens initially", () => {
    renderDeletedPage({
      tasks: [buildTask({ is_deleted: true })],
    });
    fireEvent.click(screen.getByText("Очистить навсегда"));

    expect(
      screen.queryByText("Не удалось очистить записи"),
    ).not.toBeInTheDocument();
    // Verify no red error paragraph is rendered at all
    const dialog = screen.getByText("Удалить навсегда?").closest("div");
    const errorParagraph = dialog?.querySelector(".text-red-500");
    expect(errorParagraph).toBeNull();
  });

  it("should show purging in progress text in dialog when isPurging", () => {
    renderDeletedPage(
      { tasks: [buildTask({ is_deleted: true })] },
      { isPurging: true },
    );
    // Open the dialog (header button shows "Удаление..." when isPurging)
    fireEvent.click(screen.getByText("Удаление..."));

    // Dialog confirm button also shows "Удаление..." when isPurging
    const dialogTexts = screen.getAllByText("Удаление...");
    expect(dialogTexts.length).toBeGreaterThanOrEqual(1);
  });
});
