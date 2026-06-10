// Shared test helpers for server_connection step definitions
// implements FR1, FR2, FR3, FR4 of simplify-backend-connection

// IMPORTANT: re-export mocks BEFORE importing app modules
// so that vi.mock registrations in serverSectionMocks run first.
export * from "./serverSectionMocks";

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import { expect, vi } from "vitest";
import { ServerSection } from "@/components/settings/ServerSection";
import {
  mockConnect,
  mockDisconnect,
  mockFetchSupabaseProviders,
  mockGetSavedConnectionConfig,
  mockInit,
  mockPing,
  mockSignInWithOAuth,
  mockSignInWithOtp,
  mockTriggerFullSync,
  mockUseAuth,
  mockUseConnectionConfig,
  mockUseConnectionStatus,
  mockUseSync,
  mockVerifyOtp,
} from "./serverSectionMocks";

export function resetMocks(): void {
  setDefaultMockValues();
  cleanup();
  mockConnect.mockReset();
  mockDisconnect.mockReset();
  mockPing.mockReset();
  mockInit.mockReset();
  mockGetSavedConnectionConfig.mockReset();
  mockFetchSupabaseProviders.mockReset();
  mockSignInWithOAuth.mockReset();
  mockSignInWithOtp.mockReset();
  mockVerifyOtp.mockReset();
  mockTriggerFullSync.mockReset();
  mockUseAuth.mockReset();
  mockUseSync.mockReset();
  mockUseConnectionConfig.mockReset();
  mockUseConnectionStatus.mockReset();
  setDefaultMockValues();
}

function setDefaultMockValues(): void {
  mockUseConnectionConfig.mockReturnValue(null);
  mockUseConnectionStatus.mockReturnValue("not_configured");
  mockGetSavedConnectionConfig.mockReturnValue(null);
  mockFetchSupabaseProviders.mockResolvedValue({
    oauthProviders: [],
    isEmailEnabled: false,
  });
  mockUseAuth.mockReturnValue({
    accessToken: null,
    userEmail: null,
    userPicture: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
  });
  mockUseSync.mockReturnValue({
    syncStatus: "idle",
    triggerFullSync: vi.fn(),
  });
}

interface RenderOptions {
  oauthError?: string;
}

export function renderServerSection(options?: RenderOptions) {
  return render(
    <MemoryRouter>
      <ServerSection oauthError={options?.oauthError} />
    </MemoryRouter>,
  );
}

export function selectSupabase(): void {
  renderServerSection();
  fireEvent.click(screen.getByTestId("server-connect-supabase"));
}

export function selectGas(): void {
  renderServerSection();
  fireEvent.click(screen.getByTestId("server-connect-gas"));
}

export function fillSupabaseForm(url: string, anonKey: string): void {
  fireEvent.change(screen.getByTestId("server-supabase-url"), {
    target: { value: url },
  });
  fireEvent.change(screen.getByTestId("server-supabase-anon-key"), {
    target: { value: anonKey },
  });
}

export function fillGasForm(url: string, clientId: string): void {
  fireEvent.change(screen.getByTestId("server-gas-url"), {
    target: { value: url },
  });
  fireEvent.change(screen.getByTestId("server-gas-client-id"), {
    target: { value: clientId },
  });
}

export async function navigateToOtpScreen(): Promise<void> {
  mockFetchSupabaseProviders.mockResolvedValue({
    oauthProviders: ["google"],
    isEmailEnabled: true,
  });
  fillSupabaseForm("myproject", "test-key");
  fireEvent.click(screen.getByTestId("server-supabase-connect"));
  await waitFor(() => {
    expect(screen.getByTestId("server-email-input")).toBeInTheDocument();
  });

  mockSignInWithOtp.mockResolvedValue({ data: {}, error: null });
  fireEvent.change(screen.getByTestId("server-email-input"), {
    target: { value: "user@example.com" },
  });
  fireEvent.click(screen.getByTestId("server-email-send"));
  await waitFor(() => {
    expect(screen.getByTestId("server-otp-input")).toBeInTheDocument();
  });
}
