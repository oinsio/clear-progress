// Shared helpers for gas_setup_ui step definitions
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import type { Mock } from "vitest";
import { vi } from "vitest";
import SetupPage from "@/pages/SetupPage";

export function renderSetupPage() {
  return render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );
}

export function createDefaultAuthMock() {
  return {
    accessToken: null,
    userEmail: null,
    signIn: vi.fn(),
    signOut: vi.fn(),
    silentRefresh: vi.fn(),
    userPicture: null,
  };
}

export function resetSetupMocks(mocks: {
  mockGetConnectionConfig: Mock;
  mockGetSavedConnectionConfig: Mock;
  mockUseAuth: Mock;
}) {
  cleanup();
  vi.clearAllMocks();
  mocks.mockGetConnectionConfig.mockReturnValue(null);
  mocks.mockGetSavedConnectionConfig.mockReturnValue(null);
  mocks.mockUseAuth.mockReturnValue(createDefaultAuthMock());
}

export function createSupabaseClientMock() {
  return {
    auth: { signInWithOAuth: vi.fn(), onAuthStateChange: vi.fn() },
    functions: { invoke: vi.fn() },
  };
}

export function expandGasSection() {
  renderSetupPage();
  // GAS section is open by default in SetupPage (isGasSectionOpen = true)
}

export function expandGasAndFillUrl(url: string) {
  expandGasSection();
  fireEvent.change(screen.getByTestId("setup-url-input"), {
    target: { value: url },
  });
}
