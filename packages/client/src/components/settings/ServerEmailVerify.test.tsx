import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) =>
      params ? `${key}::${JSON.stringify(params)}` : key,
  }),
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
import { ServerEmailVerify } from "./ServerEmailVerify";

interface RenderOverrides {
  email?: string;
  onVerify?: (code: string) => void;
  onResend?: () => void;
  onBack?: () => void;
  isVerifying?: boolean;
  error?: string;
  resendCooldown?: number;
}

function renderComponent(overrides: RenderOverrides = {}) {
  const defaultProps = {
    email: "user@example.com",
    onVerify: vi.fn(),
    onResend: vi.fn(),
    onBack: vi.fn(),
    isVerifying: false,
    error: "",
    resendCooldown: 0,
    ...overrides,
  };
  return {
    ...render(<ServerEmailVerify {...defaultProps} />),
    props: defaultProps,
  };
}

function getOtpInput(): HTMLInputElement {
  return screen.getByTestId("server-otp-input") as HTMLInputElement;
}

function getVerifyButton(): HTMLButtonElement {
  return screen.getByTestId("server-otp-verify") as HTMLButtonElement;
}

function getResendButton(): HTMLButtonElement {
  return screen.getByTestId("server-otp-resend") as HTMLButtonElement;
}

function fillOtp(value: string) {
  fireEvent.change(getOtpInput(), { target: { value } });
}

describe("ServerEmailVerify", () => {
  afterEach(cleanup);

  // --- Basic rendering (5.1) ---

  it("displays OTP title", () => {
    renderComponent();
    expect(screen.getByTestId("server-otp-title").textContent).toBe(
      "settings.server.otpTitle",
    );
  });

  it("displays email address via codeSentTo i18n key", () => {
    renderComponent({ email: "user@example.com" });
    expect(screen.getByTestId("server-otp-email").textContent).toBe(
      'settings.server.codeSentTo::{"email":"user@example.com"}',
    );
  });

  it("renders OTP input with inputMode numeric", () => {
    renderComponent();
    expect(getOtpInput().getAttribute("inputmode")).toBe("numeric");
  });

  it("renders OTP input without maxLength restriction", () => {
    renderComponent();
    expect(getOtpInput().hasAttribute("maxlength")).toBe(false);
  });

  it("verify button is disabled when input is empty", () => {
    renderComponent();
    expect(getVerifyButton().disabled).toBe(true);
  });

  it("verify button is enabled when input has any characters", () => {
    renderComponent();
    fillOtp("1");
    expect(getVerifyButton().disabled).toBe(false);
  });

  it("verify button is disabled when isVerifying is true even with input", () => {
    renderComponent({ isVerifying: true });
    fillOtp("12345678");
    expect(getVerifyButton().disabled).toBe(true);
  });

  it("displays magic link hint", () => {
    renderComponent();
    expect(screen.getByTestId("server-otp-hint").textContent).toBe(
      "settings.server.otpHint",
    );
  });

  it("renders back button", () => {
    renderComponent();
    expect(screen.getByTestId("server-otp-back")).toBeDefined();
  });

  it("back button calls onBack on click", () => {
    const onBack = vi.fn();
    renderComponent({ onBack });
    fireEvent.click(screen.getByTestId("server-otp-back"));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it("calls onVerify with code when verify clicked", () => {
    const onVerify = vi.fn();
    renderComponent({ onVerify });
    fillOtp("654321");
    fireEvent.click(getVerifyButton());
    expect(onVerify).toHaveBeenCalledWith("654321");
  });

  it("clears input after onVerify is called", () => {
    renderComponent();
    fillOtp("123456");
    fireEvent.click(getVerifyButton());
    expect(getOtpInput().value).toBe("");
  });

  it("displays error message when error prop is set", () => {
    renderComponent({ error: "Invalid code" });
    expect(screen.getByTestId("server-otp-error").textContent).toBe(
      "Invalid code",
    );
  });

  it("error has role alert", () => {
    renderComponent({ error: "Invalid code" });
    expect(screen.getByTestId("server-otp-error").getAttribute("role")).toBe(
      "alert",
    );
  });

  it("no error displayed when error is empty string", () => {
    renderComponent({ error: "" });
    expect(screen.queryByTestId("server-otp-error")).toBeNull();
  });

  it("OTP input has associated label", () => {
    renderComponent();
    const input = getOtpInput();
    const labelId = input.getAttribute("id");
    expect(labelId).toBeTruthy();
    const label = document.querySelector(`label[for="${labelId}"]`);
    expect(label).not.toBeNull();
  });

  it("OTP input has type text to preserve leading zeros", () => {
    renderComponent();
    expect(getOtpInput().type).toBe("text");
  });

  // --- Resend cooldown (5.3) ---

  it("resend button disabled when resendCooldown > 0", () => {
    renderComponent({ resendCooldown: 45 });
    expect(getResendButton().disabled).toBe(true);
  });

  it("resend button enabled when resendCooldown === 0", () => {
    renderComponent({ resendCooldown: 0 });
    expect(getResendButton().disabled).toBe(false);
  });

  it("resend button shows countdown text when resendCooldown > 0", () => {
    renderComponent({ resendCooldown: 45 });
    expect(getResendButton().textContent).toBe(
      'settings.server.resendCountdown::{"time":"0:45"}',
    );
  });

  it("resend button shows regular text when resendCooldown === 0", () => {
    renderComponent({ resendCooldown: 0 });
    expect(getResendButton().textContent).toBe("settings.server.resend");
  });

  it("resend button calls onResend when clicked and cooldown is 0", () => {
    const onResend = vi.fn();
    renderComponent({ onResend, resendCooldown: 0 });
    fireEvent.click(getResendButton());
    expect(onResend).toHaveBeenCalledOnce();
  });

  it("countdown formats seconds with zero-pad (5 -> 0:05)", () => {
    renderComponent({ resendCooldown: 5 });
    expect(getResendButton().textContent).toBe(
      'settings.server.resendCountdown::{"time":"0:05"}',
    );
  });
});
