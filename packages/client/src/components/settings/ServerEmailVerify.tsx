import { useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/shared/lib/cn";

interface ServerEmailVerifyProps {
  email: string;
  onVerify: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
  isVerifying?: boolean;
  error?: string;
  resendCooldown: number;
}

const ZERO_PAD_WIDTH = 2;

function formatCooldown(seconds: number): string {
  const paddedSeconds = String(seconds).padStart(ZERO_PAD_WIDTH, "0");
  return `0:${paddedSeconds}`;
}

/**
 * Implements FR3, FR4, FR9, FR10, FR6, FR7, NFR-A1 of supabase-email-auth.
 * OTP verification form with resend cooldown and magic link hint.
 */
export function ServerEmailVerify({
  email,
  onVerify,
  onResend,
  onBack,
  isVerifying = false,
  error = "",
  resendCooldown,
}: ServerEmailVerifyProps) {
  const { t } = useTranslation();
  const [codeInput, setCodeInput] = useState("");

  const isVerifyDisabled = codeInput.length === 0 || isVerifying;
  const isCooldownActive = resendCooldown > 0;

  const handleVerify = (): void => {
    onVerify(codeInput);
    setCodeInput("");
  };

  return (
    <div className="space-y-4">
      <h2 data-testid="server-otp-title" className="text-lg font-semibold">
        {t("settings.server.otpTitle")}
      </h2>

      <p data-testid="server-otp-email" className="text-sm text-gray-500">
        {t("settings.server.codeSentTo", { email })}
      </p>

      <div className="space-y-2">
        <label
          htmlFor="server-otp-code-input"
          className="text-sm font-medium uppercase tracking-wide text-gray-500"
        >
          {t("settings.server.otpTitle")}
        </label>
        <input
          id="server-otp-code-input"
          data-testid="server-otp-input"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          value={codeInput}
          onChange={(e) => setCodeInput(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-center font-mono text-lg tracking-widest outline-none transition-colors focus:border-accent"
        />
      </div>

      <p data-testid="server-otp-hint" className="text-xs text-gray-400">
        {t("settings.server.otpHint")}
      </p>

      {error && (
        <div
          data-testid="server-otp-error"
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <button
        data-testid="server-otp-verify"
        onClick={handleVerify}
        disabled={isVerifyDisabled}
        className={cn(
          "w-full rounded-lg px-4 py-2 text-sm font-medium transition-colors",
          !isVerifyDisabled
            ? "bg-accent text-white"
            : "cursor-not-allowed bg-gray-100 text-gray-400",
        )}
      >
        {t("settings.server.verify")}
      </button>

      <div className="flex gap-2">
        <button
          data-testid="server-otp-back"
          onClick={onBack}
          className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200"
        >
          {t("settings.server.back")}
        </button>
        <button
          data-testid="server-otp-resend"
          onClick={onResend}
          disabled={isCooldownActive}
          aria-live="polite"
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            !isCooldownActive
              ? "bg-gray-100 text-gray-700 hover:bg-gray-200"
              : "cursor-not-allowed bg-gray-100 text-gray-400",
          )}
        >
          {isCooldownActive
            ? t("settings.server.resendCountdown", {
                time: formatCooldown(resendCooldown),
              })
            : t("settings.server.resend")}
        </button>
      </div>
    </div>
  );
}
