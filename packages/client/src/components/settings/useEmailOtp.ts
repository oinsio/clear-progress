import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { OTP_RESEND_COOLDOWN_MS, ROUTES } from "@/constants";
import { getSupabaseClient } from "@/services/supabaseClientManager";

const COOLDOWN_INTERVAL_MS = 1000;
const COOLDOWN_SECONDS = OTP_RESEND_COOLDOWN_MS / COOLDOWN_INTERVAL_MS;

export interface EmailOtpState {
  pendingEmail: string;
  resendCooldown: number;
  emailLoading: boolean;
  otpVerifying: boolean;
  otpError: string;
}

export interface EmailOtpHandlers {
  handleSendOtp: (email: string) => Promise<void>;
  handleVerifyOtp: (code: string) => Promise<void>;
  handleResendOtp: () => Promise<void>;
  resetOtpState: () => void;
}

/**
 * Implements FR2, FR4, FR7, FR9 of supabase-email-auth.
 * Encapsulates email OTP state and handlers for ServerSection.
 */
export function useEmailOtp(): EmailOtpState & EmailOtpHandlers {
  const { t } = useTranslation();
  const [pendingEmail, setPendingEmail] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailLoading, setEmailLoading] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpError, setOtpError] = useState("");

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const intervalId = setInterval(() => {
      setResendCooldown((previous) => Math.max(0, previous - 1));
    }, COOLDOWN_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [resendCooldown]);

  const sendOtpRequest = useCallback(
    async (email: string): Promise<boolean> => {
      const client = getSupabaseClient();
      const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}${ROUTES.SETTINGS.slice(1)}`;
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true, emailRedirectTo: redirectTo },
      });
      if (error) {
        setOtpError(
          error.message.includes("rate")
            ? t("settings.server.otpErrorRateLimit")
            : t("settings.server.otpErrorNetwork"),
        );
        return false;
      }
      return true;
    },
    [t],
  );

  const handleSendOtp = useCallback(
    async (email: string): Promise<void> => {
      setEmailLoading(true);
      setOtpError("");
      try {
        const isSuccess = await sendOtpRequest(email);
        if (isSuccess) {
          setPendingEmail(email);
          setResendCooldown(COOLDOWN_SECONDS);
        }
      } finally {
        setEmailLoading(false);
      }
    },
    [sendOtpRequest],
  );

  const handleVerifyOtp = useCallback(
    async (code: string): Promise<void> => {
      setOtpVerifying(true);
      setOtpError("");
      try {
        const client = getSupabaseClient();
        const { error } = await client.auth.verifyOtp({
          email: pendingEmail,
          token: code,
          type: "email",
        });
        if (error) {
          setOtpError(t("settings.server.otpErrorInvalid"));
        }
      } finally {
        setOtpVerifying(false);
      }
    },
    [pendingEmail, t],
  );

  const handleResendOtp = useCallback(async (): Promise<void> => {
    setOtpError("");
    const isSuccess = await sendOtpRequest(pendingEmail);
    if (isSuccess) {
      setResendCooldown(COOLDOWN_SECONDS);
    }
  }, [pendingEmail, sendOtpRequest]);

  const resetOtpState = useCallback((): void => {
    setPendingEmail("");
    setResendCooldown(0);
    setOtpError("");
    setEmailLoading(false);
    setOtpVerifying(false);
  }, []);

  return {
    pendingEmail,
    resendCooldown,
    emailLoading,
    otpVerifying,
    otpError,
    handleSendOtp,
    handleVerifyOtp,
    handleResendOtp,
    resetOtpState,
  };
}
