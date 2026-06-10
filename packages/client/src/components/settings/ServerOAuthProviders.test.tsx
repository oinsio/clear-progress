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

  it("renders provider icon inside button for known provider", () => {
    render(<ServerOAuthProviders providers={["google"]} onSignIn={vi.fn()} />);
    const providerButton = screen.getByTestId("server-oauth-google");
    const icon = providerButton.querySelector("svg");
    expect(icon).not.toBeNull();
    expect(icon?.getAttribute("aria-hidden")).toBe("true");
  });

  it("does not render icon for unknown provider", () => {
    render(
      <ServerOAuthProviders providers={["keycloak"]} onSignIn={vi.fn()} />,
    );
    const providerButton = screen.getByTestId("server-oauth-keycloak");
    const icon = providerButton.querySelector("svg");
    expect(icon).toBeNull();
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

  describe("email auth section", () => {
    // FR1, FR11 of supabase-email-auth
    it("shows divider when isEmailEnabled and providers exist", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const divider = screen.getByTestId("server-email-divider");
      expect(divider.textContent).toBe("settings.server.emailOrDivider");
    });

    it("shows email input when isEmailEnabled", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      expect(screen.getByTestId("server-email-input")).toBeDefined();
    });

    it("shows send button when isEmailEnabled", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      expect(screen.getByTestId("server-email-send")).toBeDefined();
    });

    it("does not show divider when isEmailEnabled is false", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={false}
        />,
      );
      expect(screen.queryByTestId("server-email-divider")).toBeNull();
    });

    it("does not show email input when isEmailEnabled is false", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={false}
        />,
      );
      expect(screen.queryByTestId("server-email-input")).toBeNull();
    });

    it("send button is disabled when email input is empty", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    it("send button is enabled when email is valid", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", false);
    });

    it("send button is disabled when email is invalid", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, { target: { value: "not-an-email" } });
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    it("send button is disabled when TLD is single character", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, { target: { value: "user@example.c" } });
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    it("send button is disabled when email has no domain", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, { target: { value: "user@" } });
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    it("calls onSendOtp with email value on send click", () => {
      const onSendOtp = vi.fn();
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
          onSendOtp={onSendOtp}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, { target: { value: "test@test.com" } });
      fireEvent.click(screen.getByTestId("server-email-send"));
      expect(onSendOtp).toHaveBeenCalledWith("test@test.com");
    });

    it("send button is disabled when emailLoading is true", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
          emailLoading={true}
        />,
      );
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    it("hides no-providers message when isEmailEnabled and providers empty", () => {
      render(
        <ServerOAuthProviders
          providers={[]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      expect(screen.queryByTestId("server-no-providers")).toBeNull();
    });

    it("shows email form without divider when isEmailEnabled and providers empty", () => {
      render(
        <ServerOAuthProviders
          providers={[]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      expect(screen.getByTestId("server-email-input")).toBeDefined();
      expect(screen.queryByTestId("server-email-divider")).toBeNull();
    });

    it("email input has type email", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      expect(emailInput.getAttribute("type")).toBe("email");
    });

    it("send button displays sendCode i18n key", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      expect(screen.getByTestId("server-email-send").textContent).toBe(
        "settings.server.sendCode",
      );
    });

    it("email input starts with empty value", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId(
        "server-email-input",
      ) as HTMLInputElement;
      expect(emailInput.value).toBe("");
    });

    it("send button is disabled when email has prefix text", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, {
        target: { value: "prefix user@example.com" },
      });
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    it("send button is disabled when email has trailing text", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      fireEvent.change(emailInput, {
        target: { value: "user@example.com extra" },
      });
      const sendButton = screen.getByTestId("server-email-send");
      expect(sendButton).toHaveProperty("disabled", true);
    });

    // NFR-A1 of supabase-email-auth
    it("email input has associated label", () => {
      render(
        <ServerOAuthProviders
          providers={["google"]}
          onSignIn={vi.fn()}
          isEmailEnabled={true}
        />,
      );
      const emailInput = screen.getByTestId("server-email-input");
      const inputId = emailInput.getAttribute("id");
      expect(inputId).toBeTruthy();
      const label = document.querySelector(`label[for="${inputId}"]`);
      expect(label).not.toBeNull();
      expect(label?.textContent).toBe("settings.server.emailLabel");
    });
  });
});
