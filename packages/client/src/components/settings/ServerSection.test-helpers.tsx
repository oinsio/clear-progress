import {
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react/pure";
import { type Mock, vi } from "vitest";
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

/**
 * Sets up mocks and navigates through the Supabase flow to the OTP phase:
 * configure mocks → render → fill supabase form → wait for email → fill email → send OTP.
 */
export async function navigateToOtpPhase(options: {
  mockGetSupabaseClient: Mock;
  mockFetchSupabaseProviders: Mock;
  extraAuthMethods?: Record<string, Mock>;
  email?: string;
}) {
  const {
    mockGetSupabaseClient,
    mockFetchSupabaseProviders,
    extraAuthMethods = {},
    email = "user@example.com",
  } = options;
  const mockSignInWithOtp = vi.fn().mockResolvedValue({ error: null });
  mockGetSupabaseClient.mockReturnValue({
    auth: { signInWithOtp: mockSignInWithOtp, ...extraAuthMethods },
  });
  mockFetchSupabaseProviders.mockResolvedValue({
    oauthProviders: ["google"],
    isEmailEnabled: true,
  });

  render(<ServerSection />);
  fillAndSubmitSupabase();

  await waitFor(() => {
    expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
  });

  fireEvent.change(screen.getByTestId("server-email-input"), {
    target: { value: email },
  });
  fireEvent.click(screen.getByTestId("server-email-send"));
}
