import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// ── Mock declarations (hoisted) ────────────────────────────────
const mockSignInWithOtp = vi.fn();
const mockVerifyOtp = vi.fn();

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock("@/services/supabaseClientManager", () => ({
  getSupabaseClient: () => ({
    auth: {
      signInWithOtp: mockSignInWithOtp,
      verifyOtp: mockVerifyOtp,
    },
  }),
}));

vi.mock("@/constants", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/constants")>()),
  ROUTES: { SETTINGS: "/settings" },
}));

import { useEmailOtp } from "./useEmailOtp";

describe("useEmailOtp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInWithOtp.mockResolvedValue({ error: null });
    mockVerifyOtp.mockResolvedValue({ error: null });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── Initial state ──────────────────────────────────────────────
  it("should have empty initial state", () => {
    const { result } = renderHook(() => useEmailOtp());
    expect(result.current.pendingEmail).toBe("");
    expect(result.current.resendCooldown).toBe(0);
    expect(result.current.emailLoading).toBe(false);
    expect(result.current.otpVerifying).toBe(false);
    expect(result.current.otpError).toBe("");
  });

  // ── handleSendOtp: success ─────────────────────────────────────
  describe("handleSendOtp", () => {
    it("should call signInWithOtp and set pendingEmail on success", async () => {
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        options: {
          shouldCreateUser: true,
          emailRedirectTo: expect.stringContaining("/settings"),
        },
      });
      expect(result.current.pendingEmail).toBe("user@example.com");
    });

    it("should set resendCooldown to 60 on success", async () => {
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      expect(result.current.resendCooldown).toBe(60);
    });

    it("should set emailLoading to true during request", async () => {
      let resolveOtp!: (value: { error: null }) => void;
      mockSignInWithOtp.mockReturnValue(
        new Promise((resolve) => {
          resolveOtp = resolve;
        }),
      );

      const { result } = renderHook(() => useEmailOtp());

      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.handleSendOtp("user@example.com");
      });

      expect(result.current.emailLoading).toBe(true);

      await act(async () => {
        resolveOtp({ error: null });
        await sendPromise!;
      });

      expect(result.current.emailLoading).toBe(false);
    });

    // ── handleSendOtp: error ───────────────────────────────────
    it("should set otpError on rate limit error", async () => {
      mockSignInWithOtp.mockResolvedValue({
        error: { message: "rate limit exceeded" },
      });

      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      expect(result.current.otpError).toBe("settings.server.otpErrorRateLimit");
      expect(result.current.pendingEmail).toBe("");
    });

    it("should set otpError on network error", async () => {
      mockSignInWithOtp.mockResolvedValue({
        error: { message: "network failure" },
      });

      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      expect(result.current.otpError).toBe("settings.server.otpErrorNetwork");
      expect(result.current.pendingEmail).toBe("");
    });
  });

  // ── handleVerifyOtp ────────────────────────────────────────────
  describe("handleVerifyOtp", () => {
    it("should call verifyOtp with email and code", async () => {
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      await act(async () => {
        await result.current.handleVerifyOtp("123456");
      });

      expect(mockVerifyOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        token: "123456",
        type: "email",
      });
    });

    it("should set otpVerifying during verification", async () => {
      let resolveVerify!: (value: { error: null }) => void;
      mockVerifyOtp.mockReturnValue(
        new Promise((resolve) => {
          resolveVerify = resolve;
        }),
      );

      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      let verifyPromise: Promise<void>;
      act(() => {
        verifyPromise = result.current.handleVerifyOtp("123456");
      });

      expect(result.current.otpVerifying).toBe(true);

      await act(async () => {
        resolveVerify({ error: null });
        await verifyPromise!;
      });

      expect(result.current.otpVerifying).toBe(false);
    });

    it("should set otpError on invalid code", async () => {
      mockVerifyOtp.mockResolvedValue({
        error: { message: "Token has expired or is invalid" },
      });

      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      await act(async () => {
        await result.current.handleVerifyOtp("000000");
      });

      expect(result.current.otpError).toBe("settings.server.otpErrorInvalid");
    });
  });

  // ── handleResendOtp ────────────────────────────────────────────
  describe("handleResendOtp", () => {
    it("should call signInWithOtp with stored email", async () => {
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      mockSignInWithOtp.mockClear();

      await act(async () => {
        await result.current.handleResendOtp();
      });

      expect(mockSignInWithOtp).toHaveBeenCalledWith({
        email: "user@example.com",
        options: {
          shouldCreateUser: true,
          emailRedirectTo: expect.stringContaining("/settings"),
        },
      });
    });

    it("should reset cooldown on successful resend", async () => {
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      // Simulate some cooldown passing
      expect(result.current.resendCooldown).toBe(60);

      await act(async () => {
        await result.current.handleResendOtp();
      });

      expect(result.current.resendCooldown).toBe(60);
    });
  });

  // ── resetOtpState ──────────────────────────────────────────────
  describe("resetOtpState", () => {
    it("should clear all state", async () => {
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      expect(result.current.pendingEmail).toBe("user@example.com");

      act(() => {
        result.current.resetOtpState();
      });

      expect(result.current.pendingEmail).toBe("");
      expect(result.current.resendCooldown).toBe(0);
      expect(result.current.otpError).toBe("");
      expect(result.current.emailLoading).toBe(false);
      expect(result.current.otpVerifying).toBe(false);
    });
  });

  // ── Cooldown timer ─────────────────────────────────────────────
  describe("cooldown timer", () => {
    it("should decrement resendCooldown every second", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      expect(result.current.resendCooldown).toBe(60);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.resendCooldown).toBe(59);

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(result.current.resendCooldown).toBe(58);

      vi.useRealTimers();
    });

    it("should stop at zero", async () => {
      vi.useFakeTimers();
      const { result } = renderHook(() => useEmailOtp());

      await act(async () => {
        await result.current.handleSendOtp("user@example.com");
      });

      act(() => {
        vi.advanceTimersByTime(60000);
      });

      expect(result.current.resendCooldown).toBe(0);

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current.resendCooldown).toBe(0);

      vi.useRealTimers();
    });
  });
});
