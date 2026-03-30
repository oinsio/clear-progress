import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SetupPage from "./SetupPage";
import { STORAGE_KEYS, ROUTES } from "@/constants";
import { localStorageMock } from "@/test/mocks/localStorageMock";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const { mockPingUrl, mockInit } = vi.hoisted(() => ({
  mockPingUrl: vi.fn(),
  mockInit: vi.fn(),
}));

vi.mock("@/services/defaultServices", () => ({
  defaultApiClient: { pingUrl: mockPingUrl, init: mockInit },
}));

vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/components/tasks/RightFilterPanel");
vi.mock("@/app/providers/AuthProvider");
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useAuth } from "@/app/providers/AuthProvider";

const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUseAuth = vi.mocked(useAuth);

const TEST_URL = "https://script.google.com/macros/s/abc/exec";
const TEST_DEPLOYMENT_ID = "AKfycbxTestDeploymentId";

function renderPage() {
  return render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );
}

describe("SetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockUsePanelOpen.mockReturnValue({ isPanelOpen: false, togglePanelOpen: vi.fn() });
    mockUsePanelSide.mockReturnValue({ panelSide: "right", setPanelSide: vi.fn() });
    mockUseAuth.mockReturnValue({ accessToken: "mock-token", userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
  });

  describe("when no URL is configured", () => {
    it("should render URL input", () => {
      renderPage();
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });

    it("should render connect button", () => {
      renderPage();
      expect(screen.getByTestId("setup-connect-button")).toBeInTheDocument();
    });

    it("should disable connect button when URL input is empty", () => {
      renderPage();
      expect(screen.getByTestId("setup-connect-button")).toBeDisabled();
    });

    it("should enable connect button when URL is entered", () => {
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      expect(screen.getByTestId("setup-connect-button")).not.toBeDisabled();
    });
  });

  describe("when connecting", () => {
    it("should call pingUrl with the entered full URL", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(mockPingUrl).toHaveBeenCalledWith(TEST_URL);
    });

    it("should build full URL from deployment ID and call pingUrl with it", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_DEPLOYMENT_ID },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(mockPingUrl).toHaveBeenCalledWith(
        `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec`,
      );
    });

    it("should save full URL to localStorage when deployment ID is entered", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_DEPLOYMENT_ID },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(
          `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec`,
        );
      });
    });

    it("should show loading state while pinging", () => {
      mockPingUrl.mockReturnValue(new Promise(() => {}));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(screen.getByTestId("setup-loading")).toBeInTheDocument();
    });
  });

  describe("when ping succeeds with initialized: true", () => {
    it("should save URL to localStorage", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(TEST_URL);
      });
    });

    it("should navigate to inbox", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });
  });

  describe("when ping succeeds with initialized: false", () => {
    it("should save URL to localStorage", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(TEST_URL);
      });
    });

    it("should show initialize button", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(screen.getByTestId("setup-initialize-button")).toBeInTheDocument();
      });
    });

    describe("authentication gate", () => {
      async function reachNotInitializedPhase() {
        mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
        renderPage();
        fireEvent.change(screen.getByTestId("setup-url-input"), { target: { value: TEST_URL } });
        fireEvent.click(screen.getByTestId("setup-connect-button"));
        await waitFor(() => screen.getByTestId("setup-initialize-button"));
      }

      it("should enable initialize button when authenticated", async () => {
        mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
        await reachNotInitializedPhase();
        expect(screen.getByTestId("setup-initialize-button")).not.toBeDisabled();
      });

      it("should disable initialize button when not authenticated", async () => {
        mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
        await reachNotInitializedPhase();
        expect(screen.getByTestId("setup-initialize-button")).toBeDisabled();
      });

      it("should show sign-in required message when not authenticated", async () => {
        mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
        await reachNotInitializedPhase();
        expect(screen.getByTestId("setup-sign-in-required")).toBeInTheDocument();
      });

      it("should not show sign-in required when authenticated", async () => {
        mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
        await reachNotInitializedPhase();
        expect(screen.queryByTestId("setup-sign-in-required")).not.toBeInTheDocument();
      });

      it("should call signIn when sign-in button in not_initialized is clicked", async () => {
        const signIn = vi.fn();
        mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn, signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
        await reachNotInitializedPhase();
        fireEvent.click(screen.getByTestId("setup-sign-in-btn"));
        expect(signIn).toHaveBeenCalled();
      });
    });
  });

  describe("when initializing", () => {
    beforeEach(async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => screen.getByTestId("setup-initialize-button"));
    });

    it("should call init when initialize button is clicked", () => {
      mockInit.mockResolvedValue({ ok: true });
      fireEvent.click(screen.getByTestId("setup-initialize-button"));
      expect(mockInit).toHaveBeenCalled();
    });

    it("should navigate to inbox after successful initialization", async () => {
      mockInit.mockResolvedValue({ ok: true });
      fireEvent.click(screen.getByTestId("setup-initialize-button"));
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });

    it("should show error message when init fails", async () => {
      mockInit.mockRejectedValue(new Error("init failed"));
      fireEvent.click(screen.getByTestId("setup-initialize-button"));
      await waitFor(() => {
        expect(screen.getByTestId("setup-error")).toBeInTheDocument();
      });
    });
  });

  describe("when ping fails", () => {
    it("should show error message", async () => {
      mockPingUrl.mockRejectedValue(new Error("connection failed"));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(screen.getByTestId("setup-error")).toBeInTheDocument();
      });
    });

    it("should not save URL to localStorage", async () => {
      mockPingUrl.mockRejectedValue(new Error("connection failed"));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => screen.getByTestId("setup-error"));
      expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBeNull();
    });
  });

  describe("GAS collapsible section", () => {
    it("should render GAS section open by default", () => {
      renderPage();
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });

    it("should hide inputs when GAS section is collapsed", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-gas-section-toggle"));
      expect(screen.queryByTestId("setup-url-input")).not.toBeInTheDocument();
      expect(screen.queryByTestId("setup-client-id-input")).not.toBeInTheDocument();
    });

    it("should show inputs again when GAS section is reopened", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-gas-section-toggle"));
      fireEvent.click(screen.getByTestId("setup-gas-section-toggle"));
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });
  });

  describe("sign-in button in GAS collapsible", () => {
    it("should show gas sign-in button when not authenticated in input phase", () => {
      mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
      renderPage();
      expect(screen.getByTestId("setup-gas-sign-in-btn")).toBeInTheDocument();
    });

    it("should not show gas sign-in button when authenticated in input phase", () => {
      renderPage();
      expect(screen.queryByTestId("setup-gas-sign-in-btn")).not.toBeInTheDocument();
    });

    it("should call signIn when gas sign-in button is clicked", () => {
      const signIn = vi.fn();
      mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn, signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
      renderPage();
      fireEvent.click(screen.getByTestId("setup-gas-sign-in-btn"));
      expect(signIn).toHaveBeenCalled();
    });
  });

  describe("when URL is already configured", () => {
    const EXISTING_URL = "https://script.google.com/macros/s/existing/exec";
    const EXISTING_CLIENT_ID = "test-client-id.apps.googleusercontent.com";

    beforeEach(() => {
      localStorage.setItem(STORAGE_KEYS.GAS_URL, EXISTING_URL);
    });

    it("should show current URL", () => {
      renderPage();
      expect(screen.getByTestId("setup-current-url")).toBeInTheDocument();
    });

    it("should show disconnect button", () => {
      renderPage();
      expect(screen.getByTestId("setup-disconnect-button")).toBeInTheDocument();
    });

    it("should keep GAS URL in localStorage when disconnect is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(localStorage.getItem(STORAGE_KEYS.GAS_URL)).toBe(EXISTING_URL);
    });

    it("should keep Google Client ID in localStorage when disconnect is clicked", () => {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, EXISTING_CLIENT_ID);
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID)).toBe(EXISTING_CLIENT_ID);
    });

    it("should show input form after disconnecting", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });

    it("should navigate to inbox when sign-in completes in connected phase", async () => {
      localStorage.setItem(STORAGE_KEYS.GOOGLE_CLIENT_ID, EXISTING_CLIENT_ID);
      mockUseAuth.mockReturnValue({ accessToken: null, userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
      const { rerender } = renderPage();

      expect(screen.getByTestId("setup-sign-in-required")).toBeInTheDocument();

      mockUseAuth.mockReturnValue({ accessToken: "token", userEmail: null, signIn: vi.fn(), signOut: vi.fn(), silentRefresh: vi.fn(), userPicture: null });
      rerender(<MemoryRouter><SetupPage /></MemoryRouter>);

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });
  });

  describe("Google Client ID normalization", () => {
    const SHORT_CLIENT_ID = "306298988178-abc123def456";
    const FULL_CLIENT_ID = "306298988178-abc123def456.apps.googleusercontent.com";

    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should save full client ID to localStorage when short form is entered", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.change(screen.getByTestId("setup-client-id-input"), {
        target: { value: SHORT_CLIENT_ID },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID)).toBe(FULL_CLIENT_ID);
      });
    });

    it("should save full client ID as-is when full form is already entered", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.change(screen.getByTestId("setup-client-id-input"), {
        target: { value: FULL_CLIENT_ID },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID)).toBe(FULL_CLIENT_ID);
      });
    });

    it("should not save client ID to localStorage when client ID input is empty", async () => {
      mockPingUrl.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      await waitFor(() => {
        expect(localStorage.getItem(STORAGE_KEYS.GOOGLE_CLIENT_ID)).toBeNull();
      });
    });
  });
});
