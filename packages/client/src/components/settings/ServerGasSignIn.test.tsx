import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockSignIn = vi.fn();
const mockInit = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: vi.fn(() => ({ signIn: mockSignIn, accessToken: null })),
}));
vi.mock("@/services/defaultServices", () => ({
  getDefaultSyncAdapter: vi.fn(() => ({ init: mockInit })),
}));

import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { useAuth } from "@/app/providers/AuthProvider";
import { ServerGasSignIn } from "./ServerGasSignIn";

function renderComponent(
  overrides: Partial<{
    needsInit: boolean;
    onInitComplete: () => void;
    onInitError: (message: string) => void;
    onCancel: () => void;
  }> = {},
) {
  const defaultProps = {
    needsInit: false,
    onInitComplete: vi.fn(),
    onInitError: vi.fn(),
    onCancel: vi.fn(),
    ...overrides,
  };
  return {
    ...render(<ServerGasSignIn {...defaultProps} />),
    props: defaultProps,
  };
}

describe("ServerGasSignIn", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: null,
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
  });

  it("shows sign-in button when no access token", () => {
    renderComponent();
    expect(screen.getByTestId("server-gas-signin-button")).toBeDefined();
  });

  it("shows signInRequired text when no access token", () => {
    renderComponent();
    expect(screen.getByText("settings.server.signInRequired")).toBeDefined();
  });

  it("shows signInWithGoogle text on sign-in button", () => {
    renderComponent();
    expect(screen.getByTestId("server-gas-signin-button").textContent).toBe(
      "settings.server.signInWithGoogle",
    );
  });

  it("calls signIn when sign-in button is clicked", () => {
    renderComponent();
    fireEvent.click(screen.getByTestId("server-gas-signin-button"));
    expect(mockSignIn).toHaveBeenCalledOnce();
  });

  it("shows initializing indicator when accessToken present and needsInit is true", () => {
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: "token-123",
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    renderComponent({ needsInit: true });
    expect(screen.getByTestId("server-gas-initializing").textContent).toContain(
      "settings.server.initializing",
    );
  });

  it("does not show sign-in button when initializing", () => {
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: "token-123",
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    renderComponent({ needsInit: true });
    expect(screen.queryByTestId("server-gas-signin-button")).toBeNull();
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    renderComponent({ onCancel });
    fireEvent.click(screen.getByTestId("server-gas-signin-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("shows cancel button text with cancel i18n key", () => {
    renderComponent();
    expect(screen.getByTestId("server-gas-signin-cancel").textContent).toBe(
      "settings.server.cancel",
    );
  });

  it("calls init and onInitComplete when init succeeds", async () => {
    mockInit.mockResolvedValue({ ok: true });
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: "token-123",
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    const onInitComplete = vi.fn();
    await act(async () => {
      renderComponent({ needsInit: true, onInitComplete });
    });
    expect(mockInit).toHaveBeenCalledOnce();
    expect(onInitComplete).toHaveBeenCalledOnce();
  });

  it("calls onInitError when init returns not ok", async () => {
    mockInit.mockResolvedValue({ ok: false });
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: "token-123",
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    const onInitError = vi.fn();
    await act(async () => {
      renderComponent({ needsInit: true, onInitError });
    });
    expect(onInitError).toHaveBeenCalledWith("settings.server.initError");
  });

  it("calls onInitError when init throws", async () => {
    mockInit.mockRejectedValue(new Error("network failure"));
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: "token-123",
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    const onInitError = vi.fn();
    await act(async () => {
      renderComponent({ needsInit: true, onInitError });
    });
    expect(onInitError).toHaveBeenCalledWith("settings.server.initError");
  });

  it("does not call init when accessToken is null", async () => {
    await act(async () => {
      renderComponent({ needsInit: true });
    });
    expect(mockInit).not.toHaveBeenCalled();
  });

  it("does not call init when needsInit is false", async () => {
    vi.mocked(useAuth).mockReturnValue({
      signIn: mockSignIn,
      accessToken: "token-123",
      signOut: vi.fn(),
    } as unknown as ReturnType<typeof useAuth>);
    await act(async () => {
      renderComponent({ needsInit: false });
    });
    expect(mockInit).not.toHaveBeenCalled();
  });
});
