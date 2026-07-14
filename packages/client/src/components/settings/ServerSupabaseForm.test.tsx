import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetSavedConfigForType = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock("@/services/connectionService", () => ({
  getSavedConfigForType: (...args: unknown[]) =>
    mockGetSavedConfigForType(...args),
}));
vi.mock("@/shared/lib/cn", () => ({
  cn: (...args: unknown[]) => args.filter(Boolean).join(" "),
}));

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { ServerSupabaseForm } from "./ServerSupabaseForm";

function renderForm(
  overrides: Partial<{
    onConnect: (url: string, anonKey: string) => void;
    onCancel: () => void;
    isLoading: boolean;
    error: string;
  }> = {},
) {
  const defaultProps = {
    onConnect: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
    error: "",
    ...overrides,
  };
  return {
    ...render(<ServerSupabaseForm {...defaultProps} />),
    props: defaultProps,
  };
}

function fillUrl(value: string) {
  fireEvent.change(screen.getByTestId("server-supabase-url"), {
    target: { value },
  });
}

function fillAnonKey(value: string) {
  fireEvent.change(screen.getByTestId("server-supabase-anon-key"), {
    target: { value },
  });
}

function getConnectButton() {
  return screen.getByTestId("server-supabase-connect") as HTMLButtonElement;
}

describe("ServerSupabaseForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSavedConfigForType.mockReturnValue(null);
  });

  it("pre-fills URL from saved config", () => {
    mockGetSavedConfigForType.mockReturnValue({
      type: "supabase",
      url: "https://saved.supabase.co",
      anonKey: "saved-key",
    });
    renderForm();
    const urlInput = screen.getByTestId(
      "server-supabase-url",
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("https://saved.supabase.co");
  });

  it("pre-fills Anon Key from saved config", () => {
    mockGetSavedConfigForType.mockReturnValue({
      type: "supabase",
      url: "https://saved.supabase.co",
      anonKey: "saved-key-123",
    });
    renderForm();
    const anonKeyInput = screen.getByTestId(
      "server-supabase-anon-key",
    ) as HTMLInputElement;
    expect(anonKeyInput.value).toBe("saved-key-123");
  });

  it("shows empty fields when no saved config", () => {
    renderForm();
    const urlInput = screen.getByTestId(
      "server-supabase-url",
    ) as HTMLInputElement;
    const anonKeyInput = screen.getByTestId(
      "server-supabase-anon-key",
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("");
    expect(anonKeyInput.value).toBe("");
  });

  it("disables connect when only URL is filled", () => {
    renderForm();
    fillUrl("https://example.supabase.co");
    expect(getConnectButton().disabled).toBe(true);
  });

  it("disables connect when only Anon Key is filled", () => {
    renderForm();
    fillAnonKey("some-key");
    expect(getConnectButton().disabled).toBe(true);
  });

  it("enables connect when both fields are filled", () => {
    renderForm();
    fillUrl("https://example.supabase.co");
    fillAnonKey("some-key");
    expect(getConnectButton().disabled).toBe(false);
  });

  it("disables connect when isLoading is true even if fields filled", () => {
    mockGetSavedConfigForType.mockReturnValue({
      type: "supabase",
      url: "https://saved.supabase.co",
      anonKey: "saved-key",
    });
    renderForm({ isLoading: true });
    expect(getConnectButton().disabled).toBe(true);
  });

  it("shows loading indicator when isLoading is true", () => {
    renderForm({ isLoading: true });
    expect(screen.getByTestId("server-supabase-loading")).toBeDefined();
  });

  it("hides loading indicator when isLoading is false", () => {
    renderForm({ isLoading: false });
    expect(screen.queryByTestId("server-supabase-loading")).toBeNull();
  });

  it("shows error when error string is non-empty", () => {
    renderForm({ error: "Connection failed" });
    const errorElement = screen.getByTestId("server-supabase-error");
    expect(errorElement.textContent).toBe("Connection failed");
  });

  it("hides error when error is empty string", () => {
    renderForm({ error: "" });
    expect(screen.queryByTestId("server-supabase-error")).toBeNull();
  });

  it("calls onConnect with trimmed values", () => {
    const onConnect = vi.fn();
    renderForm({ onConnect });
    fillUrl("  https://example.supabase.co  ");
    fillAnonKey("  my-key  ");
    fireEvent.click(screen.getByTestId("server-supabase-connect"));
    expect(onConnect).toHaveBeenCalledWith(
      "https://example.supabase.co",
      "my-key",
    );
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });
    fireEvent.click(screen.getByTestId("server-supabase-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables connect when fields contain only whitespace", () => {
    renderForm();
    fillUrl("   ");
    fillAnonKey("   ");
    expect(getConnectButton().disabled).toBe(true);
  });

  it("disables connect when URL is whitespace but Anon Key has value", () => {
    renderForm();
    fillUrl("   ");
    fillAnonKey("real-key");
    expect(getConnectButton()).toBeDisabled();
  });

  it("disables connect when Anon Key is whitespace but URL has value", () => {
    renderForm();
    fillUrl("https://example.supabase.co");
    fillAnonKey("   ");
    expect(getConnectButton()).toBeDisabled();
  });

  it("renders i18n keys for labels", () => {
    renderForm();
    expect(screen.getByText("settings.server.projectUrl")).toBeInTheDocument();
    expect(screen.getByText("settings.server.anonKey")).toBeInTheDocument();
    expect(screen.getByText("common.cancel")).toBeInTheDocument();
    expect(screen.getByText("settings.server.connect")).toBeInTheDocument();
  });

  it("renders i18n keys for descriptions", () => {
    renderForm();
    expect(
      screen.getByText("settings.server.projectUrlDescription"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("settings.server.anonKeyDescription"),
    ).toBeInTheDocument();
  });

  it("renders placeholder text", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText("settings.server.projectUrlPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("settings.server.anonKeyPlaceholder"),
    ).toBeInTheDocument();
  });

  it("renders connecting text when loading", () => {
    renderForm({ isLoading: true });
    expect(screen.getByText("settings.server.connecting")).toBeInTheDocument();
  });
});
