import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AddTaskInput } from "./AddTaskInput";

vi.mock("@/hooks/useShowCheckbox");

import { useShowCheckbox } from "@/hooks/useShowCheckbox";

function renderInput(
  overrides: {
    targetBox?: string;
    onAdd?: (name: string) => Promise<void>;
    onCancel?: () => void;
  } = {},
) {
  const props = {
    targetBox: "Входящие",
    onAdd: vi.fn().mockResolvedValue(undefined),
    onCancel: vi.fn(),
    ...overrides,
  };
  render(<AddTaskInput {...props} />);
  return props;
}

describe("AddTaskInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useShowCheckbox).mockReturnValue(true);
  });

  it("should render the input field", () => {
    renderInput();
    expect(screen.getByTestId("add-task-input")).toBeInTheDocument();
  });

  it("should call onAdd with trimmed value when Enter is pressed", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderInput({ onAdd });
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "  Новая задача  " } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith("Новая задача");
    });
  });

  it("should not call onAdd when Enter is pressed with empty value", () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderInput({ onAdd });
    const input = screen.getByTestId("add-task-input");
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("should not call onAdd when Enter is pressed with only whitespace", () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderInput({ onAdd });
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onAdd).not.toHaveBeenCalled();
  });

  it("should call onCancel when Escape is pressed", () => {
    const onCancel = vi.fn();
    renderInput({ onCancel });
    const input = screen.getByTestId("add-task-input");
    fireEvent.keyDown(input, { key: "Escape" });
    expect(onCancel).toHaveBeenCalled();
  });

  it("should call onCancel when input loses focus with empty value", () => {
    const onCancel = vi.fn();
    renderInput({ onCancel });
    const input = screen.getByTestId("add-task-input");
    fireEvent.blur(input);
    expect(onCancel).toHaveBeenCalled();
  });

  it("should call onAdd with trimmed value when input loses focus with non-empty value", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderInput({ onAdd });
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "  Задача на iOS  " } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(onAdd).toHaveBeenCalledWith("Задача на iOS");
    });
  });

  it("should not call onCancel when input loses focus with non-empty value", async () => {
    const onCancel = vi.fn();
    renderInput({ onCancel });
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Задача" } });
    fireEvent.blur(input);
    await waitFor(() => {
      expect(onCancel).not.toHaveBeenCalled();
    });
  });

  it("should clear the input value after successful add", async () => {
    const onAdd = vi.fn().mockResolvedValue(undefined);
    renderInput({ onAdd });
    const input = screen.getByTestId("add-task-input");
    fireEvent.change(input, { target: { value: "Задача" } });
    fireEvent.keyDown(input, { key: "Enter" });
    await waitFor(() => {
      expect(input).toHaveValue("");
    });
  });

  it("should show checkbox when useShowCheckbox returns true", () => {
    vi.mocked(useShowCheckbox).mockReturnValue(true);
    renderInput();
    const checkbox = screen
      .getByTestId("add-task-input")
      .parentElement?.querySelector(".rounded-full");
    expect(checkbox).toBeInTheDocument();
  });

  it("should hide checkbox when useShowCheckbox returns false", () => {
    vi.mocked(useShowCheckbox).mockReturnValue(false);
    renderInput();
    const checkbox = screen
      .getByTestId("add-task-input")
      .parentElement?.querySelector(".rounded-full");
    expect(checkbox).not.toBeInTheDocument();
  });
});
