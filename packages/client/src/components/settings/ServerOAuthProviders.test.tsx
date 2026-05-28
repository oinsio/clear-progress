import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { ServerOAuthProviders } from "./ServerOAuthProviders";

describe("ServerOAuthProviders", () => {
  afterEach(cleanup);

  it("shows hint text when providers exist", () => {
    render(<ServerOAuthProviders providers={["google"]} onSignIn={vi.fn()} />);
    expect(screen.getByTestId("server-oauth-hint").textContent).toBe(
      "settings.server.chooseAuthMethod",
    );
  });

  it("shows capitalized provider name on button", () => {
    render(<ServerOAuthProviders providers={["google"]} onSignIn={vi.fn()} />);
    const providerButton = screen.getByTestId("server-oauth-google");
    expect(providerButton.textContent).toBe("Google");
  });

  it("calls onSignIn with correct provider string on click", () => {
    const onSignIn = vi.fn();
    render(<ServerOAuthProviders providers={["github"]} onSignIn={onSignIn} />);
    fireEvent.click(screen.getByTestId("server-oauth-github"));
    expect(onSignIn).toHaveBeenCalledWith("github");
  });

  it("shows no-providers message when providers array is empty", () => {
    render(<ServerOAuthProviders providers={[]} onSignIn={vi.fn()} />);
    expect(screen.getByTestId("server-no-providers").textContent).toBe(
      "settings.server.noProviders",
    );
  });

  it("does not show hint when providers array is empty", () => {
    render(<ServerOAuthProviders providers={[]} onSignIn={vi.fn()} />);
    expect(screen.queryByTestId("server-oauth-hint")).toBeNull();
  });

  it("shows cancel button when onCancel is provided", () => {
    const onCancel = vi.fn();
    render(
      <ServerOAuthProviders
        providers={["google"]}
        onSignIn={vi.fn()}
        onCancel={onCancel}
      />,
    );
    const cancelButton = screen.getByTestId("server-oauth-cancel");
    expect(cancelButton).toBeDefined();
    fireEvent.click(cancelButton);
    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("does not show cancel button when onCancel is undefined", () => {
    render(<ServerOAuthProviders providers={["google"]} onSignIn={vi.fn()} />);
    expect(screen.queryByTestId("server-oauth-cancel")).toBeNull();
  });

  it("shows cancel button text with cancel i18n key", () => {
    render(
      <ServerOAuthProviders
        providers={[]}
        onSignIn={vi.fn()}
        onCancel={vi.fn()}
      />,
    );
    expect(screen.getByTestId("server-oauth-cancel").textContent).toBe(
      "settings.server.cancel",
    );
  });

  it("renders correct data-testid for each provider", () => {
    render(
      <ServerOAuthProviders
        providers={["google", "github"]}
        onSignIn={vi.fn()}
      />,
    );
    expect(screen.getByTestId("server-oauth-google")).toBeDefined();
    expect(screen.getByTestId("server-oauth-github")).toBeDefined();
  });
});
