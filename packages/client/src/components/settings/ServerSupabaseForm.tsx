import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getSavedConnectionConfig } from "@/services/connectionService";
import { cn } from "@/shared/lib/cn";

interface ServerSupabaseFormProps {
  onConnect: (url: string, anonKey: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
}

/**
 * Implements FR1, FR2, NFR-A1 of simplify-backend-connection.
 * Supabase URL + Anon Key form with pre-fill from saved config.
 */
export function ServerSupabaseForm({
  onConnect,
  onCancel,
  isLoading,
  error,
}: ServerSupabaseFormProps) {
  const { t } = useTranslation();

  const savedConfig = getSavedConnectionConfig();
  const savedUrl = savedConfig?.type === "supabase" ? savedConfig.url : "";
  const savedAnonKey =
    savedConfig?.type === "supabase" ? savedConfig.anonKey : "";

  const [urlInput, setUrlInput] = useState(savedUrl);
  const [anonKeyInput, setAnonKeyInput] = useState(savedAnonKey);

  const isConnectDisabled =
    !urlInput.trim() || !anonKeyInput.trim() || isLoading;

  const handleSubmit = (): void => {
    onConnect(urlInput.trim(), anonKeyInput.trim());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="server-supabase-url-input"
          className="text-sm font-medium uppercase tracking-wide text-gray-500"
        >
          {t("settings.server.projectUrl")}
        </label>
        <input
          id="server-supabase-url-input"
          data-testid="server-supabase-url"
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
      </div>

      <div className="space-y-2">
        <label
          htmlFor="server-supabase-anon-key-input"
          className="text-sm font-medium uppercase tracking-wide text-gray-500"
        >
          {t("settings.server.anonKey")}
        </label>
        <input
          id="server-supabase-anon-key-input"
          data-testid="server-supabase-anon-key"
          type="text"
          value={anonKeyInput}
          onChange={(e) => setAnonKeyInput(e.target.value)}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 font-mono text-sm outline-none transition-colors focus:border-accent"
        />
      </div>

      {isLoading && (
        <div
          data-testid="server-supabase-loading"
          role="status"
          aria-live="polite"
          className="flex items-center gap-2 text-sm text-gray-500"
        >
          <span className="inline-block animate-spin">&#x27F3;</span>
          {t("settings.server.connecting")}
        </div>
      )}

      {error && (
        <div
          data-testid="server-supabase-error"
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          data-testid="server-supabase-cancel"
          onClick={onCancel}
          className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {t("settings.server.cancel")}
        </button>
        <button
          data-testid="server-supabase-connect"
          onClick={handleSubmit}
          disabled={isConnectDisabled}
          className={cn(
            "flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
            !isConnectDisabled
              ? "bg-accent text-white"
              : "cursor-not-allowed bg-gray-100 text-gray-400",
          )}
        >
          {t("settings.server.connect")}
        </button>
      </div>
    </div>
  );
}
