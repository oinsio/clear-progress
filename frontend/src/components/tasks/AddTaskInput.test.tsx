import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AddTaskInput } from "./AddTaskInput";

function renderInput(
  overrides: {
    targetBox?: string;
    onAdd?: (title: string) => Promise<void>;
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
});
