import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ROUTES } from "@/constants";
import { localStorageMock } from "@/test/mocks/localStorageMock";
import SetupPage from "./SetupPage";

const mockNavigate = vi.fn();

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const {
  mockPing,
  mockInit,
  mockConnect,
  mockDisconnect,
  mockGetConnectionConfig,
  mockGetSavedConnectionConfig,
  mockGetDefaultSyncAdapter,
  mockCreateAdapter,
} = vi.hoisted(() => ({
  mockPing: vi.fn(),
  mockInit: vi.fn(),
  mockConnect: vi.fn(),
  mockDisconnect: vi.fn(),
  mockGetConnectionConfig: vi.fn(),
  mockGetSavedConnectionConfig: vi.fn(),
  mockGetDefaultSyncAdapter: vi.fn(),
  mockCreateAdapter: vi.fn(),
}));

vi.mock("@clear-progress/contract", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@clear-progress/contract")>();
  return {
    ...actual,
    createAdapter: mockCreateAdapter,
  };
});

vi.mock("@/services/defaultServices", () => ({
  getDefaultSyncAdapter: mockGetDefaultSyncAdapter,
}));

vi.mock("@/services/tokenManager", () => ({
  getAccessToken: vi.fn(() => null),
}));

vi.mock("@/services/connectionService", () => ({
  connect: mockConnect,
  disconnect: mockDisconnect,
  getConnectionConfig: mockGetConnectionConfig,
  getSavedConnectionConfig: mockGetSavedConnectionConfig,
}));

vi.mock("@/hooks/usePanelSide");
vi.mock("@/hooks/usePanelOpen");
vi.mock("@/components/tasks/RightFilterPanel");
vi.mock("@/app/providers/AuthProvider");
vi.mock("@/i18n", () => ({ default: {} }));
vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { useAuth } from "@/app/providers/AuthProvider";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";

const mockUsePanelOpen = vi.mocked(usePanelOpen);
const mockUsePanelSide = vi.mocked(usePanelSide);
const mockUseAuth = vi.mocked(useAuth);

const TEST_URL = "https://script.google.com/macros/s/abc/exec";
const TEST_DEPLOYMENT_ID = "AKfycbxTestDeploymentId";
const TEST_CLIENT_ID = "test-client-id.apps.googleusercontent.com";

function renderPage() {
  return render(
    <MemoryRouter>
      <SetupPage />
    </MemoryRouter>,
  );
}

async function enterUrlAndConnect(url: string) {
  fireEvent.change(screen.getByTestId("setup-url-input"), {
    target: { value: url },
  });
  fireEvent.click(screen.getByTestId("setup-connect-button"));
}

async function enterUrlClientIdAndConnect(url: string, clientId: string) {
  fireEvent.change(screen.getByTestId("setup-url-input"), {
    target: { value: url },
  });
  fireEvent.change(screen.getByTestId("setup-client-id-input"), {
    target: { value: clientId },
  });
  fireEvent.click(screen.getByTestId("setup-connect-button"));
}

describe("SetupPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    mockGetConnectionConfig.mockReturnValue(null);
    mockGetSavedConnectionConfig.mockReturnValue(null);
    mockCreateAdapter.mockReturnValue({
      ping: mockPing,
      init: mockInit,
    });
    mockUsePanelOpen.mockReturnValue({
      isPanelOpen: false,
      togglePanelOpen: vi.fn(),
    });
    mockUsePanelSide.mockReturnValue({
      panelSide: "right",
      setPanelSide: vi.fn(),
    });
    mockUseAuth.mockReturnValue({
      accessToken: "mock-token",
      userEmail: null,
      signIn: vi.fn(),
      signOut: vi.fn(),
      silentRefresh: vi.fn(),
      userPicture: null,
    });
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
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      expect(mockPing).toHaveBeenCalled();
    });

    it("should build full URL from deployment ID and call pingUrl with it", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlAndConnect(TEST_DEPLOYMENT_ID);
      expect(mockPing).toHaveBeenCalled();
    });

    it("should call connect with full URL when deployment ID is entered", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlAndConnect(TEST_DEPLOYMENT_ID);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith({
          type: "gas",
          url: `https://script.google.com/macros/s/${TEST_DEPLOYMENT_ID}/exec`,
          clientId: undefined,
          isActive: true,
        });
      });
    });

    it("should show loading state while pinging", () => {
      mockPing.mockReturnValue(new Promise(() => {}));
      renderPage();
      fireEvent.change(screen.getByTestId("setup-url-input"), {
        target: { value: TEST_URL },
      });
      fireEvent.click(screen.getByTestId("setup-connect-button"));
      expect(screen.getByTestId("setup-loading")).toBeInTheDocument();
    });
  });

  describe("when ping succeeds with initialized: true", () => {
    it("should call connect with URL", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith({
          type: "gas",
          url: TEST_URL,
          clientId: undefined,
          isActive: true,
        });
      });
    });

    it("should navigate to inbox", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });
  });

  describe("when ping succeeds with initialized: false", () => {
    it("should call connect with URL and clientId", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      await enterUrlClientIdAndConnect(TEST_URL, TEST_CLIENT_ID);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith({
          type: "gas",
          url: TEST_URL,
          clientId: TEST_CLIENT_ID,
          isActive: true,
        });
      });
    });

    it("should show awaiting sign-in phase when clientId is provided", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      await enterUrlClientIdAndConnect(TEST_URL, TEST_CLIENT_ID);
      await waitFor(() => {
        expect(screen.getByTestId("setup-awaiting-signin")).toBeInTheDocument();
      });
    });

    it("should show not_initialized phase when clientId is not provided", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: false });
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      await waitFor(() => {
        expect(screen.getByTestId("setup-back-button")).toBeInTheDocument();
      });
    });

    describe("authentication gate", () => {
      async function reachAwaitingSigninPhase() {
        mockPing.mockResolvedValue({ ok: true, initialized: false });
        renderPage();
        await enterUrlClientIdAndConnect(TEST_URL, TEST_CLIENT_ID);
        await waitFor(() => screen.getByTestId("setup-awaiting-signin"));
      }

      it("should show sign-in button in awaiting_signin phase", async () => {
        mockUseAuth.mockReturnValue({
          accessToken: null,
          userEmail: null,
          signIn: vi.fn(),
          signOut: vi.fn(),
          silentRefresh: vi.fn(),
          userPicture: null,
        });
        await reachAwaitingSigninPhase();
        expect(screen.getByTestId("setup-sign-in-btn")).toBeInTheDocument();
      });

      it("should call signIn when sign-in button is clicked", async () => {
        const signIn = vi.fn();
        mockUseAuth.mockReturnValue({
          accessToken: null,
          userEmail: null,
          signIn,
          signOut: vi.fn(),
          silentRefresh: vi.fn(),
          userPicture: null,
        });
        await reachAwaitingSigninPhase();
        fireEvent.click(screen.getByTestId("setup-sign-in-btn"));
        expect(signIn).toHaveBeenCalled();
      });
    });
  });

  describe("when ping fails", () => {
    it("should show error message", async () => {
      mockPing.mockRejectedValue(new Error("connection failed"));
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      await waitFor(() => {
        expect(screen.getByTestId("setup-error")).toBeInTheDocument();
      });
    });

    it("should not call connect when ping fails", async () => {
      mockPing.mockRejectedValue(new Error("connection failed"));
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      await waitFor(() => screen.getByTestId("setup-error"));
      expect(mockConnect).not.toHaveBeenCalled();
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
      expect(
        screen.queryByTestId("setup-client-id-input"),
      ).not.toBeInTheDocument();
    });

    it("should show inputs again when GAS section is reopened", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-gas-section-toggle"));
      fireEvent.click(screen.getByTestId("setup-gas-section-toggle"));
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });
  });

  describe("when URL is already configured", () => {
    const EXISTING_URL = "https://script.google.com/macros/s/existing/exec";
    const EXISTING_CLIENT_ID = "test-client-id.apps.googleusercontent.com";

    beforeEach(() => {
      mockGetConnectionConfig.mockReturnValue({
        type: "gas",
        url: EXISTING_URL,
        clientId: undefined,
        isActive: true,
      });
    });

    it("should show current URL", () => {
      renderPage();
      expect(screen.getByTestId("setup-current-url")).toBeInTheDocument();
    });

    it("should show disconnect button", () => {
      renderPage();
      expect(screen.getByTestId("setup-disconnect-button")).toBeInTheDocument();
    });

    it("should call disconnect when disconnect button is clicked", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(mockDisconnect).toHaveBeenCalled();
    });

    it("should show input form after disconnecting", () => {
      renderPage();
      fireEvent.click(screen.getByTestId("setup-disconnect-button"));
      expect(screen.getByTestId("setup-url-input")).toBeInTheDocument();
    });

    it("should navigate to inbox when sign-in completes in connected phase", async () => {
      mockGetConnectionConfig.mockReturnValue({
        type: "gas",
        url: EXISTING_URL,
        clientId: EXISTING_CLIENT_ID,
        isActive: true,
      });
      mockUseAuth.mockReturnValue({
        accessToken: null,
        userEmail: null,
        signIn: vi.fn(),
        signOut: vi.fn(),
        silentRefresh: vi.fn(),
        userPicture: null,
      });
      const { rerender } = renderPage();

      expect(screen.getByTestId("setup-sign-in-required")).toBeInTheDocument();

      mockUseAuth.mockReturnValue({
        accessToken: "token",
        userEmail: null,
        signIn: vi.fn(),
        signOut: vi.fn(),
        silentRefresh: vi.fn(),
        userPicture: null,
      });
      rerender(
        <MemoryRouter>
          <SetupPage />
        </MemoryRouter>,
      );

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith(ROUTES.INBOX);
      });
    });
  });

  describe("Google Client ID normalization", () => {
    const SHORT_CLIENT_ID = "306298988178-abc123def456";
    const FULL_CLIENT_ID =
      "306298988178-abc123def456.apps.googleusercontent.com";

    beforeEach(() => {
      sessionStorage.clear();
    });

    it("should call connect with full client ID when short form is entered", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlClientIdAndConnect(TEST_URL, SHORT_CLIENT_ID);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith({
          type: "gas",
          url: TEST_URL,
          clientId: FULL_CLIENT_ID,
          isActive: true,
        });
      });
    });

    it("should call connect with full client ID when full form is already entered", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlClientIdAndConnect(TEST_URL, FULL_CLIENT_ID);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith({
          type: "gas",
          url: TEST_URL,
          clientId: FULL_CLIENT_ID,
          isActive: true,
        });
      });
    });

    it("should call connect without clientId when client ID input is empty", async () => {
      mockPing.mockResolvedValue({ ok: true, initialized: true });
      renderPage();
      await enterUrlAndConnect(TEST_URL);
      await waitFor(() => {
        expect(mockConnect).toHaveBeenCalledWith({
          type: "gas",
          url: TEST_URL,
          clientId: undefined,
          isActive: true,
        });
      });
    });
  });
});
