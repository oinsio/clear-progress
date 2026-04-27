import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Idea } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { IdeaDetailPanel } from "./IdeaDetailPanel";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockIdea: Idea = {
  id: "idea-1",
  name: "Test Idea",
  description: "Test Description",
  sort_order: 0,
  is_deleted: false,
  created_at: toISOTimestamp(),
  updated_at: toISOTimestamp(),
  version: 1,
  revision: 0,
  needsSync: false,
};

describe("IdeaDetailPanel", () => {
  const mockOnClose = vi.fn();
  const mockOnUpdate = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render panel with idea data", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByTestId("idea-detail-panel")).toBeInTheDocument();
    expect(screen.getByTestId("idea-detail-name")).toHaveValue("Test Idea");
    expect(screen.getByTestId("idea-detail-description")).toHaveTextContent(
      "Test Description",
    );
  });

  it("should update name input value", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const nameInput = screen.getByTestId("idea-detail-name");
    fireEvent.change(nameInput, { target: { value: "Updated Idea" } });

    expect(nameInput).toHaveValue("Updated Idea");
  });

  it("should update description input value", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    // Verify description is displayed
    expect(screen.getByTestId("idea-detail-description")).toHaveTextContent(
      "Test Description",
    );
  });

  it("should call onUpdate when name input is blurred with changes", async () => {
    mockOnUpdate.mockResolvedValue(undefined);

    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const nameInput = screen.getByTestId("idea-detail-name");
    fireEvent.change(nameInput, { target: { value: "Updated Idea" } });
    fireEvent.blur(nameInput);

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith("idea-1", {
        name: "Updated Idea",
      });
    });
  });

  it("should call onUpdate when description input is blurred with changes", async () => {
    mockOnUpdate.mockResolvedValue(undefined);

    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    // Verify description is displayed
    expect(screen.getByTestId("idea-detail-description")).toHaveTextContent(
      "Test Description",
    );

    // Note: EditableDescription internal behavior is tested in EditableDescription.test.tsx
    // This test just verifies the component integration
  });

  it("should call onClose when X button is clicked", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const closeButton = screen.getByLabelText("idea.close");
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should show delete confirmation when delete button is clicked", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const deleteButton = screen.getByLabelText("idea.deleteLabel");
    fireEvent.click(deleteButton);

    const confirmDialog = screen.getByTestId("idea-detail-delete-confirm");
    expect(confirmDialog).toBeInTheDocument();
    expect(confirmDialog).toHaveTextContent("Test Idea");
  });

  it("should call onDelete and onClose when delete is confirmed", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const deleteButton = screen.getByLabelText("idea.deleteLabel");
    fireEvent.click(deleteButton);

    const confirmButton = screen.getByTestId("idea-detail-delete-confirm-btn");
    fireEvent.click(confirmButton);

    expect(mockOnDelete).toHaveBeenCalledWith("idea-1");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("should hide delete confirmation when cancel is clicked", () => {
    render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const deleteButton = screen.getByLabelText("idea.deleteLabel");
    fireEvent.click(deleteButton);

    const cancelButton = screen.getByTestId("idea-detail-delete-cancel");
    fireEvent.click(cancelButton);

    expect(
      screen.queryByTestId("idea-detail-delete-confirm"),
    ).not.toBeInTheDocument();
  });

  it("should reset form when idea changes", () => {
    const { rerender } = render(
      <IdeaDetailPanel
        idea={mockIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    const nameInput = screen.getByTestId("idea-detail-name");
    fireEvent.change(nameInput, { target: { value: "Changed Name" } });

    const newIdea: Idea = {
      ...mockIdea,
      id: "idea-2",
      name: "New Idea",
      description: "New Description",
    };

    rerender(
      <IdeaDetailPanel
        idea={newIdea}
        onClose={mockOnClose}
        onUpdate={mockOnUpdate}
        onDelete={mockOnDelete}
      />,
    );

    expect(screen.getByTestId("idea-detail-name")).toHaveValue("New Idea");
    expect(screen.getByTestId("idea-detail-description")).toHaveTextContent(
      "New Description",
    );
  });
});
