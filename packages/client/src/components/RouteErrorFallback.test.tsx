import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const mockRouteError = new Error("Test route error");

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useRouteError: () => mockRouteError };
});

import { RouteErrorFallback } from "./RouteErrorFallback";

describe("RouteErrorFallback", () => {
  it("should log route error with prefix and render ErrorFallback content", () => {
    const consoleErrorSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    render(<RouteErrorFallback />);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "[RouteErrorFallback]",
      mockRouteError,
    );
    expect(screen.getByRole("heading")).toHaveTextContent(
      "Что-то пошло не так",
    );

    consoleErrorSpy.mockRestore();
  });
});
