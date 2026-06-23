import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ErrorFallback } from "./ErrorFallback";

describe("ErrorFallback", () => {
  it("should render heading with error title translation", () => {
    render(<ErrorFallback />);
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Что-то пошло не так",
    );
  });

  it("should render description with error description translation", () => {
    render(<ErrorFallback />);
    expect(
      screen.getByText(
        "Произошла непредвиденная ошибка. Попробуйте перезагрузить приложение.",
      ),
    ).toBeInTheDocument();
  });

  it("should render reload button with error reload translation", () => {
    render(<ErrorFallback />);
    expect(screen.getByRole("button")).toHaveTextContent("Перезагрузить");
  });

  it("should call window.location.reload when reload button is clicked", async () => {
    const mockReload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, "location", {
      value: { ...originalLocation, reload: mockReload },
      writable: true,
      configurable: true,
    });

    render(<ErrorFallback />);
    await userEvent.click(screen.getByRole("button"));
    expect(mockReload).toHaveBeenCalled();

    Object.defineProperty(window, "location", {
      value: originalLocation,
      writable: true,
      configurable: true,
    });
  });
});
