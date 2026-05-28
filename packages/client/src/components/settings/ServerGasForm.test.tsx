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
import { ServerGasForm } from "./ServerGasForm";

const TEST_URL = "https://script.google.com/macros/s/ABC/exec";
const TEST_CLIENT_ID = "saved-client-id";

const SAVED_GAS_CONFIG = {
  type: "gas" as const,
  url: TEST_URL,
  clientId: TEST_CLIENT_ID,
};

function fillUrl(value: string) {
  fireEvent.change(screen.getByTestId("server-gas-url"), {
    target: { value },
  });
}

function fillClientId(value: string) {
  fireEvent.change(screen.getByTestId("server-gas-client-id"), {
    target: { value },
  });
}

function renderForm(
  overrides: Partial<{
    onConnect: (url: string, clientId: string) => void;
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
    ...render(<ServerGasForm {...defaultProps} />),
    props: defaultProps,
  };
}

describe("ServerGasForm", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSavedConfigForType.mockReturnValue(null);
  });

  it("pre-fills URL from saved config", () => {
    mockGetSavedConfigForType.mockReturnValue(SAVED_GAS_CONFIG);
    renderForm();
    const urlInput = screen.getByTestId("server-gas-url") as HTMLInputElement;
    expect(urlInput.value).toBe(TEST_URL);
  });

  it("pre-fills Client ID from saved config", () => {
    const configWithCustomId = {
      ...SAVED_GAS_CONFIG,
      clientId: "saved-client-id-123",
    };
    mockGetSavedConfigForType.mockReturnValue(configWithCustomId);
    renderForm();
    const clientIdInput = screen.getByTestId(
      "server-gas-client-id",
    ) as HTMLInputElement;
    expect(clientIdInput.value).toBe("saved-client-id-123");
  });

  it("shows empty fields when no saved config", () => {
    renderForm();
    const urlInput = screen.getByTestId("server-gas-url") as HTMLInputElement;
    const clientIdInput = screen.getByTestId(
      "server-gas-client-id",
    ) as HTMLInputElement;
    expect(urlInput.value).toBe("");
    expect(clientIdInput.value).toBe("");
  });

  it("disables connect when only URL is filled", () => {
    renderForm();
    fillUrl(TEST_URL);
    expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
  });

  it("disables connect when only Client ID is filled", () => {
    renderForm();
    fillClientId("some-client-id");
    expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
  });

  it("enables connect when both fields are filled", () => {
    renderForm();
    fillUrl(TEST_URL);
    fillClientId("some-client-id");
    expect(screen.getByTestId("server-gas-connect")).not.toBeDisabled();
  });

  it("disables connect when isLoading is true even if fields filled", () => {
    mockGetSavedConfigForType.mockReturnValue(SAVED_GAS_CONFIG);
    renderForm({ isLoading: true });
    expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
  });

  it("shows loading indicator when isLoading is true", () => {
    renderForm({ isLoading: true });
    expect(screen.getByTestId("server-gas-loading")).toBeInTheDocument();
  });

  it("hides loading indicator when isLoading is false", () => {
    renderForm({ isLoading: false });
    expect(screen.queryByTestId("server-gas-loading")).not.toBeInTheDocument();
  });

  it("shows error when error string is non-empty", () => {
    renderForm({ error: "Connection failed" });
    expect(screen.getByTestId("server-gas-error")).toHaveTextContent(
      "Connection failed",
    );
  });

  it("hides error when error is empty string", () => {
    renderForm({ error: "" });
    expect(screen.queryByTestId("server-gas-error")).not.toBeInTheDocument();
  });

  it("calls onConnect with trimmed values", () => {
    const onConnect = vi.fn();
    renderForm({ onConnect });
    fillUrl(`  ${TEST_URL}  `);
    fillClientId("  my-client-id  ");
    fireEvent.click(screen.getByTestId("server-gas-connect"));
    expect(onConnect).toHaveBeenCalledWith(TEST_URL, "my-client-id");
  });

  it("calls onCancel when cancel button is clicked", () => {
    const onCancel = vi.fn();
    renderForm({ onCancel });
    fireEvent.click(screen.getByTestId("server-gas-cancel"));
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("disables connect when fields contain only whitespace", () => {
    renderForm();
    fillUrl("   ");
    fillClientId("   ");
    expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
  });

  it("disables connect when URL is whitespace but Client ID has value", () => {
    renderForm();
    fillUrl("   ");
    fillClientId("real-client-id");
    expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
  });

  it("disables connect when Client ID is whitespace but URL has value", () => {
    renderForm();
    fillUrl(TEST_URL);
    fillClientId("   ");
    expect(screen.getByTestId("server-gas-connect")).toBeDisabled();
  });

  it("renders i18n keys for labels", () => {
    renderForm();
    expect(screen.getByText("settings.server.scriptUrl")).toBeInTheDocument();
    expect(screen.getByText("settings.server.clientId")).toBeInTheDocument();
    expect(screen.getByText("settings.server.cancel")).toBeInTheDocument();
    expect(screen.getByText("settings.server.connect")).toBeInTheDocument();
  });

  it("renders i18n keys for descriptions", () => {
    renderForm();
    expect(
      screen.getByText("settings.server.scriptUrlDescription"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("settings.server.clientIdDescription"),
    ).toBeInTheDocument();
  });

  it("renders placeholder text", () => {
    renderForm();
    expect(
      screen.getByPlaceholderText("settings.server.scriptUrlPlaceholder"),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("settings.server.clientIdPlaceholder"),
    ).toBeInTheDocument();
  });

  it("renders connecting text when loading", () => {
    renderForm({ isLoading: true });
    expect(screen.getByText("settings.server.connecting")).toBeInTheDocument();
  });
});
