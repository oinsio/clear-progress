import { fireEvent, render, screen } from "@testing-library/react/pure";
import type { Mock } from "vitest";
import { ServerSection } from "./ServerSection";

export const SUPABASE_CONFIG = {
  type: "supabase" as const,
  url: "https://test.supabase.co",
  anonKey: "key",
};

export function fillAndSubmitSupabase(
  url = "https://test.supabase.co",
  anonKey = "test-key",
) {
  fireEvent.click(screen.getByTestId("server-connect-supabase"));
  fireEvent.change(screen.getByTestId("server-supabase-url"), {
    target: { value: url },
  });
  fireEvent.change(screen.getByTestId("server-supabase-anon-key"), {
    target: { value: anonKey },
  });
  fireEvent.click(screen.getByTestId("server-supabase-connect"));
}

export function fillAndSubmitGas(
  url = "https://script.google.com/macros/s/ABC/exec",
  clientId = "client-123",
) {
  fireEvent.click(screen.getByTestId("server-connect-gas"));
  fireEvent.change(screen.getByTestId("server-gas-url"), {
    target: { value: url },
  });
  fireEvent.change(screen.getByTestId("server-gas-client-id"), {
    target: { value: clientId },
  });
  fireEvent.click(screen.getByTestId("server-gas-connect"));
}

export function renderWithConnection(
  mockUseConnectionConfig: Mock,
  config = SUPABASE_CONFIG,
) {
  mockUseConnectionConfig.mockReturnValue(config);
  return render(<ServerSection />);
}
