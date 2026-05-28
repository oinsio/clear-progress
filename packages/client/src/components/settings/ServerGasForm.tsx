import { useState } from "react";
import { useTranslation } from "react-i18next";
import { getSavedConfigForType } from "@/services/connectionService";
import { cn } from "@/shared/lib/cn";

interface ServerGasFormProps {
  onConnect: (url: string, clientId: string) => void;
  onCancel: () => void;
  isLoading: boolean;
  error: string;
}

/**
 * Implements FR1, FR3, NFR-A1 of simplify-backend-connection.
 * GAS Script URL + Client ID form with pre-fill from saved config.
 */
export function ServerGasForm({
  onConnect,
  onCancel,
  isLoading,
  error,
}: ServerGasFormProps) {
  const { t } = useTranslation();

  const savedConfig = getSavedConfigForType("gas");
  const savedUrl = savedConfig?.type === "gas" ? savedConfig.url : "";
  const savedClientId =
    savedConfig?.type === "gas" ? (savedConfig.clientId ?? "") : "";

  const [urlInput, setUrlInput] = useState(savedUrl);
  const [clientIdInput, setClientIdInput] = useState(savedClientId);

  const isConnectDisabled =
    !urlInput.trim() || !clientIdInput.trim() || isLoading;

  const handleSubmit = (): void => {
    onConnect(urlInput.trim(), clientIdInput.trim());
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label
          htmlFor="server-gas-url-input"
          className="text-sm font-medium uppercase tracking-wide text-gray-500"
        >
          {t("settings.server.scriptUrl")}
        </label>
        <input
          id="server-gas-url-input"
          data-testid="server-gas-url"
          type="text"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          placeholder={t("settings.server.scriptUrlPlaceholder")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-gray-400">
          {t("settings.server.scriptUrlDescription")}
        </p>
      </div>

      <div className="space-y-2">
        <label
          htmlFor="server-gas-client-id-input"
          className="text-sm font-medium uppercase tracking-wide text-gray-500"
        >
          {t("settings.server.clientId")}
        </label>
        <input
          id="server-gas-client-id-input"
          data-testid="server-gas-client-id"
          type="text"
          value={clientIdInput}
          onChange={(e) => setClientIdInput(e.target.value)}
          placeholder={t("settings.server.clientIdPlaceholder")}
          className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm outline-none transition-colors focus:border-accent"
        />
        <p className="text-xs text-gray-400">
          {t("settings.server.clientIdDescription")}
        </p>
      </div>

      {isLoading && (
        <div
          data-testid="server-gas-loading"
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
          data-testid="server-gas-error"
          role="alert"
          aria-live="polite"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex gap-2">
        <button
          data-testid="server-gas-cancel"
          onClick={onCancel}
          className="flex-1 rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 transition-colors"
        >
          {t("settings.server.cancel")}
        </button>
        <button
          data-testid="server-gas-connect"
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
